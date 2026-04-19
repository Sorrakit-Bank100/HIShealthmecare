import uuid
from sqlalchemy import String, Text, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import JSONB
from app.core.database import Base


class Encounter(Base):
    """
    FHIR Encounter resource stored in PostgreSQL.
    An Encounter represents an interaction between a patient and healthcare provider.
    (e.g. outpatient visit, emergency, inpatient stay)
    """
    __tablename__ = "encounters"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    patient_id: Mapped[str | None] = mapped_column(
        String(64), index=True, nullable=True,
        comment="Reference to Patient.id"
    )
    status: Mapped[str | None] = mapped_column(
        String(50), index=True, nullable=True,
        comment="planned | in-progress | finished | cancelled"
    )
    encounter_class: Mapped[str | None] = mapped_column(String(50), nullable=True)
    type_code: Mapped[str | None] = mapped_column(String(128), nullable=True)
    period_start: Mapped[str | None] = mapped_column(String(30), nullable=True)
    period_end: Mapped[str | None] = mapped_column(String(30), nullable=True)
    ward: Mapped[str | None] = mapped_column(String(100), nullable=True)
    doctor_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    diagnosis: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Full FHIR JSON payload
    fhir_resource: Mapped[dict] = mapped_column(JSONB, nullable=False)

    created_at: Mapped[str] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[str] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
