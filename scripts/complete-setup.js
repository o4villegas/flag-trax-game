#!/usr/bin/env node
/**
 * Complete setup script for flag-trax-game development with test users
 * Run with: node scripts/complete-setup.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function runCommand(command, description) {
  try {
    log(`\n🔧 ${description}...`, colors.cyan);
    execSync(command, { stdio: 'inherit' });
    log(`✅ ${description} completed!`, colors.green);
    return true;
  } catch (error) {
    log(`❌ Failed: ${description}`, colors.red);
    console.error(error.message);
    return false;
  }
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`scrypt:${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

async function main() {
  log('\n🚀 FLAG-TRAX-GAME DEVELOPMENT SETUP', colors.bright + colors.green);
  log('====================================\n', colors.bright);

  // Check we're in the right directory
  if (!fs.existsSync('package.json')) {
    log('❌ Error: Run this script from the project root directory', colors.red);
    process.exit(1);
  }

  // Step 1: Install dependencies if needed
  if (!fs.existsSync('node_modules')) {
    if (!runCommand('npm install', 'Installing dependencies')) {
      process.exit(1);
    }
  }

  // Step 2: Apply database migrations
  log('\n📦 STEP 1: Database Setup', colors.bright + colors.yellow);
  if (!runCommand('npx wrangler d1 execute flag-capture-db --local --file=./migrations/0001_init.sql', 'Creating database tables')) {
    log('Tip: Make sure wrangler is configured properly', colors.yellow);
    process.exit(1);
  }

  // Step 3: Generate password hash
  log('\n🔐 STEP 2: Password Generation', colors.bright + colors.yellow);
  const testPassword = 'Test123!';
  const passwordHash = await hashPassword(testPassword);
  log(`Generated hash for password: ${testPassword}`, colors.green);

  // Step 4: Update seed script with the hash
  const seedScriptPath = path.join('scripts', 'seed-test-users.js');
  let seedScript = fs.readFileSync(seedScriptPath, 'utf8');
  seedScript = seedScript.replace(
    /const passwordHash = 'scrypt:.*'/,
    `const passwordHash = '${passwordHash}'`
  );
  fs.writeFileSync(seedScriptPath, seedScript);
  log('Updated seed script with password hash', colors.green);

  // Step 5: Seed test users
  log('\n👤 STEP 3: Creating Test Users', colors.bright + colors.yellow);
  if (!runCommand('node scripts/seed-test-users.js', 'Seeding test users')) {
    process.exit(1);
  }

  // Success!
  log('\n' + '='.repeat(60), colors.bright);
  log('✅ SETUP COMPLETE!', colors.bright + colors.green);
  log('='.repeat(60) + '\n', colors.bright);

  log('📝 TEST ACCOUNTS:', colors.bright + colors.cyan);
  log('  Email: admin@test.com    Password: Test123!  (Admin)', colors.reset);
  log('  Email: player1@test.com  Password: Test123!  (Has Flag #1)', colors.reset);
  log('  Email: player2@test.com  Password: Test123!  (Has Flag #2)', colors.reset);

  log('\n🚀 NEXT STEPS:', colors.bright + colors.cyan);
  log('  1. Start the dev server:  npm run dev', colors.reset);
  log('  2. Visit: http://localhost:5173/dev-signin', colors.reset);
  log('  3. Sign in with any test account above', colors.reset);

  log('\n💡 TIPS:', colors.bright + colors.yellow);
  log('  • The admin account can approve flag requests', colors.reset);
  log('  • Players can capture each other\'s flags', colors.reset);
  log('  • Visit /admin when signed in as admin', colors.reset);
  log('  • QR codes will be generated for approved flags', colors.reset);
  
  log('\n🎮 Happy testing!\n', colors.bright + colors.green);
}

// Run the setup
main().catch(error => {
  log(`\n❌ Setup failed: ${error.message}`, colors.red);
  process.exit(1);
});
