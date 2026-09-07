from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Meeting, Participant
from schemas import ParticipantResponse, ParticipantUpdate
from signaling.signaling import manager


router = APIRouter(
    prefix="/api/meetings/{meeting_id}/participants",
    tags=["Participants"]
)


def _get_meeting(meeting_id: str, db: Session) -> Meeting:
    normalized_id = meeting_id.replace("-", "").replace(" ", "").strip()
    meeting = db.query(Meeting).filter(
        (Meeting.meeting_id == normalized_id) | (Meeting.meeting_id == meeting_id)
    ).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting


@router.get("", response_model=List[ParticipantResponse])
def get_participants(
    meeting_id: str,
    db: Session = Depends(get_db)
):
    meeting = _get_meeting(meeting_id, db)
    return db.query(Participant).filter(Participant.meeting_id == meeting.id).all()


@router.get("/live")
def get_live_participants(meeting_id: str):
    """Returns real-time connected peers in the WebSocket room"""
    normalized_id = meeting_id.replace("-", "").replace(" ", "").strip()
    live_list = manager.get_participants(normalized_id)
    return {"meeting_id": normalized_id, "count": len(live_list), "participants": live_list}


@router.patch("/{participant_id}", response_model=ParticipantResponse)
def update_participant(
    meeting_id: str,
    participant_id: int,
    data: ParticipantUpdate,
    db: Session = Depends(get_db)
):
    meeting = _get_meeting(meeting_id, db)
    participant = db.query(Participant).filter(
        Participant.id == participant_id,
        Participant.meeting_id == meeting.id
    ).first()

    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")

    if data.is_muted is not None:
        participant.is_muted = data.is_muted
    if data.is_video_off is not None:
        participant.is_video_off = data.is_video_off

    db.commit()
    db.refresh(participant)
    return participant


@router.delete("/{participant_id}")
def remove_participant(
    meeting_id: str,
    participant_id: int,
    db: Session = Depends(get_db)
):
    meeting = _get_meeting(meeting_id, db)
    participant = db.query(Participant).filter(
        Participant.id == participant_id,
        Participant.meeting_id == meeting.id
    ).first()

    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")

    participant.left_at = datetime.utcnow()
    db.commit()

    return {"message": "Participant removed", "id": participant_id}
