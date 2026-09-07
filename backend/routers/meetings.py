import random
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db
from models import Meeting, Participant
from schemas import MeetingCreate, MeetingResponse, ParticipantCreate, ParticipantResponse
import os
router = APIRouter(
    prefix="/api/meetings",
    tags=["Meetings"]
)


def generate_meeting_id(db: Session) -> str:
    """Generate a unique 9-to-10 digit Zoom-style meeting ID"""
    while True:
        meeting_id = str(random.randint(100000000, 999999999))
        existing = db.query(Meeting).filter(Meeting.meeting_id == meeting_id).first()
        if not existing:
            return meeting_id


@router.post("", response_model=MeetingResponse)
def create_meeting(
    meeting_data: MeetingCreate,
    db: Session = Depends(get_db)
):
    meeting_id = generate_meeting_id(db)
    invite_link = f"http://{os.getenv('FRONTEND_URL', 'localhost:3000')}/meeting/{meeting_id}"

    meeting = Meeting(
        meeting_id=meeting_id,
        title=meeting_data.title,
        description=meeting_data.description,
        scheduled_at=meeting_data.scheduled_at,
        duration=meeting_data.duration or 60,
        invite_link=invite_link,
        status="scheduled" if meeting_data.scheduled_at else "instant",
        host_name=meeting_data.host_name or "Parija Sharma",
        passcode=meeting_data.passcode,
        created_at=datetime.utcnow()
    )

    db.add(meeting)
    db.commit()
    db.refresh(meeting)

    # Add host as first participant
    host_participant = Participant(
        meeting_id=meeting.id,
        display_name=meeting.host_name,
        is_host=True,
        joined_at=datetime.utcnow()
    )
    db.add(host_participant)
    db.commit()
    db.refresh(meeting)

    return meeting


@router.get("", response_model=List[MeetingResponse])
def get_meetings(
    filter_type: Optional[str] = Query(None, alias="type"),
    db: Session = Depends(get_db)
):
    query = db.query(Meeting)
    now = datetime.utcnow()

    if filter_type == "upcoming":
        # Scheduled meetings or instant active meetings
        meetings = (
            query.filter(Meeting.status != "ended")
            .order_by(Meeting.scheduled_at.asc().nullslast(), Meeting.created_at.desc())
            .all()
        )
    elif filter_type == "recent":
        # Ended meetings or previously created meetings
        meetings = (
            query.order_by(Meeting.created_at.desc())
            .limit(10)
            .all()
        )
    else:
        meetings = query.order_by(Meeting.created_at.desc()).all()

    return meetings


@router.get("/{meeting_id}", response_model=MeetingResponse)
def get_meeting(
    meeting_id: str,
    db: Session = Depends(get_db)
):
    # Normalize meeting ID (remove hyphens or spaces)
    normalized_id = meeting_id.replace("-", "").replace(" ", "").strip()

    meeting = db.query(Meeting).filter(
        (Meeting.meeting_id == normalized_id) | (Meeting.meeting_id == meeting_id)
    ).first()

    if not meeting:
        raise HTTPException(
            status_code=404,
            detail="Meeting not found. Please check your meeting ID or invite link."
        )

    return meeting


@router.post("/{meeting_id}/participants", response_model=ParticipantResponse)
def join_meeting(
    meeting_id: str,
    participant_data: ParticipantCreate,
    db: Session = Depends(get_db)
):
    normalized_id = meeting_id.replace("-", "").replace(" ", "").strip()
    meeting = db.query(Meeting).filter(
        (Meeting.meeting_id == normalized_id) | (Meeting.meeting_id == meeting_id)
    ).first()

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

    return participant


@router.post("/{meeting_id}/end")
def end_meeting(
    meeting_id: str,
    db: Session = Depends(get_db)
):
    normalized_id = meeting_id.replace("-", "").replace(" ", "").strip()
    meeting = db.query(Meeting).filter(
        (Meeting.meeting_id == normalized_id) | (Meeting.meeting_id == meeting_id)
    ).first()

    if not meeting:
        raise HTTPException(
            status_code=404,
            detail="Meeting not found"
        )

    meeting.status = "ended"
    db.commit()

    return {"message": "Meeting ended successfully", "meeting_id": meeting.meeting_id}


@router.delete("/{meeting_id}")
def delete_meeting(
    meeting_id: str,
    db: Session = Depends(get_db)
):
    normalized_id = meeting_id.replace("-", "").replace(" ", "").strip()
    meeting = db.query(Meeting).filter(
        (Meeting.meeting_id == normalized_id) | (Meeting.meeting_id == meeting_id)
    ).first()

    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    db.delete(meeting)
    db.commit()

    return {"message": "Meeting deleted", "meeting_id": meeting.meeting_id}