@echo off
REM Start Chrome with Remote Debugging
REM This allows Claude Code's Chrome DevTools MCP to connect

echo Closing all Chrome instances...
taskkill /F /IM chrome.exe 2>nul
timeout /t 2 /nobreak >nul

echo Starting Chrome with remote debugging on port 9222...
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="%TEMP%\chrome-debug-profile" http://localhost:8080

echo.
echo Chrome is now running with remote debugging enabled!
echo.
echo You can verify it's working by opening this URL in Chrome:
echo http://localhost:9222/json
echo.
echo Now tell Claude Code that Chrome is ready!
echo.
pause
