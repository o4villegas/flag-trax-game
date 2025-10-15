#!/bin/bash
chmod +x verify-qrcode-fix.sh
chmod +x verify-wsl.sh
chmod +x wsl-diagnose.sh
chmod +x start-wsl.sh
chmod +x setup-wsl.sh
chmod +x status.sh
chmod +x debug.sh

echo "✅ All scripts are now executable!"
echo ""
echo "To verify the QRCode fix:"
echo "  ./verify-qrcode-fix.sh"
echo ""
echo "To restart the server:"
echo "  npm run dev:wsl"
echo ""
