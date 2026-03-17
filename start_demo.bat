@echo off
setlocal

cd /d "%~dp0"

set "PORT=4173"
set "URL=http://127.0.0.1:%PORT%"

where node >nul 2>&1
if errorlevel 1 (
  echo node.exe was not found. Please install Node.js first.
  pause
  exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
  echo npm.cmd was not found. Please install Node.js first.
  pause
  exit /b 1
)

if not exist ".runtime" mkdir ".runtime" >nul 2>&1

echo [1/5] Checking dependencies...
if not exist "node_modules" (
  echo node_modules not found. Installing packages...
  call npm install
  if errorlevel 1 (
    echo npm install failed.
    pause
    exit /b 1
  )
) else (
  echo Dependencies already installed.
)

echo [2/5] Building frontend...
call npm run build
if errorlevel 1 (
  echo Build failed.
  pause
  exit /b 1
)

echo [3/5] Checking whether preview is already running...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$occupied = Get-NetTCPConnection -LocalPort %PORT% -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1;" ^
  "if ($occupied) { exit 0 } else { exit 1 }"
if not errorlevel 1 (
  echo Preview is already running at %URL%
  start "" "%URL%"
  exit /b 0
)

if exist ".runtime\preview.log" del ".runtime\preview.log" >nul 2>&1

echo [4/5] Starting preview server in background...
start "" /min cmd /c "cd /d ""%~dp0"" && npm run preview -- --host 127.0.0.1 --port %PORT% > "".runtime\preview.log"" 2>&1"

echo [5/5] Waiting for preview server...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ready = $false;" ^
  "for ($i = 0; $i -lt 20; $i++) {" ^
  "  Start-Sleep -Seconds 1;" ^
  "  try {" ^
  "    Invoke-WebRequest -Uri '%URL%' -UseBasicParsing -TimeoutSec 2 | Out-Null;" ^
  "    $ready = $true;" ^
  "    break;" ^
  "  } catch {}" ^
  "}" ^
  "if ($ready) {" ^
  "  Start-Process '%URL%';" ^
  "  Write-Host 'Demo started successfully.';" ^
  "  Write-Host 'URL: %URL%';" ^
  "  Write-Host 'Log: .runtime\\preview.log';" ^
  "  exit 0;" ^
  "} else {" ^
  "  Write-Host 'Preview server did not respond. Check log: .runtime\\preview.log';" ^
  "  exit 1;" ^
  "}"
if errorlevel 1 (
  echo.
  echo Failed to start the demo.
  pause
  exit /b 1
)
exit /b 0
