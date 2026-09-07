from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class MeetingCreate(BaseModel):
    title: str = "Instant Meeting"
    description: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    duration: Optional[int] = 60
    host_name: Optional[str] = "Parija Sharma"
    passcode: Optional[str] = None


class ParticipantCreate(BaseModel):
    display_name: str
    is_host: bool = False


class ParticipantUpdate(BaseModel):
    is_muted: Optional[bool] = None
    is_video_off: Optional[bool] = None


class ParticipantResponse(BaseModel):
    id: int
    meeting_id: int
    display_name: str
    is_host: bool
    is_muted: bool
    is_video_off: bool
    joined_at: Optional[datetime] = None
    left_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class MeetingResponse(BaseModel):
    id: int
    meeting_id: str
    title: str
    description: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    duration: Optional[int] = 60
    invite_link: str
    status: str
    host_name: Optional[str] = "Parija Sharma"
    passcode: Optional[str] = None
    created_at: datetime
    participants: List[ParticipantResponse] = []

    class Config:
        from_attributes = True