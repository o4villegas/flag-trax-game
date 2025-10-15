#!/bin/bash
# Make all scripts executable
chmod +x start-wsl.sh
chmod +x wsl-diagnose.sh
chmod +x debug.sh
chmod +x status.sh
chmod +x make-executable.sh

echo "✅ All scripts are now executable!"
echo ""
echo "🚀 Quick Start Commands:"
echo "========================"
echo ""
echo "From WSL/Linux terminal:"
echo "  ./start-wsl.sh       # Start WSL2-optimized server"
echo "  ./wsl-diagnose.sh    # Run network diagnostics"
echo "  npm run dev:wsl      # Direct server start"
echo ""
echo "From Windows:"
echo "  Double-click: start-from-windows.bat"
echo "  Or PowerShell: .\\Start-WSL-Server.ps1"
echo ""
