# 🏥 HIS — Hospital Information System

> A full-stack **Hospital Information System** built with **Next.js** (frontend) and **FastAPI + PostgreSQL** (backend), implementing the **HL7 FHIR R4** standard for healthcare data interoperability.

---

## 📐 Architecture Overview

```
HIShealthmecare/
│
├── 🖥️  his-app/              Next.js 15 Frontend          → http://localhost:3000
│   ├── app/                  App Router pages
│   ├── components/           Reusable UI components
│   └── ...
│
├── ⚙️  backend/              FastAPI FHIR API              → http://localhost:8000
│   ├── app/
│   │   ├── main.py           Application entry point
│   │   ├── core/             Config & database setup
│   │   ├── models/           SQLAlchemy DB models
│   │   └── api/endpoints/    FHIR REST endpoints
│   ├── Dockerfile
│   └── requirements.txt
│
├── 🐳  docker-compose.yml    Orchestrates all services
├── 🐳  docker/
│   ├── postgres/init.sql     DB initialization script
│   └── pgadmin/servers.json  pgAdmin auto-configuration
│
├── docker-up.bat             Start all services (Windows)
└── docker-down.bat           Stop all services (Windows)
```

---

## 🛠️ Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend** | Next.js | 15 | Hospital UI |
| **API Framework** | FastAPI | 0.115 | FHIR REST API |
| **FHIR Standard** | fhir.resources | 8.0 | HL7 FHIR R4 validation |
| **Database** | PostgreSQL | 16 | Persistent storage |
| **ORM** | SQLAlchemy | 2.0 (async) | Database access |
| **DB Driver** | asyncpg | 0.30 | Async PostgreSQL driver |
| **Container** | Docker + Compose | — | Service orchestration |
| **DB Browser** | pgAdmin 4 | latest | PostgreSQL web UI |

---

## 🚀 Quick Start (Docker — Recommended)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### 1. Clone and start
```bash
git clone https://github.com/Sorrakit-Bank100/HIShealthmecare.git
cd HIShealthmecare
```

### 2. Start all services
```cmd
docker compose up --build -d
```

Or double-click **`docker-up.bat`** on Windows.

### 3. Access the services

| Service | URL | Login |
|---------|-----|-------|
| 📋 **Swagger UI** (API docs) | http://localhost:8000/docs | — |
| 🔁 **ReDoc** (API reference) | http://localhost:8000/redoc | — |
| 🗄️ **pgAdmin** (DB browser) | http://localhost:5050 | `admin@his.local` / `admin` |
| 🏥 **Next.js Frontend** | http://localhost:3000 | — |

### 4. Stop services
```cmd
docker compose down
```

---

## 💻 Local Development (Without Docker)

### Backend (FastAPI)

**Requirements:** Python 3.11+, PostgreSQL 14+

```cmd
cd backend

:: 1. Create virtual environment
python -m venv venv

:: 2. Activate it (Windows CMD)
venv\Scripts\activate.bat

:: 3. Install dependencies
pip install -r requirements.txt

:: 4. Copy and configure environment
copy .env.example .env
```

Edit `backend\.env`:
```env
DATABASE_URL=postgresql+asyncpg://postgres:yourpassword@localhost:5432/his_db
SYNC_DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/his_db
```

Create the PostgreSQL database:
```sql
CREATE DATABASE his_db;
```

Start the API server:
```cmd
venv\Scripts\uvicorn.exe app.main:app --reload --port 8000
```

> Tables are **auto-created** on first startup — no migration step needed.

---

### Frontend (Next.js)

**Requirements:** Node.js 18+

```cmd
cd his-app
npm install
npm run dev
```

Frontend runs at **http://localhost:3000**

---

## 📡 FHIR API Reference

All endpoints are prefixed with `/fhir` and follow the **HL7 FHIR R4** REST specification.

### 🔵 Patient — `/fhir/Patient`

Stores patient demographics in the HIS.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/fhir/Patient` | Register a new patient |
| `GET` | `/fhir/Patient/{id}` | Get patient by ID |
| `PUT` | `/fhir/Patient/{id}` | Update patient data |
| `DELETE` | `/fhir/Patient/{id}` | Delete patient |
| `GET` | `/fhir/Patient?name=&identifier=&gender=` | Search patients |

**Example — Register Patient:**
```bash
curl -X POST http://localhost:8000/fhir/Patient \
  -H "Content-Type: application/json" \
  -d '{
    "resourceType": "Patient",
    "identifier": [{"system": "https://his.hospital.th/hn", "value": "HN-001"}],
    "name": [{"family": "สมชาย", "given": ["นาย"]}],
    "gender": "male",
    "birthDate": "1990-05-20",
    "active": true
  }'
