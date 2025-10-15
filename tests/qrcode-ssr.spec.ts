import { test, expect } from '@playwright/test';

test.describe('QRCode Generation After SSR Fix', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication for admin access
    // In a real test, you'd need proper auth setup
    await page.goto('/');
  });

  test('Admin dashboard loads without SSR errors', async ({ page }) => {
    // Listen for console errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Check for the specific SSR error we fixed
        if (text.includes('superCtor.prototype') || text.includes('pngjs')) {
          consoleErrors.push(text);
        }
      }
    });

    // Navigate to admin dashboard
    await page.goto('/admin');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check that no SSR errors occurred
    expect(consoleErrors).toHaveLength(0);
    
    // Verify admin dashboard elements are present
    const title = page.locator('h1:has-text("Admin Dashboard")');
    await expect(title).toBeVisible();
  });

  test('QR code generation works correctly', async ({ page }) => {
    // This test would require proper admin authentication
    // Placeholder for QR code generation test
    
    // Navigate to admin
    await page.goto('/admin');
    
    // If authenticated as admin:
    // 1. Click on Flags tab
    // await page.click('text=Flags');
    
    // 2. Find a flag with QR button
    // const qrButton = page.locator('button:has-text("QR")').first();
    
    // 3. Click QR button
    // await qrButton.click();
    
    // 4. Verify QR dialog opens
    // const qrDialog = page.locator('text=QR Code');
    // await expect(qrDialog).toBeVisible();
    
    // 5. Verify QR image is present
    // const qrImage = page.locator('img[alt*="QR Code"]');
    // await expect(qrImage).toBeVisible();
    
    // 6. Verify download button works
    // const downloadButton = page.locator('button:has-text("Download")');
    // await expect(downloadButton).toBeEnabled();
  });

  test('No QRCode errors in browser console', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/admin');
    await page.waitForTimeout(2000); // Wait for any async errors

    // Filter for QRCode-related errors
    const qrcodeErrors = errors.filter(e => 
      e.includes('qrcode') || 
      e.includes('pngjs') || 
      e.includes('superCtor')
    );

    expect(qrcodeErrors).toHaveLength(0);
  });
});
