"""
FHIR R4 Observation Endpoints
==============================
Implements HL7 FHIR R4 RESTful API for Observation resources.
Used for vital signs, lab results, and clinical findings.

Supported operations:
  POST   /fhir/Observation          - Create an Observation
  GET    /fhir/Observation/{id}     - Read an Observation
  PUT    /fhir/Observation/{id}     - Update an Observation
  DELETE /fhir/Observation/{id}     - Delete an Observation
  GET    /fhir/Observation          - Search by patient, encounter, code
"""

import uuid
from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fhir.resources.observation import Observation as FHIRObservation

from app.core.database import get_db
from app.models.observation import Observation

router = APIRouter(prefix="/Observation", tags=["Observation"])


def _extract_observation_fields(resource: dict) -> dict:
    patient_id = None
    if resource.get("subject") and resource["subject"].get("reference"):
        patient_id = resource["subject"]["reference"].split("/")[-1]

    encounter_id = None
    if resource.get("encounter") and resource["encounter"].get("reference"):
        encounter_id = resource["encounter"]["reference"].split("/")[-1]

    code = None
    if resource.get("code") and resource["code"].get("coding"):
        code = resource["code"]["coding"][0].get("code")

    value_string = None
    if resource.get("valueString"):
        value_string = resource["valueString"]
    elif resource.get("valueQuantity"):
        vq = resource["valueQuantity"]
        value_string = f"{vq.get('value')} {vq.get('unit', '')}".strip()

    return {
        "patient_id": patient_id,
        "encounter_id": encounter_id,
        "status": resource.get("status"),
        "code": code,
        "value_string": value_string,
        "effective_date": resource.get("effectiveDateTime"),
    }


@router.post("", status_code=status.HTTP_201_CREATED, response_model=dict)
async def create_observation(
    resource: dict,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Create a new FHIR Observation resource."""
    try:
        fhir_obs = FHIRObservation.model_validate(resource)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid FHIR Observation resource: {str(e)}",
        )

    obs_id = str(uuid.uuid4())
    resource_dict = fhir_obs.model_dump(exclude_none=True, mode='json')
    resource_dict["id"] = obs_id
    resource_dict["resourceType"] = "Observation"

    fields = _extract_observation_fields(resource_dict)
    db_obs = Observation(id=obs_id, fhir_resource=resource_dict, **fields)
    db.add(db_obs)
    await db.flush()

    return resource_dict


@router.get("/{observation_id}", response_model=dict)
async def get_observation(
    observation_id: str,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Read a FHIR Observation resource by ID."""
    result = await db.execute(
        select(Observation).where(Observation.id == observation_id)
    )
    obs = result.scalar_one_or_none()

    if not obs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Observation/{observation_id} not found",
        )
    return obs.fhir_resource


@router.put("/{observation_id}", response_model=dict)
async def update_observation(
    observation_id: str,
    resource: dict,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Update an existing FHIR Observation (full replace)."""
    result = await db.execute(
        select(Observation).where(Observation.id == observation_id)
    )
    obs = result.scalar_one_or_none()

    if not obs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Observation/{observation_id} not found",
        )

    try:
        fhir_obs = FHIRObservation.model_validate(resource)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid FHIR Observation resource: {str(e)}",
        )

    resource_dict = fhir_obs.model_dump(exclude_none=True, mode='json')
    resource_dict["id"] = observation_id
    resource_dict["resourceType"] = "Observation"

    fields = _extract_observation_fields(resource_dict)
    obs.fhir_resource = resource_dict
    for k, v in fields.items():
        setattr(obs, k, v)

    await db.flush()
    return obs.fhir_resource


@router.delete("/{observation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_observation(
    observation_id: str,
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete a FHIR Observation resource."""
    result = await db.execute(
        select(Observation).where(Observation.id == observation_id)
    )
    obs = result.scalar_one_or_none()

    if not obs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Observation/{observation_id} not found",
        )
    await db.delete(obs)


@router.get("", response_model=dict)
async def search_observations(
    patient: Optional[str] = Query(None, description="Patient ID"),
    encounter: Optional[str] = Query(None, description="Encounter ID"),
    code: Optional[str] = Query(None, description="LOINC/SNOMED code"),
    _count: int = Query(20, alias="_count", ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Search FHIR Observation resources. Returns a FHIR Bundle searchset."""
    query = select(Observation)
    if patient:
        query = query.where(Observation.patient_id == patient)
    if encounter:
        query = query.where(Observation.encounter_id == encounter)
    if code:
        query = query.where(Observation.code == code)
    query = query.limit(_count)

    results = await db.execute(query)
    observations = results.scalars().all()

    return {
        "resourceType": "Bundle",
        "type": "searchset",
        "total": len(observations),
        "entry": [
            {"fullUrl": f"Observation/{o.id}", "resource": o.fhir_resource}
            for o in observations
        ],
    }
