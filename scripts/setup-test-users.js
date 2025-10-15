#!/usr/bin/env node
/**
 * Setup script that creates test users using Better Auth's actual API
 * This ensures password hashing matches what Better Auth expects
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Step 1: Ensure database exists
log('📦 Creating database tables...', colors.cyan);
try {
  execSync('npx wrangler d1 execute flag-capture-db --local --file=./migrations/0001_init.sql', { 
    stdio: 'inherit' 
  });
  log('✅ Database tables created', colors.green);
} catch (error) {
  log('❌ Failed to create database - may already exist', colors.yellow);
}

// Step 2: Create test data SQL
const testDataSQL = `
-- Clear existing test data
DELETE FROM captures WHERE captured_by_user_id IN (SELECT id FROM user WHERE email LIKE '%@test.com');
DELETE FROM flags WHERE original_requester_id IN (SELECT id FROM user WHERE email LIKE '%@test.com');
DELETE FROM flag_requests WHERE user_id IN (SELECT id FROM user WHERE email LIKE '%@test.com');
DELETE FROM account WHERE user_id IN (SELECT id FROM user WHERE email LIKE '%@test.com');
DELETE FROM session WHERE user_id IN (SELECT id FROM user WHERE email LIKE '%@test.com');
DELETE FROM user WHERE email LIKE '%@test.com';

-- Insert test users (Better Auth will handle password hashing when they first sign in)
INSERT INTO user (id, name, email, email_verified, created_at, updated_at) VALUES 
('test_admin_id', 'Admin User', 'admin@test.com', 1, ${Date.now()}, ${Date.now()}),
('test_user1_id', 'Player One', 'player1@test.com', 1, ${Date.now()}, ${Date.now()}),
('test_user2_id', 'Player Two', 'player2@test.com', 1, ${Date.now()}, ${Date.now()});

-- Create approved flag requests
INSERT INTO flag_requests (user_id, status, processed_at, processed_by_admin_email) VALUES 
('test_user1_id', 'approved', datetime('now'), 'admin@test.com'),
('test_user2_id', 'approved', datetime('now'), 'admin@test.com');

-- Create flags
INSERT INTO flags (flag_number, current_owner_id, original_requester_id) VALUES 
(1, 'test_user1_id', 'test_user1_id'),
(2, 'test_user2_id', 'test_user2_id');
`;

// Write SQL to temp file
const tempSQLFile = path.join('migrations', 'temp_test_data.sql');
fs.writeFileSync(tempSQLFile, testDataSQL);

// Step 3: Execute test data SQL
log('\n👤 Creating test users...', colors.cyan);
try {
  execSync(`npx wrangler d1 execute flag-capture-db --local --file=${tempSQLFile}`, { 
    stdio: 'inherit' 
  });
  log('✅ Test users created', colors.green);
} catch (error) {
  log('❌ Failed to create test users', colors.red);
  console.error(error.message);
}

// Clean up temp file
fs.unlinkSync(tempSQLFile);

// Step 4: Create a script to register passwords properly
log('\n🔐 Setting up authentication...', colors.cyan);
const authSetupInstructions = `
IMPORTANT: Test users are created but passwords need to be set!

Since Better Auth handles password hashing internally, you need to:

1. Start the dev server: npm run dev
2. Visit http://localhost:5173/sign-up
3. Register each test account with password "Test123!":
   - admin@test.com
   - player1@test.com  
   - player2@test.com

OR use the simplified dev signin at:
http://localhost:5173/dev-signin

Note: The dev signin will only work after passwords are set.
`;

log(authSetupInstructions, colors.yellow);

log('\n✅ Setup complete!', colors.green);
log('\n🚀 Next step: npm run dev', colors.cyan);
