#!/usr/bin/env python3
"""
Production smoke test (backend-only).

Flow:
- health
- register
- login (cookie-based)
- upload CSV -> import activities
- verify uploads + activities + crm stats

Usage:
  SMOKE_BACKEND_URL="https://marketingkreis-cimu.onrender.com" python3 scripts/prod_smoke_backend.py
"""

from __future__ import annotations

import json
import os
import time
import uuid
from dataclasses import dataclass
from http.cookiejar import CookieJar
from typing import Dict, Tuple
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin
from urllib.request import HTTPCookieProcessor, Request, build_opener


def _now_iso() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def _json_loads(text: str):
    try:
        return json.loads(text)
    except Exception:
        return None


def _multipart_encode(fields: Dict[str, str], files: Dict[str, Tuple[str, str, bytes]]):
    boundary = "----mk-smoke-" + uuid.uuid4().hex
    crlf = b"\r\n"
    body = bytearray()

    for name, value in fields.items():
        body.extend(f"--{boundary}".encode("utf-8"))
        body.extend(crlf)
        body.extend(f'Content-Disposition: form-data; name="{name}"'.encode("utf-8"))
        body.extend(crlf)
        body.extend(crlf)
        body.extend(value.encode("utf-8"))
        body.extend(crlf)

    for field, (filename, content_type, data) in files.items():
        body.extend(f"--{boundary}".encode("utf-8"))
        body.extend(crlf)
        body.extend(
            f'Content-Disposition: form-data; name="{field}"; filename="{filename}"'.encode("utf-8")
        )
        body.extend(crlf)
        body.extend(f"Content-Type: {content_type}".encode("utf-8"))
        body.extend(crlf)
        body.extend(crlf)
        body.extend(data)
        body.extend(crlf)

    body.extend(f"--{boundary}--".encode("utf-8"))
    body.extend(crlf)
    return boundary, bytes(body)


@dataclass
class HttpResp:
    status: int
    text: str

    @property
    def json(self):
        return _json_loads(self.text)


class Client:
    def __init__(self, base: str):
        self.base = base.rstrip("/") + "/"
        self.cookies = CookieJar()
        self.opener = build_opener(HTTPCookieProcessor(self.cookies))

    def _request(self, method: str, path: str, body: bytes | None = None, headers: Dict[str, str] | None = None) -> HttpResp:
        url = urljoin(self.base, path.lstrip("/"))
        h = {"Accept": "application/json", **(headers or {})}
        req = Request(url, data=body, headers=h, method=method)
        try:
            with self.opener.open(req, timeout=30) as r:
                txt = r.read().decode("utf-8", errors="ignore")
                return HttpResp(status=getattr(r, "status", 200), text=txt)
        except HTTPError as e:
            txt = e.read().decode("utf-8", errors="ignore") if hasattr(e, "read") else str(e)
            return HttpResp(status=getattr(e, "code", 0) or 0, text=txt)
        except URLError as e:
            return HttpResp(status=0, text=str(e))

    def get(self, path: str) -> HttpResp:
        return self._request("GET", path)

    def post_json(self, path: str, payload: dict) -> HttpResp:
        body = json.dumps(payload).encode("utf-8")
        return self._request("POST", path, body=body, headers={"Content-Type": "application/json"})

    def post_multipart(self, path: str, fields: Dict[str, str], files: Dict[str, Tuple[str, str, bytes]]) -> HttpResp:
        boundary, body = _multipart_encode(fields, files)
        return self._request(
            "POST",
            path,
            body=body,
            headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
        )


