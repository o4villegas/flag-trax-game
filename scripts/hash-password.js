#!/usr/bin/env node
// Generate Better Auth compatible password hashes using scrypt

import crypto from 'crypto';

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`scrypt:${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

// Generate hash for test password
const testPassword = 'Test123!';

console.log('Generating password hash for "Test123!"...');
hashPassword(testPassword).then(hash => {
  console.log('\nPassword hash generated:');
  console.log(hash);
  console.log('\nCopy this hash to seed-test-users.js');
}).catch(err => {
  console.error('Error generating hash:', err);
});
