import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional
from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger("signaling")
logger.setLevel(logging.INFO)


class ConnectionManager:
    """
    Manages active WebSocket connections grouped by meeting_id.
    Handles WebRTC SDP offer/answer/ICE candidate relay,
    in-meeting chat broadcast, and host controls (mute-all, kick).
    """

    def __init__(self):
        # meeting_id -> {client_id: WebSocket}
        self.active_rooms: Dict[str, Dict[str, WebSocket]] = {}
        # meeting_id -> {client_id: {display_name, is_host, is_muted, is_video_off}}
        self.peers_meta: Dict[str, Dict[str, Dict[str, Any]]] = {}

    async def connect(
        self,
        websocket: WebSocket,
        meeting_id: str,
        client_id: str,
        display_name: str,
        is_host: bool = False
    ):
        await websocket.accept()

        if meeting_id not in self.active_rooms:
            self.active_rooms[meeting_id] = {}
            self.peers_meta[meeting_id] = {}

        self.active_rooms[meeting_id][client_id] = websocket
        self.peers_meta[meeting_id][client_id] = {
            "client_id": client_id,
            "display_name": display_name,
            "is_host": is_host,
            "is_muted": False,
            "is_video_off": False,
            "joined_at": datetime.utcnow().isoformat()
        }

        logger.info(f"Client {client_id} ({display_name}) connected to room {meeting_id}")

        # 1. Send current room roster to the newly joined peer
        roster = [
            meta for cid, meta in self.peers_meta[meeting_id].items()
            if cid != client_id
        ]
        await websocket.send_text(json.dumps({
            "type": "room-roster",
            "self_id": client_id,
            "peers": roster
        }))

        # 2. Broadcast peer-joined to all other participants
        await self.broadcast(
            meeting_id,
            {
                "type": "peer-joined",
                "peer": self.peers_meta[meeting_id][client_id]
            },
            exclude_client_id=client_id
        )

    async def disconnect(self, meeting_id: str, client_id: str):
        if meeting_id in self.active_rooms and client_id in self.active_rooms[meeting_id]:
            del self.active_rooms[meeting_id][client_id]

        peer_meta = None
        if meeting_id in self.peers_meta and client_id in self.peers_meta[meeting_id]:
            peer_meta = self.peers_meta[meeting_id].pop(client_id, None)

        if meeting_id in self.active_rooms and len(self.active_rooms[meeting_id]) == 0:
            del self.active_rooms[meeting_id]
            self.peers_meta.pop(meeting_id, None)
            logger.info(f"Room {meeting_id} is empty and was cleaned up")
        else:
            await self.broadcast(
                meeting_id,
                {
                    "type": "peer-left",
                    "client_id": client_id,
                    "display_name": peer_meta.get("display_name") if peer_meta else "Participant"
                }
            )

        logger.info(f"Client {client_id} disconnected from room {meeting_id}")

    async def send_to_client(self, meeting_id: str, target_client_id: str, message: dict):
        if meeting_id in self.active_rooms:
            target_ws = self.active_rooms[meeting_id].get(target_client_id)
            if target_ws:
                try:
                    await target_ws.send_text(json.dumps(message))
                except Exception as e:
                    logger.error(f"Failed to send to {target_client_id}: {e}")

    async def broadcast(self, meeting_id: str, message: dict, exclude_client_id: Optional[str] = None):
        if meeting_id not in self.active_rooms:
            return

        payload = json.dumps(message)
        dead_clients = []

        for cid, ws in self.active_rooms[meeting_id].items():
            if cid == exclude_client_id:
                continue
            try:
                await ws.send_text(payload)
            except Exception as e:
                logger.error(f"Error broadcasting to {cid}: {e}")
                dead_clients.append(cid)

        for dead_id in dead_clients:
            await self.disconnect(meeting_id, dead_id)

    def get_participants(self, meeting_id: str):
        if meeting_id in self.peers_meta:
            return list(self.peers_meta[meeting_id].values())
        return []


manager = ConnectionManager()


async def handle_websocket_signaling(
    websocket: WebSocket,
    meeting_id: str,
    client_id: str,
    display_name: str,
    is_host: bool = False
):
    await manager.connect(websocket, meeting_id, client_id, display_name, is_host)

    try:
        while True:
            raw_data = await websocket.receive_text()
            data = json.loads(raw_data)
            msg_type = data.get("type")

            if msg_type == "offer":
                target_peer_id = data.get("target_peer_id")
                await manager.send_to_client(
                    meeting_id,
                    target_peer_id,
                    {
                        "type": "offer",
                        "from_peer_id": client_id,
                        "from_display_name": display_name,
                        "sdp": data.get("sdp")
                    }
                )

            elif msg_type == "answer":
                target_peer_id = data.get("target_peer_id")
                await manager.send_to_client(
                    meeting_id,
                    target_peer_id,
                    {
                        "type": "answer",
                        "from_peer_id": client_id,
                        "sdp": data.get("sdp")
                    }
                )

            elif msg_type == "ice-candidate":
                target_peer_id = data.get("target_peer_id")
                await manager.send_to_client(
                    meeting_id,
                    target_peer_id,
                    {
                        "type": "ice-candidate",
                        "from_peer_id": client_id,
                        "candidate": data.get("candidate")
                    }
                )

            elif msg_type == "chat-message":
                chat_payload = {
                    "type": "chat-message",
                    "sender_id": client_id,
                    "sender_name": display_name,
                    "text": data.get("text", ""),
                    "timestamp": datetime.utcnow().strftime("%I:%M %p")
                }
                await manager.broadcast(meeting_id, chat_payload)

            elif msg_type == "media-toggle":
                kind = data.get("kind")
                enabled = data.get("enabled", True)

                if meeting_id in manager.peers_meta and client_id in manager.peers_meta[meeting_id]:
                    if kind == "audio":
                        manager.peers_meta[meeting_id][client_id]["is_muted"] = not enabled
                    elif kind == "video":
                        manager.peers_meta[meeting_id][client_id]["is_video_off"] = not enabled

                await manager.broadcast(
                    meeting_id,
                    {
                        "type": "media-toggle",
                        "client_id": client_id,
                        "kind": kind,
                        "enabled": enabled
                    },
                    exclude_client_id=client_id
                )

            elif msg_type == "host-mute-all":
                if is_host:
                    await manager.broadcast(
                        meeting_id,
                        {
                            "type": "host-mute-all",
                            "by_host": display_name
                        },
                        exclude_client_id=client_id
                    )

            elif msg_type == "host-remove-participant":
                target_peer_id = data.get("target_peer_id")
                if is_host and target_peer_id:
                    await manager.send_to_client(
                        meeting_id,
                        target_peer_id,
                        {
                            "type": "kicked",
                            "reason": f"You were removed by host {display_name}."
                        }
                    )
                    await manager.disconnect(meeting_id, target_peer_id)

            elif msg_type == "reaction":
                emoji = data.get("emoji", "👍")
                await manager.broadcast(
                    meeting_id,
                    {
                        "type": "reaction",
                        "sender_id": client_id,
                        "sender_name": display_name,
                        "emoji": emoji
                    }
                )

    except WebSocketDisconnect:
        await manager.disconnect(meeting_id, client_id)
    except Exception as e:
        logger.error(f"WebSocket error for client {client_id}: {e}")
        await manager.disconnect(meeting_id, client_id)
