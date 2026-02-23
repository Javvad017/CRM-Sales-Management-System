@echo off
echo Starting CRM & Sales Management System...
echo.

REM Start Backend
cd /d "%~dp0backend"
start "CRM Backend" cmd /k "node server.js"

echo Backend starting on port 5000...
timeout /t 3 /nobreak > NUL

REM Start Frontend
cd /d "%~dp0frontend"
start "CRM Frontend" cmd /k "node node_modules\vite\bin\vite.js --port 4000 --host"

echo.
echo ========================================
echo  CRM System is starting up!
echo.
echo  Backend:  http://localhost:5000
echo  Frontend: http://localhost:4000
echo.
echo  Login with:
echo  Email:    admin@crm.com
echo  Password: Admin@123456
echo ========================================
echo.
pause
