import io
from fastapi import status


def register_and_login_admin(client, email: str = "admin@example.com", password: str = "password123"):
    # First user becomes admin according to current auth implementation
    r = client.post("/auth/register", json={"email": email, "password": password, "name": "Admin"})
    assert r.status_code == status.HTTP_200_OK
    r = client.post("/auth/login", json={"email": email, "password": password})
    assert r.status_code == status.HTTP_200_OK


def test_upload_creates_job_and_is_listed(client):
    """Uploading a CSV as an authenticated user enqueues a job visible via /jobs."""
    register_and_login_admin(client)

    content = b"title,category,budgetCHF,status\nTest,VERKAUFSFOERDERUNG,100,ACTIVE\n"
    files = {"file": ("test.csv", io.BytesIO(content), "text/csv")}
    r = client.post("/uploads", files=files)
    assert r.status_code == status.HTTP_200_OK
    data = r.json()
    assert data["ok"] is True

    # Jobs endpoint should list at least one job
    r = client.get("/jobs")
    assert r.status_code == status.HTTP_200_OK
    jobs = r.json()
    assert isinstance(jobs, dict)
    assert "items" in jobs
    assert len(jobs["items"]) >= 1


