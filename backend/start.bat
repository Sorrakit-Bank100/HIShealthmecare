@echo off
echo Starting HIS FHIR API Server...
call venv\Scripts\activate.bat
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
