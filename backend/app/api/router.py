from fastapi import APIRouter
from app.api.endpoints import patients, encounters, observations

# The base FHIR path prefix: /fhir
router = APIRouter(prefix="/fhir")

router.include_router(patients.router)
router.include_router(encounters.router)
router.include_router(observations.router)
