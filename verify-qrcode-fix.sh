#!/bin/bash

# QRCode SSR Fix Verification Script
echo "🔍 QRCode SSR Fix Verification"
echo "=============================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if the fix is applied
echo "1. Checking if QRCode import is fixed..."
if grep -q "import QRCode from 'qrcode'" app/routes/admin/dashboard.tsx; then
    echo -e "${RED}❌ Top-level QRCode import still present${NC}"
    echo "   Fix not applied correctly!"
    exit 1
else
    echo -e "${GREEN}✅ Top-level QRCode import removed${NC}"
fi

# Check if dynamic import is present
echo ""
echo "2. Checking for dynamic import..."
if grep -q "await import('qrcode')" app/routes/admin/dashboard.tsx; then
    echo -e "${GREEN}✅ Dynamic import found${NC}"
else
    echo -e "${RED}❌ Dynamic import not found${NC}"
    echo "   Fix may not be complete!"
    exit 1
fi

# Check for window check
echo ""
echo "3. Checking for client-side safety check..."
if grep -q "typeof window === 'undefined'" app/routes/admin/dashboard.tsx; then
    echo -e "${GREEN}✅ Client-side check found${NC}"
else
    echo -e "${YELLOW}⚠️  No window check found (optional but recommended)${NC}"
fi

# Check if comments are present
echo ""
echo "4. Checking for documentation comments..."
if grep -q "SSR" app/routes/admin/dashboard.tsx; then
    echo -e "${GREEN}✅ SSR explanation comments found${NC}"
else
    echo -e "${YELLOW}⚠️  No SSR comments found${NC}"
fi

echo ""
echo "=============================="
echo -e "${GREEN}✅ QRCode SSR fix has been applied successfully!${NC}"
echo ""
echo "Next steps:"
echo "1. Restart your dev server: npm run dev:wsl"
echo "2. Check console for SSR errors (should be gone)"
echo "3. Test QR code generation in admin dashboard"
echo ""
