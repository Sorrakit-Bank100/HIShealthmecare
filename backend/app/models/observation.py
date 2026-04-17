import uuid
from sqlalchemy import String, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import JSONB
from app.core.database import Base


class Observation(Base):
    """
    FHIR Observation resource stored in PostgreSQL.
    Used for vital signs, lab results, and clinical findings.
    """
    __tablename__ = "observations"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    patient_id: Mapped[str | None] = mapped_column(
        String(64), index=True, nullable=True,
        comment="Reference to Patient.id"
    )
    encounter_id: Mapped[str | None] = mapped_column(
        String(64), index=True, nullable=True,
        comment="Reference to Encounter.id"
    )
    status: Mapped[str | None] = mapped_column(
        String(50), index=True, nullable=True,
        comment="registered | preliminary | final | amended"
    )
    code: Mapped[str | None] = mapped_column(
        String(128), index=True, nullable=True,
        comment="LOINC or SNOMED code"
    )
    value_string: Mapped[str | None] = mapped_column(String(256), nullable=True)
    effective_date: Mapped[str | None] = mapped_column(String(30), nullable=True)

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
