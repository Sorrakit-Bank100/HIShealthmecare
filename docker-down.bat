@echo off
echo Stopping and removing all HIS containers...
docker compose down -v
echo Done.
pause
