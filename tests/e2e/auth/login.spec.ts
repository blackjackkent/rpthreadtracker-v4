import { test, expect } from "@playwright/test";

test.describe("Login Flow", () => {
	// This test runs without authentication state
	test.use({ storageState: { cookies: [], origins: [] } });

	test("should display login page", async ({ page }) => {
		await page.goto("/login");

		// Check that login form is visible
		await expect(page.locator('input[name="login"]')).toBeVisible();
		await expect(page.locator('input[name="password"]')).toBeVisible();
		await expect(page.locator('button[type="submit"]')).toBeVisible();
	});

	test("should show error for invalid credentials", async ({ page }) => {
		await page.goto("/login");

		// Fill in invalid credentials
		await page.fill('input[name="login"]', "invaliduser");
		await page.fill('input[name="password"]', "wrongpassword");

		// Submit form
		await page.click('button[type="submit"]');

		// Wait for error message (adjust selector based on your error display)
		// This might be a toast, inline error, or alert
		await expect(page.locator("text=/invalid|incorrect|failed/i")).toBeVisible({
			timeout: 5000,
		});
	});

	test("should redirect to login when accessing protected route", async ({
		page,
	}) => {
		// Try to access dashboard without being logged in
		await page.goto("/");

		// Should be redirected to login page
		await expect(page).toHaveURL(/\/login/);
	});

	test("should login successfully with valid credentials", async ({ page }) => {
		await page.goto("/login");

		// Fill in valid credentials
		// TODO: Replace with your test user credentials
		await page.fill(
			'input[name="login"]',
			process.env.TEST_USERNAME || "testuser"
		);
		await page.fill(
			'input[name="password"]',
			process.env.TEST_PASSWORD || "testpassword"
		);

		// Submit form
		await page.click('button[type="submit"]');

		// Should redirect to home/dashboard
		await expect(page).toHaveURL("/");

		// Verify we can see authenticated content
		await expect(page.locator("header")).toBeVisible();
	});

	test("should persist session after page refresh", async ({ page }) => {
		await page.goto("/login");

		// Login
		await page.fill(
			'input[name="login"]',
			process.env.TEST_USERNAME || "testuser"
		);
		await page.fill(
			'input[name="password"]',
			process.env.TEST_PASSWORD || "testpassword"
		);
		await page.click('button[type="submit"]');
		await page.waitForURL("/");

		// Refresh the page
		await page.reload();

		// Should still be logged in (not redirected to login)
		await expect(page).toHaveURL("/");
		await expect(page.locator("header")).toBeVisible();
	});
});
