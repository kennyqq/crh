@echo off
setlocal

cd /d "%~dp0"

set "PORT=4173"

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$port = %PORT%;" ^
  "$found = $false;" ^
  "$occupied = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1;" ^
  "if ($occupied) {" ^
  "  try {" ^
    "    Stop-Process -Id $occupied.OwningProcess -Force -ErrorAction Stop;" ^
    "    Write-Host ('Stopped process on port ' + $port + ' (PID ' + $occupied.OwningProcess + ').');" ^
  "    $found = $true;" ^
  "  } catch {}" ^
  "}" ^
  "if ($found) {" ^
  "  Write-Host 'Demo stopped.';" ^
  "} else {" ^
  "  Write-Host 'No running demo process was found.';" ^
  "}"

exit /b %errorlevel%
