#!/usr/bin/env node
// Generate password hash using Better Auth's internal hashing

import { hash } from "better-auth/crypto";

async function hashPassword(password: string) {
  const hashed = await hash(password);
  console.log('Password:', password);
  console.log('Hashed:', hashed);
  console.log('\nUse this hash in your seed file');
  return hashed;
}

const password = process.argv[2] || 'Test123!';
hashPassword(password).catch(console.error);
