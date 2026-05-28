import { test, expect } from "@playwright/test";
import { TEST_USERNAME, PUBLIC_VIEW_SLUG } from "../fixtures/seed";
import { mockTumblrApi } from "../helpers/tumblr-mock";

const PUBLIC_URL = `/public/${TEST_USERNAME}/${PUBLIC_VIEW_SLUG}`;

test.describe.configure({ mode: "parallel" });

// 8. Public View (unauthenticated)
test.describe("Public View", () => {
	test.beforeEach(async ({ page }) => {
		await page.context().clearCookies();
		await mockTumblrApi(page);
	});

	test("renders without redirect to login", async ({ page }) => {
		await page.goto(PUBLIC_URL);
		// Should NOT redirect to login
		await expect(page).not.toHaveURL(/\/login/);
		// Should show the view name
		await expect(page.getByRole("heading", { name: "Seeded Public View" })).toBeVisible();
		await expect(page.getByRole("banner").getByText("RPThreadTracker")).toBeVisible();
	});

	test("thread table loads with data", async ({ page }) => {
		await page.goto(PUBLIC_URL);
		await expect(page.getByRole("table")).toBeVisible();
		// Seeded view includes My Turn + Their Turn, so active non-queued threads should appear
		// Thread titles from seed data
		await expect(page.getByRole("table").getByText("Your Turn Thread")).toBeVisible();
		await expect(page.getByRole("table").getByText("Their Turn Thread")).toBeVisible();
	});

	test("status filter dropdown works", async ({ page }) => {
		await page.goto(PUBLIC_URL);
		await expect(page.getByRole("table")).toBeVisible();

		// The seeded view has includeMyTurn + includeTheirTurn, so filter should have options
		const filterSelect = page.locator("select").first();
		await expect(filterSelect).toBeVisible();

		// Filter to "My Turn" only
		await filterSelect.selectOption({ label: "Show Only My Turn" });
		// Their Turn thread should be hidden
		await expect(page.getByRole("table").getByText("Their Turn Thread")).not.toBeVisible();
	});

	test("pagination controls are present", async ({ page }) => {
		await page.goto(PUBLIC_URL);
		await expect(page.getByRole("table")).toBeVisible();
		await expect(page.getByText(/page 1 of/i)).toBeVisible();
		await expect(page.getByRole("button", { name: "Previous" })).toBeVisible();
		await expect(page.getByRole("button", { name: "Next", exact: true })).toBeVisible();
	});

	test("invalid slug returns 404", async ({ page }) => {
		const response = await page.goto(`/public/${TEST_USERNAME}/nonexistent-slug`);
		expect(response?.status()).toBe(404);
	});

	test("invalid username returns 404", async ({ page }) => {
		const response = await page.goto(`/public/nonexistent-user/${PUBLIC_VIEW_SLUG}`);
		expect(response?.status()).toBe(404);
	});
});
