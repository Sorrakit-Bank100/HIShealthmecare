"""
HIS FHIR API - Main Application
================================
Hospital Information System backend using FastAPI + PostgreSQL.
Implements HL7 FHIR R4 REST API.

Swagger UI  : http://localhost:8000/docs
ReDoc       : http://localhost:8000/redoc
FHIR Base   : http://localhost:8000/fhir
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import init_db
from app.api.router import router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize the database on startup."""
    await init_db()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
## HIS - Hospital Information System API

This API implements **HL7 FHIR R4** standards for healthcare data interoperability.

### Available FHIR Resources
| Resource    | Endpoint              | Description                                 |
|-------------|----------------------|---------------------------------------------|
| Patient     | `/fhir/Patient`      | Patient demographics                        |
| Encounter   | `/fhir/Encounter`    | Clinical visits (OPD, IPD, Emergency, etc.) |
| Observation | `/fhir/Observation`  | Vital signs, lab results, clinical findings |

### FHIR Interactions Supported
- `create` — POST
- `read` — GET /{id}
- `update` — PUT /{id}
- `delete` — DELETE /{id}
- `search` — GET with query parameters
    """,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS - allow frontend (Next.js his-app) to connect easily in dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for easier local network testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount FHIR routes
app.include_router(router)


@app.get("/", tags=["Health"])
async def root():
    """Health check and API info."""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "fhir_version": "R4",
        "status": "running",
        "docs": "/docs",
        "fhir_base": "/fhir",
    }


@app.get("/fhir/metadata", tags=["FHIR Capability"])
async def capability_statement():
    """
    FHIR CapabilityStatement - describes the server's capabilities.
    Required entry point for FHIR-compliant servers.
    """
    return {
        "resourceType": "CapabilityStatement",
        "status": "active",
        "kind": "instance",
        "fhirVersion": "4.0.1",
        "format": ["json"],
        "rest": [
            {
                "mode": "server",
                "resource": [
                    {
                        "type": "Patient",
                        "interaction": [
                            {"code": "read"},
                            {"code": "create"},
                            {"code": "update"},
                            {"code": "delete"},
                            {"code": "search-type"},
                        ],
                        "searchParam": [
                            {"name": "name", "type": "string"},
                            {"name": "identifier", "type": "token"},
                            {"name": "gender", "type": "token"},
                        ],
                    },
                    {
                        "type": "Encounter",
                        "interaction": [
                            {"code": "read"},
                            {"code": "create"},
                            {"code": "update"},
                            {"code": "delete"},
                            {"code": "search-type"},
                        ],
                        "searchParam": [
                            {"name": "patient", "type": "reference"},
                            {"name": "status", "type": "token"},
                        ],
                    },
                    {
                        "type": "Observation",
                        "interaction": [
                            {"code": "read"},
                            {"code": "create"},
                            {"code": "update"},
                            {"code": "delete"},
                            {"code": "search-type"},
                        ],
                        "searchParam": [
                            {"name": "patient", "type": "reference"},
                            {"name": "encounter", "type": "reference"},
                            {"name": "code", "type": "token"},
                        ],
                    },
                ],
            }
        ],
    }
