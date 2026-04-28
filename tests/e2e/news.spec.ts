import { test, expect, type Page } from "@playwright/test";
import { mockTumblrApi, mockNewsApiWithItems } from "../helpers/tumblr-mock";

test.beforeEach(async ({ page }) => {
	await mockTumblrApi(page);
	await mockNewsApiWithItems(page);
});

const newsButton = (page: Page) =>
	page.getByRole("button", { name: /^news/i });
const newsPanel = (page: Page) =>
	page.getByRole("complementary", { name: "News sidebar" });

// 4. News Sidebar
test.describe("News Sidebar", () => {
	test("news button shows unread badge on first visit", async ({ page }) => {
		await page.goto("/");
		await expect(
			page.getByRole("button", { name: /news \(2 unread\)/i }),
		).toBeVisible();
	});

	test("clicking news button opens sidebar", async ({ page }) => {
		await page.goto("/");
		const panel = newsPanel(page);
		await expect(panel).toHaveClass(/translate-x-full/);
		await newsButton(page).click();
		await expect(panel).toHaveClass(/translate-x-0/);
	});

	test("news items display with New badges on first open", async ({ page }) => {
		await page.goto("/");
		await newsButton(page).click();
		await expect(page.getByText("Test News Item One")).toBeVisible();
		await expect(page.getByText("Test News Item Two")).toBeVisible();
		await expect(newsPanel(page).getByText("New", { exact: true })).toHaveCount(2);
	});

	test("news item links open in new tab", async ({ page }) => {
		await page.goto("/");
		await newsButton(page).click();
		const link = page.getByRole("link", { name: "Test News Item One" });
		await expect(link).toHaveAttribute("target", "_blank");
	});

	test("closing and reopening shows no New badges after reading", async ({
		page,
	}) => {
		await page.goto("/");
		await newsButton(page).click();
		await expect(newsPanel(page).getByText("New", { exact: true }).first()).toBeVisible();
		await page.getByRole("button", { name: "Close news" }).click();
		await newsButton(page).click();
		await expect(newsPanel(page).getByText("New", { exact: true })).toHaveCount(0);
	});

	test("X button closes the sidebar", async ({ page }) => {
		await page.goto("/");
		await newsButton(page).click();
		const panel = newsPanel(page);
		await expect(panel).toHaveClass(/translate-x-0/);
		await page.getByRole("button", { name: "Close news" }).click();
		await expect(panel).toHaveClass(/translate-x-full/);
	});

	test("clicking backdrop closes the sidebar", async ({ page }) => {
		await page.goto("/");
		await newsButton(page).click();
		const panel = newsPanel(page);
		await expect(panel).toHaveClass(/translate-x-0/);
		await page.locator(".fixed.inset-0.z-40").click();
		await expect(panel).toHaveClass(/translate-x-full/);
	});
});
