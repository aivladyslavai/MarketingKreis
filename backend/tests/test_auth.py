from fastapi import status


def register_user(client, email: str = "user@example.com", password: str = "password123"):
    resp = client.post(
        "/auth/register",
        json={
            "email": email,
            "password": password,
            "name": "Test User",
        },
    )
    assert resp.status_code == status.HTTP_200_OK
    data = resp.json()
    assert data["email"] == email
    assert "id" in data
    assert "role" in data
    return email, password


def login(client, email: str, password: str):
    resp = client.post("/auth/login", json={"email": email, "password": password})
    return resp


def test_register_and_login_success_flow(client):
    """User can register and then log in; cookies are issued."""
    email, password = register_user(client)

    resp = login(client, email, password)
    assert resp.status_code == status.HTTP_200_OK
    body = resp.json()
    assert body["message"] == "ok"
    assert body["user"]["email"] == email

    # Access token must be set as cookie, not only in body
    set_cookie = resp.headers.get("set-cookie") or ""
    assert "access_token" in set_cookie


def test_login_invalid_credentials(client):
    """Invalid password yields 401 and no cookies."""
    email, password = register_user(client, email="wrong@test.com", password="correct-pass")

    resp = login(client, email, "bad-pass")
    assert resp.status_code == status.HTTP_401_UNAUTHORIZED
    assert resp.json()["detail"] == "Invalid credentials"


def test_profile_requires_auth(client):
    """Profile is protected by auth cookie."""
    # Without login -> 401
    resp = client.get("/auth/profile")
    assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    # After login -> 200
    email, password = register_user(client, email="profile@test.com")
    resp_login = login(client, email, password)
    assert resp_login.status_code == status.HTTP_200_OK

    resp_profile = client.get("/auth/profile")
    assert resp_profile.status_code == status.HTTP_200_OK
    data = resp_profile.json()
    assert data["email"] == email
