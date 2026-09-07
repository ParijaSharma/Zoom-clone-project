"""
Database seeder for Zoom Clone.
Populates SQLite database with realistic sample meetings and participants.
"""

from datetime import datetime, timedelta
from database import SessionLocal, Base, engine
from models import Meeting, Participant


def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        existing_count = db.query(Meeting).count()
        if existing_count > 0:
            print(f"Database already contains {existing_count} meetings. Refreshing seed data...")
            db.query(Participant).delete()
            db.query(Meeting).delete()
            db.commit()

        now = datetime.utcnow()

        # 1. Personal Meeting Room (Matches Home Page Screenshot ID: 266 426 0040)
        pmi_id = "2664260040"
        pmi_meeting = Meeting(
            meeting_id=pmi_id,
            title="Parija Sharma's Personal Meeting Room",
            description="Recurring personal room for ad-hoc meetings and quick syncs.",
            scheduled_at=now + timedelta(hours=1),
            duration=45,
            invite_link=f"http://localhost:3000/meeting/{pmi_id}",
            status="scheduled",
            host_name="Parija Sharma",
            passcode="zoom123",
            created_at=now - timedelta(days=5)
        )
        db.add(pmi_meeting)
        db.flush()

        p1 = Participant(
            meeting_id=pmi_meeting.id,
            display_name="Parija Sharma",
            is_host=True,
            joined_at=now - timedelta(days=5, hours=2)
        )
        db.add(p1)

        # 2. Upcoming Meeting 1: Scaler SDE Fullstack Assignment Evaluation
        m1_id = "842917530"
        m1 = Meeting(
            meeting_id=m1_id,
            title="Scaler SDE Fullstack Assignment Evaluation & Demo",
            description="Technical evaluation meeting demonstrating Zoom Clone UI/UX and WebRTC conferencing backend.",
            scheduled_at=now + timedelta(hours=3),
            duration=60,
            invite_link=f"http://localhost:3000/meeting/{m1_id}",
            status="scheduled",
            host_name="Parija Sharma",
            passcode="scaler2026",
            created_at=now - timedelta(hours=10)
        )
        db.add(m1)
        db.flush()

        db.add(Participant(
            meeting_id=m1.id,
            display_name="Parija Sharma",
            is_host=True,
            joined_at=now - timedelta(hours=1)
        ))
        db.add(Participant(
            meeting_id=m1.id,
            display_name="Technical Interviewer",
            is_host=False,
            joined_at=now - timedelta(minutes=45)
        ))

        # 3. Upcoming Meeting 2: Sprint 14 Planning & Architecture Sync
        m2_id = "519382046"
        m2 = Meeting(
            meeting_id=m2_id,
            title="Sprint 14 Planning & Architecture Sync",
            description="Reviewing WebRTC mesh vs SFU scaling trade-offs and WebSocket signaling performance.",
            scheduled_at=now + timedelta(days=1, hours=4),
            duration=45,
            invite_link=f"http://localhost:3000/meeting/{m2_id}",
            status="scheduled",
            host_name="Parija Sharma",
            created_at=now - timedelta(days=1)
        )
        db.add(m2)
        db.flush()
        db.add(Participant(
            meeting_id=m2.id,
            display_name="Parija Sharma",
            is_host=True
        ))

        # 4. Recent / Past Meeting 1: Product Design Review - UI/UX Polish
        m3_id = "194820573"
        m3 = Meeting(
            meeting_id=m3_id,
            title="Product Design Review - UI/UX Polish",
            description="Alignment on Zoom design specs, color palette (#0b5cff, #040425), and responsive layouts.",
            scheduled_at=now - timedelta(days=1, hours=2),
            duration=30,
            invite_link=f"http://localhost:3000/meeting/{m3_id}",
            status="ended",
            host_name="Parija Sharma",
            created_at=now - timedelta(days=2)
        )
        db.add(m3)
        db.flush()
        db.add(Participant(
            meeting_id=m3.id,
            display_name="Parija Sharma",
            is_host=True,
            joined_at=now - timedelta(days=1, hours=2),
            left_at=now - timedelta(days=1, hours=1, minutes=30)
        ))
        db.add(Participant(
            meeting_id=m3.id,
            display_name="Alex Chen (Design Lead)",
            is_host=False,
            joined_at=now - timedelta(days=1, hours=2),
            left_at=now - timedelta(days=1, hours=1, minutes=30)
        ))

        # 5. Recent / Past Meeting 2: Quick Ad-hoc Brainstorming
        m4_id = "672491823"
        m4 = Meeting(
            meeting_id=m4_id,
            title="Quick Ad-hoc Brainstorming Session",
            description="Instant meeting for debugging WebSockets.",
            scheduled_at=None,
            duration=20,
            invite_link=f"http://localhost:3000/meeting/{m4_id}",
            status="ended",
            host_name="Parija Sharma",
            created_at=now - timedelta(days=3)
        )
        db.add(m4)
        db.flush()
        db.add(Participant(
            meeting_id=m4.id,
            display_name="Parija Sharma",
            is_host=True,
            joined_at=now - timedelta(days=3)
        ))

        db.commit()
        print("Database seeded successfully with sample Zoom meetings and participants!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
