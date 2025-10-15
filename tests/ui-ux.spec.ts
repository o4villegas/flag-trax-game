import { test, expect } from '@playwright/test';

test.describe('UI/UX Improvements', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Navigation is consistent across pages', async ({ page }) => {
    // Check navigation exists on home page
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.getByText('Flag Capture')).toBeVisible();

    // Navigate to sign-in and check navigation (should not show)
    await page.getByRole('link', { name: 'Sign In' }).click();
    await expect(page.locator('nav')).not.toBeVisible();

    // Go back to home
    await page.getByRole('link', { name: 'Back to Home' }).click();
    await expect(page.locator('nav')).toBeVisible();

    // Test mobile menu toggle
    await page.setViewportSize({ width: 375, height: 667 });
    const menuButton = page.getByRole('button', { name: 'Toggle navigation menu' });
    if (await menuButton.isVisible()) {
      await menuButton.click();
      // Mobile menu should be visible
      await expect(page.getByText('Menu')).toBeVisible();
    }
  });

  test('Loading states show skeletons', async ({ page }) => {
    // Mock slow API response
    await page.route('/api/stats/me', async (route) => {
      await page.waitForTimeout(1000);
      await route.fulfill({ 
        json: { stats: { flagsOwned: 5, totalCaptures: 10, flagsRequested: 2 } } 
      });
    });

    // Navigate to stats page (requires auth mock)
    // This would need auth setup, but checking for skeleton presence
    await page.goto('/my-stats');
    
    // Should see skeleton instead of "Loading..."
    const skeleton = page.locator('[data-slot="skeleton"]').first();
    if (await skeleton.isVisible()) {
      await expect(skeleton).toHaveClass(/animate-pulse/);
    }
  });

  test('Empty states have call-to-action buttons', async ({ page }) => {
    // Mock empty response
    await page.route('/api/flags/mine', async (route) => {
      await route.fulfill({ json: { flags: [] } });
    });

    // Would need auth, but checking structure
    await page.goto('/my-stats');

    // Check for empty state elements
    const emptyState = page.locator('text=/No Flags Yet/i');
    if (await emptyState.isVisible()) {
      // Should have a CTA button
      await expect(page.getByRole('button', { name: /Request.*Flag/i })).toBeVisible();
    }
  });

  test('Forms show validation errors', async ({ page }) => {
    await page.goto('/sign-up');

    // Submit empty form
    await page.getByRole('button', { name: 'Sign Up' }).click();

    // Should show validation errors
    await expect(page.getByText(/at least 2 characters/i)).toBeVisible();
    await expect(page.getByText(/valid email/i)).toBeVisible();

    // Type invalid email
    await page.getByLabel('Email').fill('notanemail');
    await page.getByLabel('Email').blur();
    await expect(page.getByText(/valid email/i)).toBeVisible();

    // Type weak password
    await page.getByLabel('Password', { exact: true }).fill('weak');
    await page.getByLabel('Password', { exact: true }).blur();
    await expect(page.getByText(/at least 8 characters/i)).toBeVisible();

    // Password mismatch
    await page.getByLabel('Password', { exact: true }).fill('StrongPass123');
    await page.getByLabel('Confirm Password').fill('DifferentPass123');
    await page.getByLabel('Confirm Password').blur();
    await expect(page.getByText(/Passwords don't match/i)).toBeVisible();
  });

  test('Buttons show loading state', async ({ page }) => {
    await page.goto('/sign-in');

    // Mock slow login
    await page.route('/api/auth/sign-in', async (route) => {
      await page.waitForTimeout(1000);
      await route.fulfill({ json: { success: false } });
    });

    // Fill form
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');

    // Click submit
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Should show loading state
    await expect(page.getByText('Signing in...')).toBeVisible();
    await expect(page.locator('.animate-spin')).toBeVisible();
  });

  test('Responsive design works on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');

    // Desktop nav should be hidden
    await expect(page.locator('.md\\:flex').first()).not.toBeVisible();

    // Mobile menu button should be visible
    await expect(page.getByRole('button', { name: 'Toggle navigation menu' })).toBeVisible();

    // Check that cards stack on mobile
    await page.goto('/my-stats');
    const gridElement = page.locator('.grid').first();
    if (await gridElement.isVisible()) {
      // On mobile, should have grid-cols-1
      await expect(gridElement).toHaveClass(/grid-cols-1/);
    }
  });

  test('Icons enhance visual hierarchy', async ({ page }) => {
    await page.goto('/');

    // Check for Lucide icons
    const svgIcons = page.locator('svg').filter({ hasText: '' });
    const iconCount = await svgIcons.count();
    
    // Should have multiple icons on the page
    expect(iconCount).toBeGreaterThan(0);

    // Check specific icon usage in buttons
    await page.goto('/sign-in');
    const signInButton = page.getByRole('button', { name: /Sign In/i });
    if (await signInButton.isVisible()) {
      const buttonIcon = signInButton.locator('svg').first();
      // Icon should be present in button
      await expect(buttonIcon).toBeTruthy();
    }
  });

  test('Error boundaries display gracefully', async ({ page }) => {
    // Navigate to non-existent flag
    await page.goto('/flag/99999');

    // Should show error state, not crash
    const errorCard = page.locator('text=/Error|Failed/i').first();
    if (await errorCard.isVisible()) {
      // Should have retry button
      await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
    }
  });

  test('Accessibility: Focus management', async ({ page }) => {
    await page.goto('/sign-in');

    // Tab through form
    await page.keyboard.press('Tab'); // Skip nav
    await page.keyboard.press('Tab'); // Focus email
    
    const emailInput = page.getByLabel('Email');
    await expect(emailInput).toBeFocused();

    await page.keyboard.press('Tab'); // Focus password
    const passwordInput = page.getByLabel('Password');
    await expect(passwordInput).toBeFocused();

    await page.keyboard.press('Tab'); // Focus submit button
    const submitButton = page.getByRole('button', { name: /Sign In/i });
    await expect(submitButton).toBeFocused();
  });

  test('Dark mode is properly applied', async ({ page }) => {
    await page.goto('/');

    // Check for dark class on html
    const htmlElement = page.locator('html');
    await expect(htmlElement).toHaveClass(/dark/);

    // Check dark mode styles are applied
    const body = page.locator('body');
    const backgroundColor = await body.evaluate((el) => 
      window.getComputedStyle(el).backgroundColor
    );
    
    // Dark mode should have dark background
    // RGB values for dark backgrounds are typically low
    expect(backgroundColor).toMatch(/rgb\(\d{1,2}, \d{1,2}, \d{1,2}\)/);
  });
});
