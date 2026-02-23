@echo off
echo Starting CRM Backend...
cd /d "%~dp0backend"
start "CRM Backend" cmd /k "node server.js"
echo Waiting for backend to start...
timeout /t 3 /nobreak > NUL
echo Starting CRM Frontend...
cd /d "%~dp0frontend"
start "CRM Frontend" cmd /k "node_modules\.bin\vite.cmd --port 3000"
echo.
echo ========================================
echo  CRM System Started!
echo  Backend:  http://localhost:5000
echo  Frontend: http://localhost:3000
echo  Admin: admin@crm.com / Admin@123456
echo ========================================
