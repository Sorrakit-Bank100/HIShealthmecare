"""
FHIR R4 Encounter Endpoints
============================
Implements HL7 FHIR R4 RESTful API for Encounter resources.

Supported operations:
  POST   /fhir/Encounter          - Create an Encounter
  GET    /fhir/Encounter/{id}     - Read an Encounter
  PUT    /fhir/Encounter/{id}     - Update an Encounter
  DELETE /fhir/Encounter/{id}     - Delete an Encounter
  GET    /fhir/Encounter          - Search by patient, status
"""

import uuid
from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fhir.resources.encounter import Encounter as FHIREncounter

from app.core.database import get_db
from app.models.encounter import Encounter

router = APIRouter(prefix="/Encounter", tags=["Encounter"])


def _extract_encounter_fields(resource: dict) -> dict:
    """Extract indexed fields from a FHIR Encounter resource dict."""
    patient_id = None
    if resource.get("subject") and resource["subject"].get("reference"):
        ref = resource["subject"]["reference"]
        patient_id = ref.split("/")[-1]

    enc_class = None
    if resource.get("class"):
        c = resource["class"]
        enc_class = c.get("code") if isinstance(c, dict) else str(c)

    type_code = None
    if resource.get("type"):
        t = resource["type"][0] if isinstance(resource["type"], list) else resource["type"]
        if isinstance(t, dict) and t.get("coding"):
            type_code = t["coding"][0].get("code")

    period = resource.get("period", {})

    return {
        "patient_id": patient_id,
        "status": resource.get("status"),
        "encounter_class": enc_class,
        "type_code": type_code,
        "period_start": period.get("start") if period else None,
        "period_end": period.get("end") if period else None,
    }


@router.post("", status_code=status.HTTP_201_CREATED, response_model=dict)
async def create_encounter(
    resource: dict,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Create a new FHIR Encounter resource."""
    try:
        fhir_encounter = FHIREncounter.model_validate(resource)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid FHIR Encounter resource: {str(e)}",
        )

    encounter_id = str(uuid.uuid4())
    resource_dict = fhir_encounter.model_dump(exclude_none=True, mode='json')
    resource_dict["id"] = encounter_id
    resource_dict["resourceType"] = "Encounter"

    fields = _extract_encounter_fields(resource_dict)
    db_encounter = Encounter(id=encounter_id, fhir_resource=resource_dict, **fields)
    db.add(db_encounter)
    await db.flush()

    return resource_dict


@router.get("/{encounter_id}", response_model=dict)
async def get_encounter(
    encounter_id: str,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Read a FHIR Encounter resource by ID."""
    result = await db.execute(select(Encounter).where(Encounter.id == encounter_id))
    encounter = result.scalar_one_or_none()

    if not encounter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Encounter/{encounter_id} not found",
        )
    return encounter.fhir_resource


@router.put("/{encounter_id}", response_model=dict)
async def update_encounter(
    encounter_id: str,
    resource: dict,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Update an existing FHIR Encounter resource (full replace)."""
    result = await db.execute(select(Encounter).where(Encounter.id == encounter_id))
    encounter = result.scalar_one_or_none()

    if not encounter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Encounter/{encounter_id} not found",
        )

    try:
        fhir_encounter = FHIREncounter.model_validate(resource)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid FHIR Encounter resource: {str(e)}",
        )

    resource_dict = fhir_encounter.model_dump(exclude_none=True, mode='json')
    resource_dict["id"] = encounter_id
    resource_dict["resourceType"] = "Encounter"

    fields = _extract_encounter_fields(resource_dict)
    encounter.fhir_resource = resource_dict
    for k, v in fields.items():
        setattr(encounter, k, v)

    await db.flush()
    return encounter.fhir_resource


@router.delete("/{encounter_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_encounter(
    encounter_id: str,
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete a FHIR Encounter resource."""
    result = await db.execute(select(Encounter).where(Encounter.id == encounter_id))
    encounter = result.scalar_one_or_none()

    if not encounter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Encounter/{encounter_id} not found",
        )
    await db.delete(encounter)


@router.get("", response_model=dict)
async def search_encounters(
    patient: Optional[str] = Query(None, description="Patient ID to filter by"),
    status: Optional[str] = Query(None, description="Filter by status (e.g. in-progress, finished)"),
    _count: int = Query(20, alias="_count", ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Search FHIR Encounter resources. Returns a FHIR Bundle searchset."""
    query = select(Encounter)
    if patient:
        query = query.where(Encounter.patient_id == patient)
    if status:
        query = query.where(Encounter.status == status)
    query = query.limit(_count)

    results = await db.execute(query)
    encounters = results.scalars().all()

    return {
        "resourceType": "Bundle",
        "type": "searchset",
        "total": len(encounters),
        "entry": [
            {"fullUrl": f"Encounter/{e.id}", "resource": e.fhir_resource}
            for e in encounters
        ],
    }
