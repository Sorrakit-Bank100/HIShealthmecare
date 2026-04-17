@echo off
echo ========================================
echo  HIS FHIR Backend - Setup Script
echo ========================================

:: Step 1: Create virtual environment
echo [1/4] Creating Python virtual environment...
python -m venv venv

:: Step 2: Activate venv
echo [2/4] Activating virtual environment...
call venv\Scripts\activate.bat

:: Step 3: Install dependencies
echo [3/4] Installing dependencies...
pip install -r requirements.txt

:: Step 4: Copy .env if not exists
echo [4/4] Setting up .env file...
if not exist .env (
    copy .env.example .env
    echo .env created. Please edit it with your PostgreSQL credentials.
) else (
    echo .env already exists, skipping.
)

echo.
echo ========================================
echo  Setup complete!
echo  Next steps:
echo    1. Edit .env with your PostgreSQL credentials
echo    2. Run: start.bat
echo ========================================
pause
