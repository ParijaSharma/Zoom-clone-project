import random
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Meeting, Participant
from schemas import MeetingCreate, ParticipantCreate


router = APIRouter(
    prefix="/api/meetings",
    tags=["Meetings"]
)


# --------------------------------------------------
# Generate a unique meeting ID
# --------------------------------------------------

def generate_meeting_id(db: Session):

    while True:

        meeting_id = str(
            random.randint(100000000, 999999999)
        )

        existing = (
            db.query(Meeting)
            .filter(Meeting.meeting_id == meeting_id)
            .first()
        )

        if not existing:
            return meeting_id


# --------------------------------------------------
# CREATE MEETING
# POST /api/meetings
# --------------------------------------------------

@router.post("")
def create_meeting(
    meeting_data: MeetingCreate,
    db: Session = Depends(get_db)
):

    meeting_id = generate_meeting_id(db)

    invite_link = (
        f"http://localhost:3000/meeting/{meeting_id}"
    )

    meeting = Meeting(
        meeting_id=meeting_id,
        title=meeting_data.title,
        description=meeting_data.description,
        scheduled_at=meeting_data.scheduled_at,
        duration=meeting_data.duration,
        invite_link=invite_link,
        status=(
            "scheduled"
            if meeting_data.scheduled_at
            else "instant"
        ),
        created_at=datetime.utcnow()
    )

    db.add(meeting)
    db.commit()
    db.refresh(meeting)

    return {
        "id": meeting.id,
        "meeting_id": meeting.meeting_id,
        "title": meeting.title,
        "description": meeting.description,
        "scheduled_at": meeting.scheduled_at,
        "duration": meeting.duration,
        "invite_link": meeting.invite_link,
        "status": meeting.status
    }


# --------------------------------------------------
# GET ALL MEETINGS
# GET /api/meetings
# --------------------------------------------------

@router.get("")
def get_meetings(
    db: Session = Depends(get_db)
):

    meetings = (
        db.query(Meeting)
        .order_by(Meeting.created_at.desc())
        .all()
    )

    return meetings


# --------------------------------------------------
# GET ONE MEETING
# GET /api/meetings/{meeting_id}
# --------------------------------------------------

@router.get("/{meeting_id}")
def get_meeting(
    meeting_id: str,
    db: Session = Depends(get_db)
):

    meeting = (
        db.query(Meeting)
        .filter(
            Meeting.meeting_id == meeting_id
        )
        .first()
    )

    if not meeting:

        raise HTTPException(
            status_code=404,
            detail="Meeting not found"
        )

    return meeting


# --------------------------------------------------
# JOIN MEETING
# POST /api/meetings/{meeting_id}/participants
# --------------------------------------------------

@router.post("/{meeting_id}/participants")
def join_meeting(
    meeting_id: str,
    participant_data: ParticipantCreate,
    db: Session = Depends(get_db)
):

    meeting = (
        db.query(Meeting)
        .filter(
            Meeting.meeting_id == meeting_id
        )
        .first()
    )

    if not meeting:

        raise HTTPException(
            status_code=404,
            detail="Meeting not found"
        )

    participant = Participant(
        meeting_id=meeting.id,
        display_name=participant_data.display_name,
        is_host=participant_data.is_host,
        joined_at=datetime.utcnow()
    )

    db.add(participant)
    db.commit()
    db.refresh(participant)

    return {
        "id": participant.id,
        "meeting_id": meeting.meeting_id,
        "display_name": participant.display_name,
        "is_host": participant.is_host,
        "joined_at": participant.joined_at
    }