```

---

### 🟢 Encounter — `/fhir/Encounter`

Records clinical visits (OPD, IPD, Emergency, etc.)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/fhir/Encounter` | Create a new visit |
| `GET` | `/fhir/Encounter/{id}` | Get encounter by ID |
| `PUT` | `/fhir/Encounter/{id}` | Update encounter |
| `DELETE` | `/fhir/Encounter/{id}` | Delete encounter |
| `GET` | `/fhir/Encounter?patient=&status=` | Search by patient/status |

**Encounter status values:** `planned` · `in-progress` · `finished` · `cancelled`

**Example — Create OPD Visit:**
```bash
curl -X POST http://localhost:8000/fhir/Encounter \
  -H "Content-Type: application/json" \
  -d '{
    "resourceType": "Encounter",
    "status": "in-progress",
    "class": {"code": "AMB", "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode"},
    "subject": {"reference": "Patient/PATIENT_ID"},
    "period": {"start": "2024-04-16T08:00:00+07:00"}
  }'
```

---

### 🟠 Observation — `/fhir/Observation`

Records vital signs, lab results, and clinical findings.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/fhir/Observation` | Record a new measurement |
| `GET` | `/fhir/Observation/{id}` | Get observation by ID |
| `PUT` | `/fhir/Observation/{id}` | Update observation |
| `DELETE` | `/fhir/Observation/{id}` | Delete observation |
| `GET` | `/fhir/Observation?patient=&code=` | Search observations |

**Example — Record Body Temperature:**
```bash
curl -X POST http://localhost:8000/fhir/Observation \
  -H "Content-Type: application/json" \
  -d '{
    "resourceType": "Observation",
    "status": "final",
    "code": {
      "coding": [{"system": "http://loinc.org", "code": "8310-5", "display": "Body temperature"}]
    },
    "subject": {"reference": "Patient/PATIENT_ID"},
    "encounter": {"reference": "Encounter/ENCOUNTER_ID"},
    "effectiveDateTime": "2024-04-16T08:15:00+07:00",
    "valueQuantity": {"value": 38.5, "unit": "°C", "system": "http://unitsofmeasure.org", "code": "Cel"}
  }'
```

---

### ℹ️ Server Info

| Endpoint | Description |
|----------|-------------|
| `GET /` | Health check |
| `GET /fhir/metadata` | FHIR CapabilityStatement |

---

## 🗄️ Database Schema

Each FHIR resource is stored with:
- **Indexed relational columns** — for fast SQL queries (name, status, patient_id, etc.)
- **Full FHIR JSON** in a `JSONB` column — for complete round-trip fidelity to the FHIR standard

| Table | Key Columns | FHIR Resource |
|-------|------------|---------------|
| `patients` | `id`, `family_name`, `given_name`, `gender`, `birth_date`, `identifier` | Patient |
| `encounters` | `id`, `patient_id`, `status`, `encounter_class`, `period_start`, `period_end` | Encounter |
| `observations` | `id`, `patient_id`, `encounter_id`, `status`, `code`, `value_string` | Observation |

---

## 🐳 Docker Services

```
docker-compose.yml
│
├── postgres      PostgreSQL 16        localhost:5432
│   └── Volume: postgres_data (persists DB data)
│
├── backend       FastAPI              localhost:8000
│   └── Hot-reload enabled (./backend/app mounted)
│
└── pgadmin       pgAdmin 4            localhost:5050
    └── Pre-connected to postgres automatically
```

### Environment Variables (`.env` at root)

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_USER` | `his_user` | PostgreSQL username |
| `POSTGRES_PASSWORD` | `his_password` | PostgreSQL password |
| `POSTGRES_DB` | `his_db` | Database name |
| `PGADMIN_EMAIL` | `admin@his.local` | pgAdmin login email |
| `PGADMIN_PASSWORD` | `admin` | pgAdmin login password |

---

## 📂 Sample Test Payloads

Ready-to-use FHIR JSON files are in `backend/samples/`:

| File | Resource | Description |
|------|----------|-------------|
| `patient_create.json` | Patient | Thai patient with HN identifier |
| `encounter_create.json` | Encounter | OPD ambulatory visit |
| `observation_vital_signs.json` | Observation | Body temperature 38.5°C |

```cmd
:: Use with curl from the backend/ directory:
curl -X POST http://localhost:8000/fhir/Patient -H "Content-Type: application/json" -d @samples/patient_create.json
```

---

## 🔗 References

| Resource | Link |
|----------|------|
| HL7 FHIR R4 Specification | https://hl7.org/fhir/R4/ |
| FHIR Patient | https://hl7.org/fhir/R4/patient.html |
| FHIR Encounter | https://hl7.org/fhir/R4/encounter.html |
| FHIR Observation | https://hl7.org/fhir/R4/observation.html |
| FastAPI Docs | https://fastapi.tiangolo.com |
| SQLAlchemy Async | https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html |
| fhir.resources Lib | https://github.com/nazrulworld/fhir.resources |
