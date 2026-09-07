# Zoom Clone - Video Conferencing Platform (SDE Fullstack Assignment)

A functional, full-stack video conferencing web application replicating the Zoom web application's design, user experience, and core meeting workflows.

Built with **Next.js (React 19)**, **FastAPI (Python)**, **SQLite (SQLAlchemy)**, and **WebRTC / WebSockets**.

---

## 🌟 Key Features

### 1. Landing Dashboard
- Replicates Zoom's web interface (Top navigation bar, Sidebar navigation, Profile card, Personal Meeting ID).
- **Workplace Pro** promotion card matching Zoom design.
- **Dynamic Upcoming Meetings**: Queries SQLite database to display scheduled meetings with 1-click **Start** and **Copy Link** actions.
- **Recent Activity Section**: Displays past meetings and document activity.
- **Test Audio and Video**: Interactive hardware modal to test microphone, webcam, and speaker before entering meetings.

### 2. Instant Meeting Creation ("Host")
- 1-click meeting creation from the dashboard or header.
- Automatically generates a unique 9-to-10 digit Meeting ID and shareable invite link (`http://localhost:3000/meeting/{id}`).
- Immediately provisions the room and redirects the user as the authenticated Host.

### 3. Join Meeting
- Join via Meeting ID or full invite link.
- Enter customized Display Name (defaults to "Parija Sharma").
- Pre-join hardware preferences: "Do not connect to audio" and "Turn off my video".
- Validates meeting existence against backend database before redirecting.

### 4. Schedule Meetings
- Configure Topic, Description, Date & Time picker, and Duration.
- Security options: custom Passcode and Waiting Room toggle.
- Automatically generates meeting invite link and persists to SQLite.
- Instant success modal with 1-click "Copy Full Invitation" text formatting.

### 5. Zoom Meeting Room (WebRTC + WebSockets)
- **Full-Screen Immersive Layout**: Dark meeting room canvas with end-to-end encryption badge and live meeting timer.
- **Responsive Video Grid**: Local video stream + remote peer video tiles with auto-scaling grid.
- **Audio / Video Controls**: Toggle microphone (Mute/Unmute) and webcam (Start/Stop Video) with visual volume/state indicators.
- **Graceful Fallback**: If a participant disables their camera or does not have webcam access, a Zoom-style avatar tile with their initial is rendered.
- **Screen Sharing**: Live display capture via browser `navigator.mediaDevices.getDisplayMedia`.
- **In-Meeting Chat**: Real-time bidirectional chat messages broadcast across the room via WebSockets.
- **Interactive Emoji Reactions**: Floating animated reactions (👏, 👍, ❤️, 😂, 😮, 🎉) that float across all participants' screens.
- **Participant Drawer**: Live roster of room members with Host and Me tags.
- **Host Controls (Bonus)**:
  - Host "Mute All" command.
  - Host "Remove / Kick" participant capability.
- **Leave / End Meeting**: Host can choose "End Meeting for All" or "Leave Meeting".

---

## 🛠 Tech Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind CSS | Single Page Application matching Zoom design |
| **Icons & UI** | Lucide React | Clean, scalable vector icons |
| **Backend** | Python 3.13, FastAPI, Uvicorn | Async REST API & WebSocket Signaling server |
| **Database** | SQLite, SQLAlchemy ORM, Pydantic | ACID relational database with indexed meeting lookups |
| **Conferencing** | WebSockets (`websockets`) & WebRTC (`RTCPeerConnection`) | P2P audio/video streaming & real-time room signaling |

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18.0.0 or higher) & npm
- Python (v3.10 or higher)

---

### 2. Backend Setup & Run

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Install Python dependencies:
   ```bash
   pip install fastapi uvicorn sqlalchemy pydantic websockets httpx
   ```

3. Seed the SQLite database with sample meetings:
   ```bash
   python seed.py
   ```

4. Run the backend development server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

The backend will be available at:
- **API Base URL**: `http://localhost:8000`
- **Swagger Interactive Docs**: `http://localhost:8000/docs`
- **WebSocket Endpoint**: `ws://localhost:8000/ws/meeting/{meeting_id}`

---

### 3. Frontend Setup & Run

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Run the Next.js development server:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:3000` in your web browser.

---

## 🧪 Testing

### Backend Automated Test Suite
To run the automated integration tests verifying REST endpoints, database queries, and WebSocket signaling:
```bash
cd backend
python test_api.py
```

### Production Build Test
To verify the Next.js production build:
```bash
cd frontend
npm run build
```

---

## 📐 System Design Overview

For the complete architectural design breakdown, refer to [SYSTEM_DESIGN.md](SYSTEM_DESIGN.md).

### Core Concepts:
1. **Control vs. Media Plane**: REST API & WebSockets negotiate connections (Signaling); direct WebRTC mesh transports real-time encrypted audio/video streams (Media).
2. **Mesh vs. SFU Architecture**:
   - **Mesh Topology (Current)**: Zero server media bandwidth; peers connect directly via SRTP. Ideal for small, high-quality low-latency team calls.
   - **SFU Scalability Path**: To scale to hundreds of participants, clients upload 1 stream to a Selective Forwarding Unit (e.g. LiveKit / Mediasoup) which routes packets without transcoding.
3. **Signaling Scalability**: In a multi-node server cluster, WebSocket connections can be synchronized across instances using **Redis Pub/Sub** keyed by `meeting_id`.

---

## 📂 Project Structure

```
zoom-clone/
├── backend/
│   ├── database.py             # SQLite engine & session setup
│   ├── main.py                 # FastAPI app, CORS, routes & WebSocket endpoint
│   ├── models.py               # SQLAlchemy models (Meeting, Participant)
│   ├── schemas.py              # Pydantic schemas for requests & responses
│   ├── seed.py                 # Database seeder script
│   ├── test_api.py             # Integration test suite
│   ├── routers/
│   │   ├── meetings.py         # Meeting CRUD, filters & join endpoints
│   │   └── participants.py     # Participant actions (roster, mute, remove)
│   └── signaling/
│       ├── __init__.py
│       └── signaling.py        # WebSocket ConnectionManager & WebRTC signaling
│
├── frontend/
│   ├── app/
│   │   ├── page.jsx            # Landing dashboard (replicates Zoom UI)
│   │   ├── layout.js           # Root layout with AppShell wrapper
│   │   ├── join/page.js        # Join meeting with ID & display name validation
│   │   ├── schedule/page.js    # Meeting scheduler with date/time pickers & copy modal
│   │   └── meeting/
│   │       ├── page.js         # Instant meeting generator ("Host")
│   │       └── [meetingID]/
│   │           └── page.js     # Full Zoom meeting room (WebRTC, chat, controls)
│   ├── components/
│   │   ├── AppShell.jsx        # Contextual layout manager
│   │   ├── TopBar.jsx          # Zoom top navigation bar
│   │   ├── Sidebar.jsx         # Zoom left sidebar navigation
│   │   ├── ProfileCard.jsx     # User profile card ("Parija Sharma")
│   │   ├── QuickActions.jsx    # Schedule, Join, Host quick actions
│   │   ├── WorkplaceProCard.jsx# Promo banner matching screenshot
│   │   ├── MeetingsPanel.jsx   # Dynamic upcoming meetings list
│   │   ├── RecentActivity.jsx  # Recent activity & past meetings
│   │   └── Footer.jsx          # Zoom corporate footer
│   └── lib/
│       └── api.js              # Fetch helpers & WebSocket URL builder
│
├── SYSTEM_DESIGN.md            # Comprehensive system design documentation
└── README.md                   # Project documentation & run guide
```
