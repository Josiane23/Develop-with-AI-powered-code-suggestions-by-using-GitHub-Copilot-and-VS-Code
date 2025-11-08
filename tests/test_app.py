import uuid

from fastapi.testclient import TestClient

from src.app import app, activities


client = TestClient(app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # Known activity present
    assert "Chess Club" in data


def test_signup_and_remove_participant_flow():
    # Use a unique email to avoid collisions with existing fixtures
    email = f"testuser+{uuid.uuid4().hex[:8]}@example.com"
    activity_name = "Chess Club"

    # Ensure the participant is not already present
    assert email not in activities[activity_name]["participants"]

    # Sign up
    resp = client.post(f"/activities/{activity_name}/signup", params={"email": email})
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert "Signed up" in body.get("message", "")

    # Verify participant appears in listing
    resp = client.get("/activities")
    data = resp.json()
    assert email in data[activity_name]["participants"]

    # Attempt to sign up again -> should fail with 400
    resp = client.post(f"/activities/{activity_name}/signup", params={"email": email})
    assert resp.status_code == 400

    # Remove participant
    resp = client.delete(f"/activities/{activity_name}/participants", params={"email": email})
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert "Removed" in body.get("message", "")

    # Ensure participant no longer present
    resp = client.get("/activities")
    data = resp.json()
    assert email not in data[activity_name]["participants"]

    # Removing again should return 404
    resp = client.delete(f"/activities/{activity_name}/participants", params={"email": email})
    assert resp.status_code == 404
