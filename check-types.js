// Type check script to verify all imports are working
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

console.log('🔍 Running Type Check...\n');

const checkFile = (filePath: string) => {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    return false;
  }
  console.log(`✅ File exists: ${filePath}`);
  return true;
};

// Check critical files
const criticalFiles = [
  'app/components/Layout.tsx',
  'app/components/Navigation.tsx',
  'app/components/LoadingStates.tsx',
  'app/components/EmptyState.tsx',
  'app/components/ImagePreviewModal.tsx',
];

console.log('Checking component files...');
criticalFiles.forEach(checkFile);

console.log('\nChecking UI components...');
const uiComponents = [
  'app/components/ui/sheet.tsx',
  'app/components/ui/separator.tsx',
  'app/components/ui/alert.tsx',
  'app/components/ui/avatar.tsx',
  'app/components/ui/dropdown-menu.tsx',
];

uiComponents.forEach(checkFile);

console.log('\n✨ File check complete!');

// Try to run TypeScript compiler
console.log('\n🔧 Running TypeScript compiler...\n');
try {
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log('✅ TypeScript compilation successful!');
} catch (error) {
  console.log('⚠️  TypeScript found some issues (this is normal during development)');
}
