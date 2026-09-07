from datetime import datetime

from pydantic import BaseModel


class MeetingCreate(BaseModel):

    title: str = "Instant Meeting"

    description: str | None = None

    scheduled_at: datetime | None = None

    duration: int | None = 60


class ParticipantCreate(BaseModel):
    display_name: str
    is_host: bool = False