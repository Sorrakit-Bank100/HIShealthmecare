import uuid
from sqlalchemy import String, Text, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import JSONB, UUID
from app.core.database import Base


class Patient(Base):
    """
    FHIR Patient resource stored in PostgreSQL.
    Core demographic fields are indexed as relational columns for querying.
    The full FHIR resource is stored as JSONB for flexibility and
    round-trip fidelity with the HL7 FHIR standard.
    """
    __tablename__ = "patients"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    # Indexed relational fields for fast querying
    hospital_code: Mapped[str | None] = mapped_column(String(20), nullable=True)
    cid: Mapped[str | None] = mapped_column(String(20), index=True, nullable=True)
    pid: Mapped[str | None] = mapped_column(String(64), index=True, nullable=True)
    hid: Mapped[str | None] = mapped_column(String(64), nullable=True)
    prename: Mapped[str | None] = mapped_column(String(50), nullable=True)
    given_name: Mapped[str | None] = mapped_column(String(255), index=True, nullable=True)
    family_name: Mapped[str | None] = mapped_column(String(255), index=True, nullable=True)
    identifier: Mapped[str | None] = mapped_column(String(128), index=True, nullable=True)
    gender: Mapped[str | None] = mapped_column(String(20), nullable=True)
    birth_date: Mapped[str | None] = mapped_column(String(20), nullable=True)
    married_status: Mapped[str | None] = mapped_column(String(20), nullable=True)
    occupation: Mapped[str | None] = mapped_column(String(100), nullable=True)
    blood_group: Mapped[str | None] = mapped_column(String(5), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    nation: Mapped[str | None] = mapped_column(String(100), nullable=True)
    race: Mapped[str | None] = mapped_column(String(100), nullable=True)
    religion: Mapped[str | None] = mapped_column(String(100), nullable=True)
    education: Mapped[str | None] = mapped_column(String(100), nullable=True)
    blood_group_rh: Mapped[str | None] = mapped_column(String(5), nullable=True)
    active: Mapped[bool | None] = mapped_column(default=True, nullable=True)

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
