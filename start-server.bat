@echo off
echo ============================================
echo   PHOTOBOOTH LOCAL SERVER
echo ============================================
echo.
echo Starting server on http://localhost:8000
echo.
echo IMPORTANT:
echo - Don't close this window while using the app
echo - Open browser and go to: http://localhost:8000
echo - Press Ctrl+C to stop the server
echo.
echo ============================================
echo.

cd /d "%~dp0"
echo Checking and installing required Python libraries...
pip install -r requirements.txt
echo.
python server.py

pause
