import { test as setup, expect } from '@playwright/test';

const authFile = 'tests/.auth/user.json';

/**
 * Authentication setup that runs before all tests
 * Logs in once and saves the authenticated state for reuse
 */
setup('authenticate', async ({ page }) => {
  // Navigate to login page
  await page.goto('/login');

  // Fill in login form
  // TODO: Replace with your test user credentials
  // Consider using environment variables for CI/CD
  await page.fill('input[name="username"]', process.env.TEST_USERNAME || 'testuser');
  await page.fill('input[name="password"]', process.env.TEST_PASSWORD || 'testpassword');

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for redirect to home page after successful login
  await page.waitForURL('/');

  // Verify we're logged in by checking for header elements
  await expect(page.locator('header')).toBeVisible();

  // Save signed-in state to 'tests/.auth/user.json'
  await page.context().storageState({ path: authFile });

  console.log('✓ Authentication setup complete');
});