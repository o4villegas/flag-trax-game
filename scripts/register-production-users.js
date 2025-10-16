#!/usr/bin/env node
/**
 * Register production demo users using Better Auth's API
 * This ensures passwords are hashed correctly by Better Auth itself
 */

const PRODUCTION_URL = 'https://flag-trax-game.lando555.workers.dev';
const TEST_ACCOUNTS = [
  { email: 'admin@test.com', name: 'Demo Admin', password: 'Test123!' },
  { email: 'player1@test.com', name: 'Demo Player 1', password: 'Test123!' },
  { email: 'player2@test.com', name: 'Demo Player 2', password: 'Test123!' }
];

async function registerUser(email, name, password) {
  console.log(`\nRegistering ${email}...`);

  try {
    const response = await fetch(`${PRODUCTION_URL}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        name
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`✅ Successfully registered ${email}`);
      return true;
    } else {
      console.log(`⚠️  Failed to register ${email}: ${data.error || 'Unknown error'}`);
      if (data.error?.includes('already exists')) {
        console.log(`   User might already exist - trying to sign in...`);
        // Try to sign in to verify the account works
        const signInResponse = await fetch(`${PRODUCTION_URL}/api/auth/sign-in/email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password
          })
        });

        if (signInResponse.ok) {
          console.log(`   ✅ Sign-in successful - account is working!`);
          return true;
        } else {
          console.log(`   ❌ Sign-in failed - password might be different`);
          return false;
        }
      }
      return false;
    }
  } catch (error) {
    console.error(`❌ Error registering ${email}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Registering production demo users...');
  console.log(`   URL: ${PRODUCTION_URL}`);
  console.log(`   Password for all accounts: Test123!`);
  console.log('');

  let successCount = 0;

  for (const account of TEST_ACCOUNTS) {
    const success = await registerUser(account.email, account.name, account.password);
    if (success) successCount++;
  }

  console.log('\n' + '='.repeat(50));
  console.log(`\n📊 Results: ${successCount}/${TEST_ACCOUNTS.length} accounts ready`);

  if (successCount === TEST_ACCOUNTS.length) {
    console.log('\n✅ All demo accounts are ready!');
    console.log('\n📝 Test credentials:');
    TEST_ACCOUNTS.forEach(acc => {
      console.log(`   ${acc.email} / Test123!`);
    });
  } else {
    console.log('\n⚠️  Some accounts failed - check the output above');
  }

  console.log('\n🔗 Test the app at:', PRODUCTION_URL);
}

main().catch(console.error);