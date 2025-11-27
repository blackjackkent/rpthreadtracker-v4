import { Page, expect } from '@playwright/test';

/**
 * Test helper utilities for Playwright tests
 */

/**
 * Wait for an element to be visible with a custom timeout
 */
export async function waitForElement(
  page: Page,
  selector: string,
  options: { timeout?: number } = {}
) {
  const { timeout = 5000 } = options;
  await expect(page.locator(selector)).toBeVisible({ timeout });
}

/**
 * Fill a form field and wait for it to be filled
 */
export async function fillField(page: Page, selector: string, value: string) {
  await page.fill(selector, value);
  await expect(page.locator(selector)).toHaveValue(value);
}

/**
 * Click an element and wait for navigation if expected
 */
export async function clickAndWait(
  page: Page,
  selector: string,
  options: { waitForNavigation?: boolean; url?: string | RegExp } = {}
) {
  const { waitForNavigation = false, url } = options;

  if (waitForNavigation) {
    await Promise.all([
      page.waitForURL(url || '*', { timeout: 5000 }),
      page.click(selector),
    ]);
  } else {
    await page.click(selector);
  }
}

/**
 * Wait for a toast notification to appear
 */
export async function waitForToast(
  page: Page,
  type: 'success' | 'error' | 'info' | 'warning' = 'success',
  timeout = 5000
) {
  const selector = `.Toastify__toast--${type}`;
  await expect(page.locator(selector)).toBeVisible({ timeout });
}

/**
 * Get text content from an element
 */
export async function getTextContent(page: Page, selector: string): Promise<string> {
  return (await page.locator(selector).textContent()) || '';
}

/**
 * Get numeric value from an element
 */
export async function getNumericValue(page: Page, selector: string): Promise<number> {
  const text = await getTextContent(page, selector);
  return Number(text.trim());
}

/**
 * Check if an element exists (without waiting)
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
  return (await page.locator(selector).count()) > 0;
}

/**
 * Wait for loading state to complete
 */
export async function waitForLoadingComplete(page: Page, loadingSelector = '[data-loading="true"]') {
  // Wait for loading indicator to appear (optional)
  try {
    await page.waitForSelector(loadingSelector, { timeout: 1000 });
  } catch {
    // Loading might be too fast to catch
  }

  // Wait for loading indicator to disappear
  await page.waitForSelector(loadingSelector, { state: 'hidden', timeout: 10000 });
}

/**
 * Take a screenshot with a descriptive name
 */
export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
}

/**
 * Login helper for tests that don't use the auth fixture
 */
export async function login(
  page: Page,
  username: string = process.env.TEST_USERNAME || 'testuser',
  password: string = process.env.TEST_PASSWORD || 'testpassword'
) {
  await page.goto('/login');
  await fillField(page, 'input[name="username"]', username);
  await fillField(page, 'input[name="password"]', password);
  await clickAndWait(page, 'button[type="submit"]', { waitForNavigation: true, url: '/' });
}

/**
 * Logout helper
 */
export async function logout(page: Page) {
  // Click profile dropdown
  await page.click('[data-testid="profile-menu-button"]');
  // Click logout
  await page.click('[data-testid="logout-button"]');
  // Wait for redirect to login
  await page.waitForURL('/login');
}

/**
 * Check if user is logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  return elementExists(page, 'header');
}

/**
 * Navigate to a page and wait for it to load
 */
export async function navigateTo(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
}

/**
 * Get all data-testid attributes on the page (for debugging)
 */
export async function getTestIds(page: Page): Promise<string[]> {
  const elements = await page.locator('[data-testid]').all();
  const testIds: string[] = [];

  for (const element of elements) {
    const testId = await element.getAttribute('data-testid');
    if (testId) testIds.push(testId);
  }

  return testIds;
}

/**
 * Wait for API request to complete
 */
export async function waitForAPIRequest(
  page: Page,
  urlPattern: string | RegExp,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET'
) {
  return page.waitForRequest(
    (request) =>
      (typeof urlPattern === 'string'
        ? request.url().includes(urlPattern)
        : urlPattern.test(request.url())) && request.method() === method
  );
}

/**
 * Wait for API response to complete
 */
export async function waitForAPIResponse(
  page: Page,
  urlPattern: string | RegExp,
  expectedStatus = 200
) {
  return page.waitForResponse(
    (response) =>
      (typeof urlPattern === 'string'
        ? response.url().includes(urlPattern)
        : urlPattern.test(response.url())) && response.status() === expectedStatus
  );
}