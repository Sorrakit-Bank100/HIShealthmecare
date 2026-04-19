"""
FHIR R4 Patient Endpoints
=========================
Implements HL7 FHIR R4 RESTful API for Patient resources.

Supported operations:
  POST   /fhir/Patient          - Create a new Patient
  GET    /fhir/Patient/{id}     - Read a Patient by ID
  PUT    /fhir/Patient/{id}     - Update a Patient
  DELETE /fhir/Patient/{id}     - Delete a Patient
  GET    /fhir/Patient          - Search Patients (by name, identifier, gender)
"""

import uuid
from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from fhir.resources.R4B.patient import Patient as FHIRPatient

from app.core.database import get_db
from app.models.patient import Patient

router = APIRouter(prefix="/Patient", tags=["Patient"])


def _extract_patient_fields(resource: dict) -> dict:
    """Extract indexed fields from a FHIR Patient resource dict."""
    fields = {
        "hospital_code": None,
        "cid": None,
        "pid": None,
        "hid": None,
        "prename": None,
        "given_name": None,
        "family_name": None,
        "identifier": None,
        "gender": resource.get("gender"),
        "birth_date": resource.get("birthDate"),
        "married_status": None,
        "occupation": None,
        "blood_group": None,
        "phone": None,
        "nation": None,
        "race": None,
        "religion": None,
        "education": None,
        "blood_group_rh": None,
        "active": resource.get("active", True),
    }

    if resource.get("name"):
        name = resource["name"][0]
        fields["family_name"] = name.get("family")
        
        given_list = name.get("given", [])
        if given_list:
            fields["given_name"] = " ".join(given_list)
            
        prefix_list = name.get("prefix", [])
        if prefix_list:
            fields["prename"] = " ".join(prefix_list)

    if resource.get("identifier"):
        fields["identifier"] = resource["identifier"][0].get("value")
        for ident in resource["identifier"]:
            val = ident.get("value")
            if not val:
                continue
            
            system = ident.get("system", "").lower()
            if "cid" in system or "citizen" in system or "national" in system:
                fields["cid"] = val
            elif "hn" in system or "hospital" in system:
                fields["hospital_code"] = val
            elif "pid" in system or "patient" in system:
                fields["pid"] = val
            elif "hid" in system or "house" in system:
                fields["hid"] = val

    if resource.get("telecom"):
        for t in resource["telecom"]:
            if t.get("system") == "phone":
                fields["phone"] = t.get("value")
                break
        if not fields["phone"]:
            fields["phone"] = resource["telecom"][0].get("value")

    if resource.get("maritalStatus"):
        ms = resource["maritalStatus"]
        if ms.get("text"):
            fields["married_status"] = ms.get("text")
        elif ms.get("coding") and len(ms["coding"]) > 0:
            fields["married_status"] = ms["coding"][0].get("code") or ms["coding"][0].get("display")

    if resource.get("extension"):
        for ext in resource["extension"]:
            url = ext.get("url", "").lower()
            val = ext.get("valueString") or ext.get("valueCode")
            if not val and ext.get("valueCodeableConcept"):
                cc = ext.get("valueCodeableConcept")
                val = cc.get("text") or (cc.get("coding")[0].get("display") if cc.get("coding") else None)
            
            if not val:
                continue
                
            if "nation" in url or "nationality" in url:
                fields["nation"] = val
            elif "race" in url:
                fields["race"] = val
            elif "religion" in url:
                fields["religion"] = val
            elif "education" in url:
                fields["education"] = val
            elif "occupation" in url:
                fields["occupation"] = val
            elif "blood" in url:
                if "rh" in url:
                    fields["blood_group_rh"] = val
                else:
                    fields["blood_group"] = val

    return fields


@router.post("", status_code=status.HTTP_201_CREATED, response_model=dict)
async def create_patient(
    resource: dict,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Create a new FHIR Patient resource.

    Accepts a valid HL7 FHIR R4 Patient JSON body.
    Returns the stored resource with a server-assigned ID.
    """
    # Validate with fhir.resources
    try:
        fhir_patient = FHIRPatient.model_validate(resource)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid FHIR Patient resource: {str(e)}",
        )

    patient_id = str(uuid.uuid4())
    resource_dict = fhir_patient.model_dump(exclude_none=True, mode='json')
    resource_dict["id"] = patient_id
    resource_dict["resourceType"] = "Patient"

    fields = _extract_patient_fields(resource_dict)

    db_patient = Patient(id=patient_id, fhir_resource=resource_dict, **fields)
    db.add(db_patient)
    await db.flush()

    return resource_dict


@router.get("/{patient_id}", response_model=dict)
async def get_patient(
    patient_id: str,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Read a FHIR Patient resource by ID."""
    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    patient = result.scalar_one_or_none()

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient/{patient_id} not found",
        )
    return patient.fhir_resource


@router.put("/{patient_id}", response_model=dict)
async def update_patient(
    patient_id: str,
    resource: dict,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Update an existing FHIR Patient resource (full replace)."""
    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    patient = result.scalar_one_or_none()

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient/{patient_id} not found",
        )

    try:
        fhir_patient = FHIRPatient.model_validate(resource)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid FHIR Patient resource: {str(e)}",
        )

    resource_dict = fhir_patient.model_dump(exclude_none=True, mode='json')
    resource_dict["id"] = patient_id
    resource_dict["resourceType"] = "Patient"

    fields = _extract_patient_fields(resource_dict)
    patient.fhir_resource = resource_dict
    for col, val in fields.items():
        setattr(patient, col, val)

    await db.flush()
    return patient.fhir_resource


@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_patient(
    patient_id: str,
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete a FHIR Patient resource."""
    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    patient = result.scalar_one_or_none()

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient/{patient_id} not found",
        )
    await db.delete(patient)


@router.get("", response_model=dict)
async def search_patients(
    name: Optional[str] = Query(None, description="Search by given or family name"),
    identifier: Optional[str] = Query(None, description="Search by patient identifier"),
    gender: Optional[str] = Query(None, description="Filter by gender (male|female|other|unknown)"),
    _count: int = Query(20, alias="_count", ge=1, le=100, description="Max results to return"),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Search FHIR Patient resources.
    Returns a FHIR Bundle of type 'searchset'.
    """
    query = select(Patient)

    if name:
        query = query.where(
            or_(
                Patient.family_name.ilike(f"%{name}%"),
                Patient.given_name.ilike(f"%{name}%"),
            )
        )
    if identifier:
        query = query.where(Patient.identifier == identifier)
    if gender:
        query = query.where(Patient.gender == gender)

    query = query.limit(_count)
    results = await db.execute(query)
    patients = results.scalars().all()

    # Return as FHIR Bundle searchset
    return {
        "resourceType": "Bundle",
        "type": "searchset",
        "total": len(patients),
        "entry": [
            {"fullUrl": f"Patient/{p.id}", "resource": p.fhir_resource}
            for p in patients
        ],
    }
