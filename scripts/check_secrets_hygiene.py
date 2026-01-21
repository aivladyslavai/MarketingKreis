#!/usr/bin/env python3
"""
Repository secrets / env hygiene check.

Goals:
- Ensure no local `.env*` files are tracked by git.
- Ensure no `env.local`-style files are tracked (these are meant to be local).
- Ensure Docker build contexts ignore env/secrets files (to avoid leaking into images).

This script is intentionally conservative and should run in CI and pre-commit.
"""

from __future__ import annotations

import os
import re
import subprocess
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]


def _run(cmd: list[str]) -> str:
    out = subprocess.check_output(cmd, cwd=str(REPO_ROOT))
    return out.decode("utf-8", errors="replace")


def git_tracked_files() -> list[str]:
    out = _run(["git", "ls-files", "-z"])
    return [p for p in out.split("\x00") if p]

def git_staged_deletions() -> set[str]:
    """
    Return files that are staged for deletion (so we don't fail while removing them).
    """
    try:
        out = _run(["git", "diff", "--cached", "--name-status", "-z"])
    except Exception:
        return set()
    parts = [p for p in out.split("\x00") if p]
    deleted: set[str] = set()
    i = 0
    while i < len(parts):
        status = parts[i]
        # status is like "D\tpath" in non -z mode, but in -z mode it's split as: "D" then "path"
        if status == "D" and i + 1 < len(parts):
            deleted.add(parts[i + 1])
            i += 2
            continue
        # Renames etc: we ignore
        i += 1
    return deleted


def read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8", errors="replace")
    except Exception:
        return ""


def ensure(condition: bool, msg: str) -> None:
    if not condition:
        raise AssertionError(msg)


def main() -> int:
    tracked = git_tracked_files()
    staged_deleted = git_staged_deletions()

    # 1) Hard-block tracked .env files
    forbidden_tracked = []
    for p in tracked:
        if p in staged_deleted:
            continue
        name = Path(p).name
        if name == ".env" or name.startswith(".env."):
            forbidden_tracked.append(p)
        if name.startswith(".env") and name != ".env.sample":
            forbidden_tracked.append(p)
        if name == ".env.secrets.generated":
            forbidden_tracked.append(p)
        if name == "env.local" or name.endswith(".local") and name.startswith("env."):
            # env.local / env.*.local must never be tracked
            forbidden_tracked.append(p)
        if p.endswith("/env.local") or p.endswith("/env.staging.local") or p.endswith("/env.production.local"):
            forbidden_tracked.append(p)
        if name == "cookies.txt" or name.startswith("cookies") and name.endswith(".txt"):
            forbidden_tracked.append(p)

    forbidden_tracked = sorted(set(forbidden_tracked))
    ensure(
        not forbidden_tracked,
        "Forbidden env/local files are tracked by git:\n- " + "\n- ".join(forbidden_tracked),
    )

    # 2) Ensure dockerignore exists for docker build contexts and ignores env files
    dockerignore_required = [
        REPO_ROOT / ".dockerignore",
        REPO_ROOT / "backend" / ".dockerignore",
        REPO_ROOT / "frontend" / ".dockerignore",
    ]
    for di in dockerignore_required:
        ensure(di.exists(), f"Missing required dockerignore: {di.relative_to(REPO_ROOT)}")
        txt = read_text(di)
        ensure(".env" in txt or ".env*" in txt, f"{di.relative_to(REPO_ROOT)} must ignore .env* files")
        ensure("env.local" in txt or "env.*.local" in txt, f"{di.relative_to(REPO_ROOT)} must ignore env.local files")

    # 3) Heuristic scan for obvious secret material in tracked files (very lightweight)
    #    We keep this intentionally strict for env templates: they must use placeholders.
    env_templates = {"env.development", "env.staging", "env.production", "env.example", "frontend/env.example"}
    suspicious_patterns = [
        re.compile(r"-----BEGIN (?:RSA |EC )?PRIVATE KEY-----"),
        re.compile(r"\bAKIA[0-9A-Z]{16}\b"),  # AWS access key
        re.compile(r"\bsk-[A-Za-z0-9]{20,}\b"),  # OpenAI-like
    ]

    for rel in env_templates:
        path = REPO_ROOT / rel
        if not path.exists():
            continue
        txt = read_text(path)
        # env templates must not contain real secrets
        for rx in suspicious_patterns:
            if rx.search(txt):
                raise AssertionError(f"Suspicious secret-like value found in {rel}")

    print("secrets hygiene: OK")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except AssertionError as e:
        print(f"secrets hygiene: FAIL\n{e}", file=sys.stderr)
        returncode = 1
        sys.exit(returncode)