def main() -> int:
    base = os.getenv("SMOKE_BACKEND_URL", "https://marketingkreis-cimu.onrender.com")
    c = Client(base)

    run_id = str(int(time.time()))
    email = f"e2e-smoke-{run_id}@marketingkreis.ch"
    password = f"SmokePass-{run_id}!"
    activity_title = f"E2E Smoke Activity {run_id}"
    upload_name = f"e2e-smoke-{run_id}.csv"
    company_name = f"E2E Smoke Company {run_id}"

    print(f"[{_now_iso()}] smoke start")
    print(f"base: {base}")
    print(f"user: {email}")

    # 0) Health
    h = c.get("/health")
    if h.status != 200:
        print(f"FAIL health: {h.status} {h.text[:300]}")
        return 2
    print("OK health")

    # 1) Register
    reg = c.post_json("/auth/register", {"email": email, "password": password, "name": "E2E Smoke"})
    if reg.status != 200:
        print(f"FAIL register: {reg.status} {reg.text[:500]}")
        return 3
    print("OK register")

    # 2) Login
    login = c.post_json("/auth/login", {"email": email, "password": password})
    if login.status != 200:
        print(f"FAIL login: {login.status} {login.text[:500]}")
        return 4
    print("OK login")

    prof = c.get("/auth/profile")
    if prof.status != 200:
        print(f"FAIL profile: {prof.status} {prof.text[:500]}")
        return 5
    print("OK profile")

    # 3) Create CRM company with extra fields (verifies DB schema sync)
    company_payload = {
        "name": company_name,
        "industry": "Technology",
        "website": "https://company.com",
        "email": "contact@company.com",
        "phone": "+41 44 123 45 67",
        "status": "prospect",
        "employees": 12,
        "revenue": 500000,
        "address": "Street 1, 8000 Zürich",
        "notes": "prod-smoke",
        "contact_person_name": "Max Mustermann",
        "contact_person_position": "Marketing Manager",
        "contact_person_email": "max@company.com",
        "contact_person_phone": "+41 44 111 22 33",
        "vat_id": "CHE-123.456.789",
        "lead_source": "Website",
        "priority": "medium",
        "next_follow_up_at": "2026-02-01T00:00:00Z",
        "linkedin_url": "https://www.linkedin.com/company/company",
        "tags": "smoke,crm",
    }
    comp = c.post_json("/crm/companies", company_payload)
    if comp.status != 200:
        print(f"FAIL crm company create: {comp.status} {comp.text[:800]}")
        return 6
    comp_obj = comp.json if isinstance(comp.json, dict) else None
    if not isinstance(comp_obj, dict) or comp_obj.get("name") != company_name:
        print(f"FAIL crm company create shape: {comp.status} {comp.text[:800]}")
        return 7
    # Basic sanity on new fields (must not crash / must be present)
    if comp_obj.get("contact_person_name") != "Max Mustermann":
        print("FAIL crm company field contact_person_name mismatch")
        return 8
    if comp_obj.get("vat_id") != "CHE-123.456.789":
        print("FAIL crm company field vat_id mismatch")
        return 9
    print("OK crm company create (+extra fields)")

    # 4) Create Calendar event with recurrence (verifies calendar sync)
    cal_title = f"E2E Smoke Calendar {run_id}"
    cal_payload = {
        "title": cal_title,
        "description": "prod-smoke calendar",
        "type": "meeting",
        "status": "PLANNED",
        "color": "#3b82f6",
        "category": "meeting",
        "priority": "medium",
        "start": "2026-01-10T09:00:00Z",
        "end": "2026-01-10T10:00:00Z",
        "recurrence": {"freq": "weekly", "interval": 1, "count": 3},
    }
    cal = c.post_json("/calendar", cal_payload)
    if cal.status != 200:
        print(f"FAIL calendar create: {cal.status} {cal.text[:800]}")
        return 10
    cal_obj = cal.json if isinstance(cal.json, dict) else None
    if not isinstance(cal_obj, dict) or cal_obj.get("title") != cal_title:
        print(f"FAIL calendar create shape: {cal.status} {cal.text[:800]}")
        return 11
    cal_id = cal_obj.get("id")
    if not cal_id:
        print("FAIL calendar create missing id")
        return 12

    cal_list = c.get("/calendar")
    if cal_list.status != 200:
        print(f"FAIL calendar list: {cal_list.status} {cal_list.text[:500]}")
        return 13
    cal_arr = cal_list.json if isinstance(cal_list.json, list) else None
    if not isinstance(cal_arr, list) or not any(
        isinstance(e, dict) and str(e.get("id")) == str(cal_id) for e in cal_arr
    ):
        print(f"FAIL calendar list missing event: {cal_list.text[:800]}")
        return 14

    found = next(
        (e for e in cal_arr if isinstance(e, dict) and str(e.get("id")) == str(cal_id)), None
    )
    if isinstance(found, dict) and isinstance(found.get("recurrence"), dict):
        print("OK calendar create (+recurrence)")
    else:
        print("WARN calendar recurrence not returned (backend may be outdated)")

    # 5) Upload + import
    csv = (
        "title,category,status,budgetCHF,weight,start,end,notes\n"
        + f"{activity_title},VERKAUFSFOERDERUNG,ACTIVE,123,1,2026-01-01,2026-01-02,prod-smoke\n"
    ).encode("utf-8")
    mapping = json.dumps(
        {
            "title": "title",
            "category": "category",
            "status": "status",
            "budget": "budgetCHF",
            "notes": "notes",
            "start": "start",
            "end": "end",
            "weight": "weight",
        }
    )
    up = c.post_multipart(
        "/uploads",
        fields={"mapping": mapping},
        files={"file": (upload_name, "text/csv", csv)},
    )
    if up.status != 200:
        print(f"FAIL upload: {up.status} {up.text[:800]}")
        return 20
    print("OK upload/import")

    # 6) Verify uploads
    ups = c.get("/uploads")
    if ups.status != 200:
        print(f"FAIL uploads list: {ups.status} {ups.text[:500]}")
        return 21
    items = (ups.json or {}).get("items") if isinstance(ups.json, dict) else None
    if not isinstance(items, list) or len(items) == 0:
        print(f"FAIL uploads list shape: {ups.text[:500]}")
        return 22
    print(f"OK uploads list ({len(items)} items)")

    # 7) Verify activities contains imported title
    acts = c.get("/activities")
    if acts.status != 200:
        print(f"FAIL activities: {acts.status} {acts.text[:500]}")
        return 23
    arr = acts.json if isinstance(acts.json, list) else None
    if not isinstance(arr, list):
        print(f"FAIL activities shape: {acts.text[:500]}")
        return 24
    if not any(str(a.get("title") or "") == activity_title for a in arr if isinstance(a, dict)):
        print("FAIL activity not found after import")
        return 25
    print("OK activities import verified")

    # 8) CRM stats reachable
    stats = c.get("/crm/stats")
    if stats.status != 200:
        print(f"FAIL crm stats: {stats.status} {stats.text[:500]}")
        return 26
    s = stats.json if isinstance(stats.json, dict) else None
    if not isinstance(s, dict) or "totalCompanies" not in s:
        print(f"FAIL crm stats shape: {stats.text[:500]}")
        return 27
    print("OK crm stats")

    print(f"[{_now_iso()}] smoke PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

