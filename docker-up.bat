@echo off
echo ================================================
echo  HIS - Hospital Information System
echo  Starting Docker services...
echo ================================================
echo.
echo Services:
echo   PostgreSQL  : localhost:5432
echo   FastAPI     : http://localhost:8000
echo   Swagger UI  : http://localhost:8000/docs
echo   pgAdmin     : http://localhost:5050
echo.
docker compose up --build -d
echo.
echo All services started!
echo.
echo Useful commands:
echo   docker compose logs -f backend    -- View API logs
echo   docker compose logs -f postgres   -- View DB logs
echo   docker compose down               -- Stop all services
echo.
pause
