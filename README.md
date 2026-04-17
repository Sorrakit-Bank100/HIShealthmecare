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

### Start all services
```cmd
docker compose up --build -d
```


### Stop services
```cmd
docker compose down
```


### Frontend (Next.js)

**Requirements:** Node.js 18+

```cmd
cd his-app
npm install
npm run dev
```

Frontend runs at **http://localhost:3000**

