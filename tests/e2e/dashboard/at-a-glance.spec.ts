import { test, expect } from "@playwright/test";
import {
	mockTumblrAPI,
	mockTumblrAPIWithCustomData,
} from "../../fixtures/mock-api";

test.describe("Dashboard - At a Glance", () => {
	// Mock API calls before each test to prevent hitting real Tumblr API
	test.beforeEach(async ({ page }) => {
		await mockTumblrAPI(page);
	});

	test("should display all stat widgets", async ({ page }) => {
		await page.goto("/");

		// Check that all four stat widgets are visible
		await expect(
			page.locator('[data-testid="active-threads-widget"]')
		).toBeVisible();
		await expect(
			page.locator('[data-testid="your-turn-widget"]')
		).toBeVisible();
		await expect(
			page.locator('[data-testid="their-turn-widget"]')
		).toBeVisible();
		await expect(page.locator('[data-testid="queued-widget"]')).toBeVisible();
	});

	test("should display numeric counts", async ({ page }) => {
		await page.goto("/");

		// Wait for data to load
		await page.waitForSelector('[data-testid="active-threads-count"]');

		// Get all count elements
		const activeCount = await page
			.locator('[data-testid="active-threads-count"]')
			.textContent();
		const yourTurnCount = await page
			.locator('[data-testid="your-turn-count"]')
			.textContent();
		const theirTurnCount = await page
			.locator('[data-testid="their-turn-count"]')
			.textContent();
		const queuedCount = await page
			.locator('[data-testid="queued-count"]')
			.textContent();

		// Verify all counts are numeric
		expect(Number(activeCount)).toBeGreaterThanOrEqual(0);
		expect(Number(yourTurnCount)).toBeGreaterThanOrEqual(0);
		expect(Number(theirTurnCount)).toBeGreaterThanOrEqual(0);
		expect(Number(queuedCount)).toBeGreaterThanOrEqual(0);
	});

	test("should navigate to thread lists when clicking widgets", async ({
		page,
	}) => {
		await page.goto("/");

		// Wait for widgets to load
		await page.waitForSelector('[data-testid="active-threads-widget"]');

		// Test Active Threads navigation
		await page.click('[data-testid="active-threads-widget"]');
		await expect(page).toHaveURL("/threads/all");

		// Go back to dashboard
		await page.goto("/");

		// Test Your Turn navigation
		await page.click('[data-testid="your-turn-widget"]');
		await expect(page).toHaveURL("/threads/your-turn");

		// Go back to dashboard
		await page.goto("/");

		// Test Their Turn navigation
		await page.click('[data-testid="their-turn-widget"]');
		await expect(page).toHaveURL("/threads/their-turn");

		// Go back to dashboard
		await page.goto("/");

		// Test Queued navigation
		await page.click('[data-testid="queued-widget"]');
		await expect(page).toHaveURL("/threads/queued");
	});

	test("should refresh Tumblr data when clicking refresh button", async ({
		page,
	}) => {
		await page.goto("/");

		// API is already mocked by beforeEach
		// Wait for initial load
		await page.waitForSelector('[data-testid="refresh-tumblr-button"]');

		// Verify initial state
		await expect(
			page.locator('[data-testid="active-threads-count"]')
		).toBeVisible();

		// Click refresh button
		await page.click('[data-testid="refresh-tumblr-button"]');

		// Wait a moment for the refresh to process
		await page.waitForTimeout(1000);

		// Button should still be enabled after refresh completes
		await expect(
			page.locator('[data-testid="refresh-tumblr-button"]')
		).not.toBeDisabled();

		// Count should still be visible after refresh
		await expect(
			page.locator('[data-testid="active-threads-count"]')
		).toBeVisible();
	});

	test("should maintain counts across navigation", async ({ page }) => {
		await page.goto("/");

		// Wait for data to load
		await page.waitForSelector('[data-testid="active-threads-count"]');

		// Get initial count
		const initialCount = await page
			.locator('[data-testid="active-threads-count"]')
			.textContent();

		// Navigate to a different page
		await page.click('[data-testid="your-turn-widget"]');
		await expect(page).toHaveURL("/threads/your-turn");

		// Navigate back to dashboard
		await page.goto("/");

		// Count should be the same (using cached data)
		await page.waitForSelector('[data-testid="active-threads-count"]');
		const currentCount = await page
			.locator('[data-testid="active-threads-count"]')
			.textContent();

		expect(currentCount).toBe(initialCount);
	});

	test("should handle API errors gracefully", async ({ page }) => {
		// Navigate first (beforeEach has already set up basic mocks)
		await page.goto("/");

		// Wait for initial load to complete
		await page.waitForSelector('[data-testid="refresh-tumblr-button"]');

		// NOW override the mock to fail on subsequent requests
		await page.route("**/api/thread", async (route) => {
			if (route.request().method() === "POST") {
				await route.fulfill({
					status: 500,
					contentType: "application/json",
					body: JSON.stringify({ error: "Internal server error" }),
				});
			} else {
				await route.continue();
			}
		});

		// Try to refresh (should fail and show error toast)
		await page.click('[data-testid="refresh-tumblr-button"]');

		// Should show error toast
		await expect(page.locator(".Toastify__toast--error")).toBeVisible({
			timeout: 10000,
		});
	});

	test("should display correct counts with custom data", async ({ page }) => {
		// Note: beforeEach already called mockTumblrAPI, but we'll override it
		// Set up custom mock data BEFORE navigation
		await mockTumblrAPIWithCustomData(page, {
			activeCount: 10,
			yourTurnCount: 3,
			theirTurnCount: 7,
			queuedCount: 2,
		});

		await page.goto("/");

		// Wait for data to load
		await page.waitForSelector('[data-testid="active-threads-count"]');

		// Verify counts match our mock data
		const activeCount = await page
			.locator('[data-testid="active-threads-count"]')
			.textContent();
		const yourTurnCount = await page
			.locator('[data-testid="your-turn-count"]')
			.textContent();
		const theirTurnCount = await page
			.locator('[data-testid="their-turn-count"]')
			.textContent();
		const queuedCount = await page
			.locator('[data-testid="queued-count"]')
			.textContent();

		expect(Number(activeCount)).toBe(10);
		expect(Number(yourTurnCount)).toBe(3);
		expect(Number(theirTurnCount)).toBe(7);
		expect(Number(queuedCount)).toBe(2);
	});
});
