import { test, expect } from "@playwright/test";
import { mockExternalApis } from "../helpers/tumblr-mock";
import { EXPECTED_COUNTS } from "../fixtures/seed";

test.beforeEach(async ({ page }) => {
	await mockExternalApis(page);
});

// 3. Dashboard
test.describe("Dashboard", () => {
	test("page loads without error", async ({ page }) => {
		await page.goto("/");
		await expect(page.getByRole("heading", { name: /at a glance/i })).toBeVisible();
	});

	test("At a Glance shows correct counts from fixture data", async ({ page }) => {
		await page.goto("/");
		await expect(page.getByTestId("active-threads-count")).toHaveText(String(EXPECTED_COUNTS.allThreads));
		await expect(page.getByTestId("your-turn-count")).toHaveText(String(EXPECTED_COUNTS.yourTurn));
		await expect(page.getByTestId("their-turn-count")).toHaveText(String(EXPECTED_COUNTS.theirTurn));
		await expect(page.getByTestId("queued-count")).toHaveText(String(EXPECTED_COUNTS.queued));
	});

	test("At a Glance stat cards link to correct thread pages", async ({ page }) => {
		await page.goto("/");
		await expect(page.getByTestId("active-threads-widget")).toHaveAttribute("href", "/threads/all");
		await expect(page.getByTestId("your-turn-widget")).toHaveAttribute("href", "/threads/your-turn");
		await expect(page.getByTestId("their-turn-widget")).toHaveAttribute("href", "/threads/their-turn");
		await expect(page.getByTestId("queued-widget")).toHaveAttribute("href", "/threads/queued");
	});

	test("Recent Activity shows Your Turn threads with action buttons", async ({ page }) => {
		await page.goto("/");
		await expect(page.getByRole("heading", { name: /recent activity/i })).toBeVisible();
		const firstItem = page.locator("[class*='divide-y'] > div").first();
		await expect(firstItem.getByRole("button", { name: /untrack/i })).toBeVisible();
		await expect(firstItem.getByRole("button", { name: /archive/i })).toBeVisible();
		await expect(firstItem.getByRole("button", { name: /mark queued/i })).toBeVisible();
	});

	test("Your Characters shows character cards and Manage Characters link", async ({ page }) => {
		await page.goto("/");
		await expect(page.getByRole("heading", { name: /your characters/i })).toBeVisible();
		await expect(page.getByRole("link", { name: /manage characters/i })).toBeVisible();
	});

	test("Random Thread Generator has Generate button", async ({ page }) => {
		await page.goto("/");
		await expect(page.getByRole("button", { name: /generate/i })).toBeVisible();
	});
});
