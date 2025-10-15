#!/bin/bash

# WSL2 Network Diagnostics Script
echo "🔍 WSL2 Network Diagnostics"
echo "=========================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check WSL version
echo "1. WSL Environment:"
echo "-------------------"
if grep -q microsoft /proc/version; then
    echo -e "${GREEN}✅ Running in WSL${NC}"
    
    if grep -q WSL2 /proc/version; then
        echo -e "${GREEN}✅ WSL2 detected${NC}"
    else
        echo -e "${YELLOW}⚠️  WSL1 detected (WSL2 recommended)${NC}"
    fi
else
    echo -e "${RED}❌ Not running in WSL${NC}"
fi

# Get network information
echo ""
echo "2. Network Information:"
echo "----------------------"
WSL_IP=$(hostname -I | awk '{print $1}')
echo "WSL IP: $WSL_IP"

# Check localhost resolution
echo ""
echo "3. Localhost Resolution:"
echo "-----------------------"
if ping -c 1 localhost > /dev/null 2>&1; then
    echo -e "${GREEN}✅ localhost resolves${NC}"
else
    echo -e "${RED}❌ localhost does not resolve${NC}"
fi

# Check if port 5173 is in use
echo ""
echo "4. Port 5173 Status:"
echo "-------------------"
if lsof -i:5173 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port 5173 is in use by:${NC}"
    lsof -i:5173
else
    echo -e "${GREEN}✅ Port 5173 is available${NC}"
fi

# Check Node.js and npm
echo ""
echo "5. Node.js Environment:"
echo "----------------------"
if command -v node > /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js installed: $NODE_VERSION${NC}"
else
    echo -e "${RED}❌ Node.js not found${NC}"
fi

if command -v npm > /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✅ npm installed: $NPM_VERSION${NC}"
else
    echo -e "${RED}❌ npm not found${NC}"
fi

# Check project location
echo ""
echo "6. Project Location:"
echo "-------------------"
CURRENT_DIR=$(pwd)
if [[ $CURRENT_DIR == /mnt/* ]]; then
    echo -e "${YELLOW}⚠️  Project is on Windows filesystem (/mnt/)${NC}"
    echo "   Performance may be slower"
    echo "   Consider moving to /home/ for better performance"
else
    echo -e "${GREEN}✅ Project is on WSL filesystem${NC}"
    echo "   Optimal performance location"
fi

# Network interfaces
echo ""
echo "7. Network Interfaces:"
echo "---------------------"
ip -4 addr show | grep -E "eth0|inet"

# Check Windows connectivity
echo ""
echo "8. Connectivity Test:"
echo "--------------------"
echo "Testing connection to Windows host..."
WINDOWS_IP=$(ip route show | grep default | awk '{print $3}')
if ping -c 1 $WINDOWS_IP > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Can reach Windows host at $WINDOWS_IP${NC}"
else
    echo -e "${RED}❌ Cannot reach Windows host${NC}"
fi

# Recommendations
echo ""
echo "9. Recommendations:"
echo "==================="
echo ""
echo -e "${BLUE}To start the dev server:${NC}"
echo "  npm run dev:wsl"
echo ""
echo -e "${BLUE}Access from Windows:${NC}"
echo "  • http://localhost:5173"
echo "  • http://$WSL_IP:5173"
echo ""
echo -e "${BLUE}If connection fails, try:${NC}"
echo "  1. Restart WSL: wsl --shutdown (from Windows)"
echo "  2. Add firewall rule (Windows PowerShell as Admin):"
echo '     New-NetFirewallRule -DisplayName "WSL2 Vite" -Direction Inbound -Protocol TCP -LocalPort 5173 -Action Allow'
echo "  3. Disable Windows Defender for WSL path"
echo ""

# Check if vite config has host setting
echo "10. Vite Configuration:"
echo "----------------------"
if [ -f "vite.config.ts" ]; then
    if grep -q "host: true" vite.config.ts; then
        echo -e "${GREEN}✅ Vite config has host exposure enabled${NC}"
    else
        echo -e "${YELLOW}⚠️  Vite config may need host: true setting${NC}"
    fi
else
    echo -e "${RED}❌ vite.config.ts not found${NC}"
fi

echo ""
echo "=========================="
echo "Diagnostics Complete!"
echo ""
