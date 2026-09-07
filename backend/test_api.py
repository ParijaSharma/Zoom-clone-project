"""
Backend integration test suite for Zoom Clone API.
Tests REST endpoints and WebSocket signaling using FastAPI TestClient.
"""

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    print("[PASS] Health check passed")


def test_get_meetings():
    response = client.get("/api/meetings")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    print(f"[PASS] Get all meetings passed ({len(data)} meetings)")


def test_upcoming_and_recent_filters():
    upcoming_res = client.get("/api/meetings?type=upcoming")
    assert upcoming_res.status_code == 200
    upcoming = upcoming_res.json()
    print(f"[PASS] Upcoming filter passed ({len(upcoming)} upcoming meetings)")

    recent_res = client.get("/api/meetings?type=recent")
    assert recent_res.status_code == 200
    recent = recent_res.json()
    print(f"[PASS] Recent filter passed ({len(recent)} recent meetings)")


def test_create_and_get_meeting():
    payload = {
        "title": "Automated Test Meeting",
        "description": "Integration test created meeting",
        "duration": 30,
        "host_name": "Parija Sharma"
    }
    create_res = client.post("/api/meetings", json=payload)
    assert create_res.status_code == 200
    meeting = create_res.json()
    meeting_id = meeting["meeting_id"]
    assert meeting["title"] == "Automated Test Meeting"
    print(f"[PASS] Create meeting passed (ID: {meeting_id})")

    # Get single meeting
    get_res = client.get(f"/api/meetings/{meeting_id}")
    assert get_res.status_code == 200
    assert get_res.json()["meeting_id"] == meeting_id
    print(f"[PASS] Get single meeting passed for ID {meeting_id}")

    # Join participant
    join_res = client.post(
        f"/api/meetings/{meeting_id}/participants",
        json={"display_name": "Test Peer", "is_host": False}
    )
    assert join_res.status_code == 200
    assert join_res.json()["display_name"] == "Test Peer"
    print("[PASS] Join participant passed")


def test_websocket_signaling():
    meeting_id = "test_meeting_123"
    client_id = "client_alpha"

    with client.websocket_connect(f"/ws/meeting/{meeting_id}?client_id={client_id}&display_name=Alpha&is_host=true") as ws:
        # Initial roster should be received
        initial_msg = ws.receive_json()
        assert initial_msg["type"] == "room-roster"
        assert initial_msg["self_id"] == client_id
        print("[PASS] WebSocket connection & room-roster passed")

        # Test sending in-meeting chat message
        ws.send_json({
            "type": "chat-message",
            "text": "Hello from automated test!"
        })
        chat_broadcast = ws.receive_json()
        assert chat_broadcast["type"] == "chat-message"
        assert chat_broadcast["text"] == "Hello from automated test!"
        print("[PASS] WebSocket chat message broadcast passed")

        # Test emoji reaction
        ws.send_json({
            "type": "reaction",
            "emoji": "🎉"
        })
        reaction_broadcast = ws.receive_json()
        assert reaction_broadcast["type"] == "reaction"
        assert reaction_broadcast["emoji"] == "🎉"
        print("[PASS] WebSocket emoji reaction broadcast passed")


if __name__ == "__main__":
    test_health()
    test_get_meetings()
    test_upcoming_and_recent_filters()
    test_create_and_get_meeting()
    test_websocket_signaling()
    print("\nALL BACKEND INTEGRATION TESTS PASSED SUCCESSFULLY! [SUCCESS]")
