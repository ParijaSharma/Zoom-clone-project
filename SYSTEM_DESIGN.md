# System Design & Architecture: Zoom Clone Platform

This document outlines the architectural design, communication protocols, media transmission pipelines, database modeling, and scalability strategies for the Zoom Clone full-stack video conferencing platform.

---

## 1. High-Level Architectural Overview

The application is structured into two decoupled planes:
1. **Control & Signaling Plane**: Handles meeting lifecycle management, authentication/identity, room rosters, participant state synchronization, and WebRTC session negotiation over HTTP/REST and WebSockets.
2. **Media Plane**: Handles direct real-time peer-to-peer transmission of audio, video, and screen-sharing media streams via WebRTC (`RTCPeerConnection`).

```
                              ┌─────────────────────────────────────────────────┐
                              │                 Next.js Frontend                │
                              │        (Single Page Application / React 19)     │
                              └────────┬───────────────────────────────┬────────┘
                                       │                               │
                                       │ HTTP / REST                   │ WebSockets
                                       │ (Port 8000)                   │ (ws://localhost:8000)
                                       ▼                               ▼
                     ┌───────────────────────────────────┐    ┌───────────────────────────────────┐
                     │          FastAPI Server           │    │     FastAPI WebSocket Manager     │
                     │  - Meeting CRUD & Scheduling      │    │  - WebRTC SDP Offer/Answer Relay  │
                     │  - Participant Lifecycle Records  │    │  - ICE Candidate Exchange         │
                     │  - Validation & Security Policies │    │  - In-Meeting Chat Broadcast      │
                     └─────────────────┬─────────────────┘    │  - Host Commands (Mute All, Kick) │
                                       │                      └─────────────────┬─────────────────┘
                                       │ SQLAlchemy ORM                         │
                                       ▼                                        ▼
                              ┌─────────────────┐                      ┌─────────────────┐
                              │  SQLite zoom.db │                      │ In-Memory State │
                              │ (ACID Relational│                      │  (Room Rosters) │
                              │   Data Store)   │                      └─────────────────┘
                              └─────────────────┘
                                                                        ▲             ▲
                                                ┌───────────────────────┘             └───────────────────────┐
                                                │                                                             │
                                        ┌───────┴───────────────┐                             ┌───────────────┴───────┐
                                        │   Browser Client A    │◄═══════════════════════════►│   Browser Client B    │
                                        │   (Local Media)       │     WebRTC P2P Media Mesh   │   (Remote Media)      │
                                        └───────────────────────┘    (SRTP / SCTP Audio+Video)└───────────────────────┘
```

---

## 2. Signaling Protocol & WebRTC Lifecycle

WebRTC cannot establish peer connections without an auxiliary signaling mechanism. The FastAPI backend acts as an out-of-band signaling server.

### 2.1 WebRTC Handshake State Machine

```
Client A (Initiator)                   FastAPI Signaling Server                 Client B (Receiver)
        │                                         │                                      │
        ├──────────── ws.connect() ──────────────►│◄─────────── ws.connect() ────────────┤
        │                                         │                                      │
        │                                         │───── "peer-joined" (Client A) ──────►│
        │◄─────── "room-roster" (Client B) ───────┤                                      │
        │                                         │                                      │
        │ 1. createOffer()                        │                                      │
        │    setLocalDescription(offer)           │                                      │
        │───── {"type": "offer", sdp} ───────────►│                                      │
        │                                         │───── {"type": "offer", sdp} ────────►│
        │                                         │                                      │
        │                                         │ 2. setRemoteDescription(offer)       │
        │                                         │    createAnswer()                    │
        │                                         │    setLocalDescription(answer)       │
        │                                         │◄──── {"type": "answer", sdp} ────────┤
        │◄──── {"type": "answer", sdp} ───────────┤                                      │
        │ 3. setRemoteDescription(answer)         │                                      │
        │                                         │                                      │
        │ 4. ICE Candidate Trickle                │                                      │
        │───── {"type": "ice-candidate"} ────────►│───── {"type": "ice-candidate"} ────►│
        │◄──── {"type": "ice-candidate"} ─────────│◄──── {"type": "ice-candidate"} ──────┤
        │                                         │                                      │
        │══════════════════ DIRECT PEER-TO-PEER MEDIA STREAM ESTABLISHED ════════════════│
        │                               (SRTP Audio / Video)                             │
```

1. **Roster Exchange**: When Client A joins, the server returns existing peers in `room-roster` and broadcasts `peer-joined` to other room members.
2. **SDP Offer/Answer Exchange**: The initiator creates an SDP offer describing its audio/video codecs and capabilities. The receiver receives the offer, generates an SDP answer, and returns it.
3. **ICE Candidate Trickle**: Concurrently, the Interactive Connectivity Establishment (ICE) framework queries STUN servers (`stun.l.google.com:19302`) to discover reflexive public IP addresses and ports, trickling candidate descriptors across the WebSocket.
4. **Direct Media Streaming**: Once ICE verification succeeds, encrypted SRTP media flows directly between browsers without touching the application server.

---

## 3. Video Architecture Trade-offs: Mesh vs. SFU vs. MCU

