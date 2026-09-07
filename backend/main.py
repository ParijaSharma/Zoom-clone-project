from fastapi import FastAPI, WebSocket, Query
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
import models
from routers.meetings import router as meetings_router
from routers.participants import router as participants_router
from signaling.signaling import handle_websocket_signaling


# Initialize SQLite tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Zoom Clone API",
    description="High-performance backend for Zoom Clone web app with WebSockets & WebRTC signaling",
    version="1.0.0"
)

# Allow Next.js frontend across localhost / dev ports
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# REST API Routers
app.include_router(meetings_router)
app.include_router(participants_router)


# WebRTC Signaling WebSocket Endpoint
@app.websocket("/ws/meeting/{meeting_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    meeting_id: str,
    client_id: str = Query(..., description="Unique client identifier"),
    display_name: str = Query("Guest", description="User's display name"),
    is_host: bool = Query(False, description="Whether the user is the meeting host")
):
    """
    WebSocket endpoint for bidirectional real-time communication:
    - WebRTC SDP Offer / Answer exchange
    - ICE candidate trickle
    - In-meeting chat broadcast
    - Media status sync (audio mute / video off)
    - Host controls (mute all, kick participant)
    """
    await handle_websocket_signaling(
        websocket=websocket,
        meeting_id=meeting_id,
        client_id=client_id,
        display_name=display_name,
        is_host=is_host
    )


@app.get("/")
def root():
    return {
        "service": "Zoom Clone API",
        "status": "online",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "database": "connected"
    }