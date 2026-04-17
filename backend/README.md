# ⚙️ Backend — FastAPI FHIR API

> **For full project documentation see [`../README.md`](../README.md)**

---

## Overview

This is the FastAPI backend for the HIS (Hospital Information System).  
It implements **HL7 FHIR R4** REST APIs backed by **PostgreSQL**.

---

## Local Development Setup

### Prerequisites
- Python **3.11+**
- PostgreSQL **14+** running locally

### Step-by-step

```cmd
:: 1. Create and activate virtual environment
python -m venv venv
venv\Scripts\activate.bat

:: 2. Install all dependencies
pip install -r requirements.txt

:: 3. Create .env from template
copy .env.example .env
```

Edit `.env` with your local PostgreSQL credentials:
```env
DATABASE_URL=postgresql+asyncpg://postgres:PASSWORD@localhost:5432/his_db
SYNC_DATABASE_URL=postgresql://postgres:PASSWORD@localhost:5432/his_db
```

Create the database:
```sql
CREATE DATABASE his_db;
```

### Start the server
```cmd
venv\Scripts\uvicorn.exe app.main:app --reload --port 8000
```

> Database tables are **auto-created** on first startup.  
> Open **http://localhost:8000/docs** for the interactive Swagger UI.

---

## Project Structure

```
backend/
├── app/
│   ├── main.py                    FastAPI app, CORS, lifespan, CapabilityStatement
│   ├── core/
│   │   ├── config.py              Pydantic settings (reads .env)
│   │   └── database.py            Async SQLAlchemy engine + session
│   ├── models/
│   │   ├── patient.py             DB table: patients
│   │   ├── encounter.py           DB table: encounters
│   │   └── observation.py         DB table: observations
│   └── api/
│       ├── router.py              Mounts all FHIR routes under /fhir
│       └── endpoints/
│           ├── patients.py        FHIR Patient CRUD + search
│           ├── encounters.py      FHIR Encounter CRUD + search
│           └── observations.py    FHIR Observation CRUD + search
├── samples/                       Ready-to-use FHIR JSON test payloads
├── Dockerfile                     Docker image definition
├── requirements.txt               Python dependencies
├── .env.example                   Environment variable template
├── setup.bat                      First-time setup (Windows)
└── start.bat                      Start dev server (Windows)
```

---

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `fastapi` | 0.115 | Web framework |
| `uvicorn` | 0.34 | ASGI server |
| `sqlalchemy` | 2.0 | ORM (async) |
| `asyncpg` | 0.30 | Async PostgreSQL driver |
| `fhir.resources` | 8.0 | FHIR R4 Pydantic models & validation |
| `pydantic-settings` | 2.9 | `.env` config management |
| `alembic` | 1.15 | DB migrations (optional) |

---

## FHIR Endpoints Summary

| Resource | Base Path | Supported Operations |
|----------|-----------|---------------------|
| Patient | `/fhir/Patient` | create, read, update, delete, search |
| Encounter | `/fhir/Encounter` | create, read, update, delete, search |
| Observation | `/fhir/Observation` | create, read, update, delete, search |
| Metadata | `/fhir/metadata` | CapabilityStatement (server info) |

For full request/response examples → see **[`../README.md`](../README.md)**

---

## Design Decisions

### JSONB + Relational Columns
Each FHIR resource is stored with **two layers**:
1. **JSONB column** (`fhir_resource`) — stores the complete FHIR JSON for lossless round-trips
2. **Indexed columns** (`family_name`, `status`, `patient_id`, etc.) — enable fast SQL queries without JSON parsing

### Validation
All incoming FHIR payloads are validated against the official `fhir.resources` R4 Pydantic models before saving. Invalid resources return `HTTP 400`.

### Auto Table Creation
Tables are created automatically using `SQLAlchemy Base.metadata.create_all()` on startup via the FastAPI `lifespan` event. No Alembic migration step needed for development.

---

## Docker (Recommended)

Run from the **root** of the project:

```cmd
docker compose up --build -d
```

This starts PostgreSQL, the FastAPI backend, and pgAdmin all together.  
See [`../README.md`](../README.md) for full Docker documentation.
