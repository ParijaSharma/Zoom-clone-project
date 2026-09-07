from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Boolean,
    ForeignKey
)

from sqlalchemy.orm import relationship

from database import Base


class Meeting(Base):

    __tablename__ = "meetings"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    meeting_id = Column(
        String(20),
        unique=True,
        index=True,
        nullable=False
    )

    title = Column(
        String(200),
        nullable=False
    )

    description = Column(
        String(500),
        nullable=True
    )

    scheduled_at = Column(
        DateTime,
        nullable=True
    )

    duration = Column(
        Integer,
        nullable=True
    )

    invite_link = Column(
        String(500),
        nullable=False
    )

    status = Column(
        String(30),
        default="scheduled"
    )

    created_at = Column(
        DateTime,
        nullable=False
    )

    participants = relationship(
        "Participant",
        back_populates="meeting",
        cascade="all, delete-orphan"
    )


class Participant(Base):

    __tablename__ = "participants"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    meeting_id = Column(
        Integer,
        ForeignKey("meetings.id"),
        nullable=False
    )

    display_name = Column(
        String(100),
        nullable=False
    )

    is_host = Column(
        Boolean,
        default=False
    )

    joined_at = Column(
        DateTime,
        nullable=True
    )

    left_at = Column(
        DateTime,
        nullable=True
    )

    meeting = relationship(
        "Meeting",
        back_populates="participants"
    )