#!/bin/bash

# Final WSL2 Setup Verification
echo "🔍 WSL2 Setup Verification"
echo "========================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

PASS=0
FAIL=0

# Function to check and report
check() {
    if eval "$2"; then
        echo -e "${GREEN}✅ $1${NC}"
        ((PASS++))
    else
        echo -e "${RED}❌ $1${NC}"
        ((FAIL++))
    fi
}

# Run checks
check "Vite config has host setting" "grep -q 'host: true' vite.config.ts 2>/dev/null"
check "Package.json has dev:wsl script" "grep -q 'dev:wsl' package.json 2>/dev/null"
check "start-wsl.sh exists" "[ -f start-wsl.sh ]"
check "start-wsl.sh is executable" "[ -x start-wsl.sh ]"
check "wsl-diagnose.sh exists" "[ -f wsl-diagnose.sh ]"
check "Windows batch file exists" "[ -f start-from-windows.bat ]"
check "PowerShell script exists" "[ -f Start-WSL-Server.ps1 ]"
check "Node.js is installed" "command -v node > /dev/null"
check "npm is installed" "command -v npm > /dev/null"
check "Port 5173 is free" "! lsof -i:5173 > /dev/null 2>&1"

echo ""
echo "========================="
echo "Results: $PASS passed, $FAIL failed"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}🎉 All checks passed! WSL2 setup is complete.${NC}"
    echo ""
    echo "Start your server with:"
    echo "  npm run dev:wsl"
    echo ""
    echo "Access from Windows:"
    echo "  http://localhost:5173"
else
    echo -e "${RED}⚠️  Some checks failed. Run ./setup-wsl.sh to fix.${NC}"
fi
