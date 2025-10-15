#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}🚀 WSL2 Dev Server Startup Script 🚀${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

# Get WSL IP address
WSL_IP=$(hostname -I | awk '{print $1}')
echo -e "${GREEN}✅ WSL2 IP Address:${NC} $WSL_IP"

# Check if port 5173 is already in use
if lsof -i:5173 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port 5173 is already in use${NC}"
    echo "Killing existing process..."
    kill $(lsof -t -i:5173) 2>/dev/null
    sleep 2
fi

# Display access URLs
echo ""
echo -e "${BLUE}📌 Access URLs:${NC}"
echo -e "${GREEN}From Windows:${NC}"
echo "  • http://localhost:5173"
echo "  • http://127.0.0.1:5173"
echo "  • http://$WSL_IP:5173"
echo ""
echo -e "${GREEN}From Mobile (same network):${NC}"
echo "  • http://$WSL_IP:5173"
echo ""

# Windows Firewall reminder
echo -e "${YELLOW}🔥 Firewall Reminder:${NC}"
echo "If you can't connect, run this in Windows PowerShell (as Admin):"
echo -e "${BLUE}New-NetFirewallRule -DisplayName \"WSL2 Vite\" -Direction Inbound -Protocol TCP -LocalPort 5173 -Action Allow${NC}"
echo ""

# Performance tip based on file location
CURRENT_DIR=$(pwd)
if [[ $CURRENT_DIR == /mnt/* ]]; then
    echo -e "${YELLOW}⚠️  Performance Warning:${NC}"
    echo "Your project is on Windows filesystem (/mnt/)"
    echo "For better performance, move to WSL filesystem (/home/)"
    echo ""
fi

# Start the server
echo -e "${GREEN}🎯 Starting WSL2-optimized dev server...${NC}"
echo ""
echo "Press Ctrl+C to stop the server"
echo -e "${BLUE}=====================================${NC}"
echo ""

# Start with host exposure
npm run dev:wsl
