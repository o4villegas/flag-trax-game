#!/bin/bash

echo "🔍 Flag-Trax-Game Debug Report"
echo "================================"
echo ""

# Check if all required files exist
echo "📂 Checking Component Files..."
COMPONENTS=(
  "app/components/Layout.tsx"
  "app/components/Navigation.tsx"
  "app/components/LoadingStates.tsx"
  "app/components/EmptyState.tsx"
  "app/components/ImagePreviewModal.tsx"
  "app/components/index.ts"
)

for component in "${COMPONENTS[@]}"; do
  if [ -f "$component" ]; then
    echo "✅ $component exists"
  else
    echo "❌ $component is missing!"
  fi
done

echo ""
echo "📂 Checking UI Components..."
UI_COMPONENTS=(
  "app/components/ui/sheet.tsx"
  "app/components/ui/separator.tsx"
  "app/components/ui/dropdown-menu.tsx"
  "app/components/ui/avatar.tsx"
  "app/components/ui/alert.tsx"
)

for ui_component in "${UI_COMPONENTS[@]}"; do
  if [ -f "$ui_component" ]; then
    echo "✅ $ui_component exists"
  else
    echo "❌ $ui_component is missing!"
  fi
done

echo ""
echo "📂 Checking Route Files..."
ROUTES=(
  "app/routes/home.tsx"
  "app/routes/my-stats.tsx"
  "app/routes/flag.tsx"
  "app/routes/request-flag.tsx"
  "app/routes/auth/sign-in.tsx"
  "app/routes/auth/sign-up.tsx"
  "app/routes/capture-success.tsx"
  "app/routes/admin/dashboard.tsx"
)

for route in "${ROUTES[@]}"; do
  if [ -f "$route" ]; then
    echo "✅ $route exists"
  else
    echo "❌ $route is missing!"
  fi
done

echo ""
echo "🔧 Running Type Check..."
npm run typecheck 2>&1 | head -20

echo ""
echo "✨ Debug Complete!"
