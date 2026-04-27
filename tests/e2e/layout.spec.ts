import { test, expect } from "@playwright/test";
import { mockExternalApis } from "../helpers/tumblr-mock";

test.beforeEach(async ({ page }) => {
	await mockExternalApis(page);
});

// 2.2 Header
test.describe("Header", () => {
	test("logo is visible and navigates to dashboard", async ({ page }) => {
		await page.goto("/threads/all");
		await page.getByRole("link", { name: "RPTHREADTRACKER", exact: true }).click();
		await expect(page).toHaveURL("/dashboard");
	});

	test("Add menu opens and Track New Thread opens thread modal", async ({ page }) => {
		await page.goto("/");
		await page.getByRole("button", { name: /add menu/i }).click();
		await page.getByRole("button", { name: "Track New Thread" }).click();
		await expect(page.getByRole("dialog")).toBeVisible();
	});

	test("Add menu opens and Add Character opens character modal", async ({ page }) => {
		await page.goto("/");
		await page.getByRole("button", { name: /add menu/i }).click();
		await page.getByRole("button", { name: "Add Character" }).click();
		await expect(page.getByRole("dialog")).toBeVisible();
	});

	test("profile dropdown Settings link navigates to /settings", async ({ page }) => {
		await page.goto("/");
		await page.getByRole("button", { name: /user menu/i }).click();
		await page.getByRole("link", { name: /account settings/i }).click();
		await expect(page).toHaveURL("/settings");
	});

	test("profile dropdown Tools link navigates to /tools", async ({ page }) => {
		await page.goto("/");
		await page.getByRole("button", { name: /user menu/i }).click();
		await page.getByRole("link", { name: /tracker tools/i }).click();
		await expect(page).toHaveURL("/tools");
	});

	test("profile dropdown Help link navigates to /help", async ({ page }) => {
		await page.goto("/");
		await page.getByRole("button", { name: /user menu/i }).click();
		await page.getByRole("banner").getByRole("link", { name: "Help", exact: true }).click();
		await expect(page).toHaveURL("/help");
	});

	test("news button is visible in header", async ({ page }) => {
		await page.goto("/");
		await expect(page.getByRole("button", { name: "News", exact: true })).toBeVisible();
	});
});

// 2.1 Sidebar
test.describe("Sidebar", () => {
	test("sidebar is open by default on desktop", async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto("/");
		const sidebar = page.getByRole("complementary", { name: "Main navigation" });
		await expect(sidebar).toHaveClass(/w-48/);
	});

	test("hamburger toggles sidebar closed on desktop", async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto("/");
		await page.getByRole("button", { name: /toggle sidebar/i }).click();
		const sidebar = page.getByRole("complementary", { name: "Main navigation" });
		await expect(sidebar).not.toHaveClass(/w-48/);
	});

	test("sidebar is closed by default on mobile", async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto("/");
		const sidebar = page.getByRole("complementary", { name: "Main navigation" });
		await expect(sidebar).not.toHaveClass(/w-48/);
	});

	test("hamburger opens sidebar on mobile", async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto("/");
		await page.getByRole("button", { name: /toggle sidebar/i }).click();
		const sidebar = page.getByRole("complementary", { name: "Main navigation" });
		await expect(sidebar).toHaveClass(/w-48/);
	});

	test("sidebar links navigate to correct pages", async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto("/");

		await page.getByRole("link", { name: "All Threads" }).click();
		await expect(page).toHaveURL("/threads/all");

		await page.getByRole("link", { name: "Characters" }).click();
		await expect(page).toHaveURL("/manage-characters");

		await page.getByRole("link", { name: "Settings" }).click();
		await expect(page).toHaveURL("/settings");
	});

	test("active page link is visually highlighted", async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto("/threads/all");
		const activeLink = page.getByRole("link", { name: "All Threads" });
		await expect(activeLink).toHaveClass(/bg-primary/);
	});
});
