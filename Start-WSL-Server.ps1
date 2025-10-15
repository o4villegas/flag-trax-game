# WSL2 Flag-Trax-Game Server Launcher (PowerShell)
# Run this from Windows PowerShell or Windows Terminal

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host " WSL2 Flag-Trax-Game Server Launcher" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if WSL is installed
$wslStatus = wsl --list --quiet 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: WSL is not installed or not running" -ForegroundColor Red
    Write-Host "Please install WSL2 from Microsoft Store" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Get WSL IP
$wslIp = wsl hostname -I
$wslIp = $wslIp.Trim()

Write-Host "WSL2 IP Address: $wslIp" -ForegroundColor Green
Write-Host ""
Write-Host "Starting Flag-Trax-Game server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Access the app at:" -ForegroundColor Green
Write-Host "  • http://localhost:5173" -ForegroundColor White
Write-Host "  • http://127.0.0.1:5173" -ForegroundColor White
Write-Host "  • http://${wslIp}:5173" -ForegroundColor White
Write-Host ""

# Check if firewall rule exists
$firewallRule = Get-NetFirewallRule -DisplayName "WSL2 Vite Dev Server" -ErrorAction SilentlyContinue
if (-not $firewallRule) {
    Write-Host "⚠️  Firewall rule not found" -ForegroundColor Yellow
    Write-Host "Run as Administrator to add firewall rule:" -ForegroundColor Yellow
    Write-Host 'New-NetFirewallRule -DisplayName "WSL2 Vite Dev Server" -Direction Inbound -Protocol TCP -LocalPort 5173 -Action Allow' -ForegroundColor Cyan
    Write-Host ""
}

Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Start the server
wsl -d Ubuntu -- bash -c "cd ~/flag-trax-game && npm run dev:wsl"
