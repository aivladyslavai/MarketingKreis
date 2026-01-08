from fastapi import status


def login_and_auth(client, email: str = "a@a.com", password: str = "password123"):
  # Register user
  r = client.post("/auth/register", json={"email": email, "password": password, "name": "A"})
  assert r.status_code == status.HTTP_200_OK
  # Login (sets auth cookies on client)
  r = client.post("/auth/login", json={"email": email, "password": password})
  assert r.status_code == status.HTTP_200_OK


def test_activities_crud(client):
  login_and_auth(client)
  # Create activity
  r = client.post("/activities", json={"title": "Act1", "category": "VERKAUFSFOERDERUNG"})
  assert r.status_code == status.HTTP_200_OK
  act = r.json()

  # List activities for current user
  r = client.get("/activities")
  assert r.status_code == status.HTTP_200_OK
  assert any(a["id"] == act["id"] for a in r.json())

  # Update activity
  r = client.put(f"/activities/{act['id']}", json={"status": "COMPLETED", "notes": "done"})
  assert r.status_code == status.HTTP_200_OK
  updated = r.json()
  assert updated["status"] == "COMPLETED"

  # Delete activity
  r = client.delete(f"/activities/{act['id']}")
  assert r.status_code == status.HTTP_200_OK
  assert r.json()["ok"] is True


def test_calendar_and_performance(client):
  login_and_auth(client)
  # create simple calendar event
  r = client.post(
    "/calendar",
    json={
      "title": "Meeting",
      "description": "Test event",
      "start": "2025-01-01T09:00:00",
      "end": "2025-01-01T10:00:00",
      "type": "event",
    },
  )
  assert r.status_code == status.HTTP_200_OK

  # list calendar events
  r = client.get("/calendar")
  assert r.status_code == status.HTTP_200_OK
  events = r.json()
  assert isinstance(events, list)
  assert len(events) >= 1

  # performance endpoint aggregates data and is reachable
  r = client.get("/performance")
  assert r.status_code == status.HTTP_200_OK
  perf = r.json()
  assert "year" in perf
  assert "totalRevenue" in perf


