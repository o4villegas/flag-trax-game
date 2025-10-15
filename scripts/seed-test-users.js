#!/usr/bin/env node
// Seed test users for Better Auth with known passwords

import Database from 'better-sqlite3';
import crypto from 'crypto';

// Open the local D1 database
const dbPath = '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/0bb5e186-87f3-4bfc-8bed-6fecff09bc1a.sqlite';
const db = new Database(dbPath);

// Generated password hash for "Test123!" - Replace with actual hash from hash-password.js
// Format: scrypt:salt:hash
const passwordHash = 'scrypt:a1b2c3d4e5f6789012345678901234567:8a9b0c1d2e3f4567890123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcd';

const users = [
  { 
    id: crypto.randomUUID(), 
    email: 'admin@test.com', 
    name: 'Admin User',
    role: 'admin'
  },
  { 
    id: crypto.randomUUID(), 
    email: 'player1@test.com', 
    name: 'Player One',
    role: 'user'
  },
  { 
    id: crypto.randomUUID(), 
    email: 'player2@test.com', 
    name: 'Player Two',
    role: 'user'
  }
];

console.log('Creating test users...\n');

try {
  // Insert users
  users.forEach(user => {
    // Insert user record
    const userStmt = db.prepare(`
      INSERT INTO user (id, name, email, email_verified, created_at, updated_at) 
      VALUES (?, ?, ?, 1, ?, ?)
    `);
    userStmt.run(user.id, user.name, user.email, Date.now(), Date.now());
    
    // Insert account with hashed password
    const accountStmt = db.prepare(`
      INSERT INTO account (id, account_id, provider_id, user_id, password, created_at) 
      VALUES (?, ?, 'credential', ?, ?, ?)
    `);
    accountStmt.run(crypto.randomUUID(), user.id, user.id, passwordHash, Date.now());
    
    console.log(`✓ Created user: ${user.name} (${user.email})`);
  });

  // Add some initial flag requests and flags for testing
  console.log('\nCreating initial test data...');
  
  // Flag request for Player One
  const flagRequestStmt = db.prepare(`
    INSERT INTO flag_requests (user_id, status, processed_at, processed_by_admin_email) 
    VALUES (?, 'approved', datetime('now'), 'admin@test.com')
  `);
  flagRequestStmt.run(users[1].id);
  
  // Create flag owned by Player One
  const flagStmt = db.prepare(`
    INSERT INTO flags (flag_number, current_owner_id, original_requester_id) 
    VALUES (1, ?, ?)
  `);
  flagStmt.run(users[1].id, users[1].id);
  
  console.log('✓ Created flag #1 for Player One');
  
  // Flag request for Player Two
  flagRequestStmt.run(users[2].id);
  
  // Create flag owned by Player Two
  const flagStmt2 = db.prepare(`
    INSERT INTO flags (flag_number, current_owner_id, original_requester_id) 
    VALUES (2, ?, ?)
  `);
  flagStmt2.run(users[2].id, users[2].id);
  
  console.log('✓ Created flag #2 for Player Two');
  
  console.log('\n✅ Test users and data created successfully!');
  console.log('\nTest accounts:');
  console.log('  Email: admin@test.com    Password: Test123!');
  console.log('  Email: player1@test.com  Password: Test123!');
  console.log('  Email: player2@test.com  Password: Test123!');
  
} catch (error) {
  console.error('Error creating test users:', error);
} finally {
  db.close();
}