| Metric | Mesh (P2P) — *Current Implementation* | SFU (Selective Forwarding Unit) | MCU (Multipoint Control Unit) |
| :--- | :--- | :--- | :--- |
| **Bandwidth (Client Upload)** | High: $O(N-1)$ streams | Low: $O(1)$ stream (Uploads 1 stream) | Lowest: $O(1)$ stream |
| **Bandwidth (Client Download)**| High: $O(N-1)$ streams | Medium: $O(N-1)$ streams | Lowest: $O(1)$ composite stream |
| **Server CPU / Encoding** | Zero (Pure signaling pass-through)| Low (Packet routing only) | Very High (Decodes & re-encodes all) |
| **End-to-End Latency** | Minimal (Direct P2P, ~20–50ms) | Low (~50–100ms) | Higher (~150–300ms transcoding) |
| **Server Infrastructure Cost** | \$0 for media servers | Moderate | Very High |
| **Ideal Use Case** | 1-on-1 & small team calls (≤ 4 users)| Large enterprise meetings (Zoom scale)| Legacy hardware telepresence rooms |

### Why Mesh was chosen for this project:
- Directly satisfies the assignment specifications for zero-cost, zero-latency P2P audio/video conferencing.
- Zero server media bandwidth costs: media travels directly peer-to-peer.
- Seamless upgrade path: To scale to 100+ participants, the frontend WebRTC adapter can point to an SFU (such as LiveKit, Mediasoup, or Janus) without changing the database or dashboard business logic.

---

## 4. Database Schema & Relational Design

The data model is implemented in SQLite using SQLAlchemy ORM with foreign key constraints, indexing on lookup columns, and cascade deletion.

```
       ┌────────────────────────────────────────────────────────┐
       │                       MEETINGS                         │
       ├────────────────────────────────────────────────────────┤
       │ id           : INTEGER (PK, AutoIncrement)             │
       │ meeting_id   : VARCHAR(20) [UNIQUE, INDEXED]           │
       │ title        : VARCHAR(200) NOT NULL                   │
       │ description  : VARCHAR(500) NULLABLE                   │
       │ scheduled_at : DATETIME NULLABLE                       │
       │ duration     : INTEGER DEFAULT 60                      │
       │ invite_link  : VARCHAR(500) NOT NULL                   │
       │ status       : VARCHAR(30) ('instant'|'scheduled'|'ended')
       │ host_name    : VARCHAR(100) DEFAULT 'Parija Sharma'    │
       │ passcode     : VARCHAR(20) NULLABLE                    │
       │ created_at   : DATETIME NOT NULL                       │
       └───────────────────────────┬────────────────────────────┘
                                   │ 1
                                   │
                                   │ N (CASCADE DELETE)
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │                     PARTICIPANTS                       │
       ├────────────────────────────────────────────────────────┤
       │ id           : INTEGER (PK, AutoIncrement)             │
       │ meeting_id   : INTEGER (FK -> meetings.id) NOT NULL    │
       │ display_name : VARCHAR(100) NOT NULL                   │
       │ is_host      : BOOLEAN DEFAULT FALSE                   │
       │ is_muted     : BOOLEAN DEFAULT FALSE                   │
       │ is_video_off : BOOLEAN DEFAULT FALSE                   │
       │ joined_at    : DATETIME DEFAULT CURRENT_TIMESTAMP      │
       │ left_at      : DATETIME NULLABLE                       │
       └────────────────────────────────────────────────────────┘
```

### Schema Highlights:
- **`meeting_id` Indexing**: Lookup queries for joining meetings (`GET /api/meetings/{id}`) run in $O(1)$ time complexity due to the B-tree index.
- **Cascade Deletion**: When a meeting is deleted, associated participant session logs are purged automatically.
- **Flexible Statuses**: Distinguishes instant ad-hoc meetings, scheduled upcoming sessions, and ended historical meetings.

---

## 5. Scaling to Production (System Design Roadmap)

To scale this platform to millions of concurrent users:

```
                            ┌────────────────────────┐
                            │    Cloudflare CDN      │
                            │ (DNS, DDoS Protection) │
                            └───────────┬────────────┘
                                        │
                                        ▼
                            ┌────────────────────────┐
                            │  NGINX / ALB Ingress   │
                            │  (SSL Termination)     │
                            └─────┬────────────┬─────┘
                                  │            │
            ┌─────────────────────┘            └─────────────────────┐
            ▼                                                        ▼
┌───────────────────────┐                                ┌───────────────────────┐
│ FastAPI Instance 1    │                                │ FastAPI Instance 2    │
│  (Uvicorn Workers)    │                                │  (Uvicorn Workers)    │
└───────────┬───────────┘                                └───────────┬───────────┘
            │                                                        │
            └─────────────────────────┬──────────────────────────────┘
                                      │
                 ┌────────────────────┴────────────────────┐
                 ▼                                         ▼
      ┌──────────────────────┐                  ┌──────────────────────┐
      │   Redis Cluster      │                  │ PostgreSQL Database  │
      │ (Pub/Sub Signaling   │                  │ (Primary-Replica     │
      │  & Room State Cache) │                  │  Clustered Storage)  │
      └──────────────────────┘                  └──────────────────────┘
```

1. **Signaling Server Horizontal Scaling with Redis Pub/Sub**:
   - In-memory dictionaries work on a single server. In a distributed multi-node environment, Client A and Client B may connect to different FastAPI worker instances.
   - Redis Pub/Sub solves this: each meeting ID acts as a Redis channel (`room:{meeting_id}`). Messages published by worker 1 are relayed via Redis to worker 2.
2. **NAT / Firewall Traversal with TURN**:
   - ~15% of enterprise networks employ symmetric NATs that block direct P2P connections.
   - Deploying Coturn (TURN server) ensures a fallback media relay when STUN hole-punching fails.
3. **Database Migration to PostgreSQL**:
   - Transition SQLite to PostgreSQL with connection pooling (PgBouncer) for concurrent writes.
