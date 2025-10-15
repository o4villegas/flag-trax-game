import { test, expect } from '@playwright/test';

/**
 * Production Login Test
 * Tests authentication against the live production deployment
 */

const PRODUCTION_URL = 'https://flag-trax-game.lando555.workers.dev';

// Test accounts (must be seeded in production database)
const TEST_ACCOUNTS = {
  admin: {
    email: 'admin@test.com',
    password: 'Test123!',
    name: 'Demo Admin',
  },
  player1: {
    email: 'player1@test.com',
    password: 'Test123!',
    name: 'Demo Player 1',
  },
  player2: {
    email: 'player2@test.com',
    password: 'Test123!',
    name: 'Demo Player 2',
  },
};

test.describe('Production Deployment - Authentication', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto(PRODUCTION_URL);

    // Wait for page to load
    await expect(page).toHaveTitle(/Flag/i);

    // Check for sign-in button (user not authenticated)
    const signInButton = page.getByRole('link', { name: /sign in/i });
    await expect(signInButton).toBeVisible();

    console.log('✅ Homepage loaded successfully');
  });

  test('should sign in as admin user', async ({ page }) => {
    await page.goto(`${PRODUCTION_URL}/sign-in`);

    // Fill in credentials
    await page.getByLabel(/email/i).fill(TEST_ACCOUNTS.admin.email);
    await page.getByLabel(/password/i).fill(TEST_ACCOUNTS.admin.password);

    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for redirect to homepage after successful login
    await page.waitForURL(PRODUCTION_URL + '/', { timeout: 10000 });

    // Verify user is logged in - check for email in navigation
    const navigation = page.locator('nav');
    await expect(navigation.getByText(TEST_ACCOUNTS.admin.email)).toBeVisible({ timeout: 10000 });

    // Verify admin has access to admin dashboard link
    const adminLink = page.getByRole('link', { name: /admin/i });
    await expect(adminLink).toBeVisible();

    console.log('✅ Admin login successful');
    console.log(`✅ Admin email visible: ${TEST_ACCOUNTS.admin.email}`);
    console.log('✅ Admin dashboard link visible');
  });

  test('should sign in as regular player', async ({ page }) => {
    await page.goto(`${PRODUCTION_URL}/sign-in`);

    // Fill in credentials
    await page.getByLabel(/email/i).fill(TEST_ACCOUNTS.player1.email);
    await page.getByLabel(/password/i).fill(TEST_ACCOUNTS.player1.password);

    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for redirect to homepage
    await page.waitForURL(PRODUCTION_URL + '/', { timeout: 10000 });

    // Verify user is logged in
    const navigation = page.locator('nav');
    await expect(navigation.getByText(TEST_ACCOUNTS.player1.email)).toBeVisible({ timeout: 10000 });

    // Verify player does NOT have admin link
    const adminLink = page.getByRole('link', { name: /admin dashboard/i });
    await expect(adminLink).not.toBeVisible();

    // Verify player has access to user features
    const requestFlagLink = page.getByRole('link', { name: /request flag/i });
    await expect(requestFlagLink).toBeVisible();

    const myStatsLink = page.getByRole('link', { name: /my stats/i });
    await expect(myStatsLink).toBeVisible();

    console.log('✅ Player login successful');
    console.log(`✅ Player email visible: ${TEST_ACCOUNTS.player1.email}`);
    console.log('✅ No admin access (correct)');
    console.log('✅ User features visible (Request Flag, My Stats)');
  });

  test('should fail login with wrong password', async ({ page }) => {
    await page.goto(`${PRODUCTION_URL}/sign-in`);

    // Fill in wrong credentials
    await page.getByLabel(/email/i).fill(TEST_ACCOUNTS.player1.email);
    await page.getByLabel(/password/i).fill('WrongPassword123!');

    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait a bit for potential error message
    await page.waitForTimeout(2000);

    // Should still be on sign-in page (not redirected)
    expect(page.url()).toContain('/sign-in');

    console.log('✅ Login failed with wrong password (expected)');
  });

  test('admin can access admin dashboard', async ({ page }) => {
    // First sign in as admin
    await page.goto(`${PRODUCTION_URL}/sign-in`);
    await page.getByLabel(/email/i).fill(TEST_ACCOUNTS.admin.email);
    await page.getByLabel(/password/i).fill(TEST_ACCOUNTS.admin.password);
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for login
    await page.waitForURL(PRODUCTION_URL + '/', { timeout: 10000 });

    // Navigate to admin dashboard
    await page.getByRole('link', { name: /admin/i }).first().click();

    // Wait for admin page to load
    await page.waitForURL(`${PRODUCTION_URL}/admin`, { timeout: 10000 });

    // Verify admin dashboard loaded
    await expect(page.getByRole('heading', { name: /admin dashboard/i })).toBeVisible();

    // Check for tabs
    await expect(page.getByRole('tab', { name: /flag requests/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /flags/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /captures/i })).toBeVisible();

    console.log('✅ Admin dashboard accessible');
    console.log('✅ All tabs visible (Flag Requests, Flags, Captures)');
  });
});
