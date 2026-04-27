import { test, expect } from "@playwright/test";
import { mockExternalApis } from "../helpers/tumblr-mock";

test.beforeEach(async ({ page }) => {
	await mockExternalApis(page);
});

// 2.2 Header
test.describe("Header", () => {
	test("logo is visible and links to dashboard", async ({ page }) => {
		await page.goto("/");
		const logo = page.getByRole("link", { name: "RPTHREADTRACKER", exact: true });
		await expect(logo).toBeVisible();
		await expect(logo).toHaveAttribute("href", "/dashboard");
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

	test("profile dropdown has correct links", async ({ page }) => {
		await page.goto("/");
		await page.getByRole("button", { name: /user menu/i }).click();
		const dropdown = page.getByRole("banner");
		const settingsLink = dropdown.getByRole("link", { name: /account settings/i });
		const toolsLink = dropdown.getByRole("link", { name: /tracker tools/i });
		const helpLink = dropdown.getByRole("link", { name: "Help", exact: true });
		await expect(settingsLink).toHaveAttribute("href", "/settings");
		await expect(toolsLink).toHaveAttribute("href", "/tools");
		await expect(helpLink).toHaveAttribute("href", "/help");
	});

	test("news button is visible in header", async ({ page }) => {
		await page.goto("/");
		await expect(page.getByRole("button", { name: "News", exact: true })).toBeVisible();
	});
});

// 2.3 Theme
test.describe("Theme", () => {
	test("footer toggle switches between dark and light mode", async ({ page }) => {
		await page.goto("/");
		const html = page.locator("html");
		await expect(html).toHaveClass(/dark/);
		await page.getByRole("button", { name: /light theme/i }).click();
		await expect(html).toHaveClass(/light/);
		await expect(html).not.toHaveClass(/dark/);
	});

	test("theme persists across page navigation", async ({ page }) => {
		await page.goto("/");
		await page.getByRole("button", { name: /light theme/i }).click();
		await page.getByRole("link", { name: "All Threads" }).click();
		await expect(page.locator("html")).toHaveClass(/light/);
	});

	test("theme persists after browser refresh", async ({ page }) => {
		await page.goto("/");
		await page.getByRole("button", { name: /light theme/i }).click();
		await page.reload();
		await expect(page.locator("html")).toHaveClass(/light/);
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

	test("sidebar links have correct hrefs", async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto("/");
		const nav = page.getByRole("complementary", { name: "Main navigation" });
		await expect(nav.getByRole("link", { name: "Dashboard" })).toHaveAttribute("href", "/dashboard");
		await expect(nav.getByRole("link", { name: "All Threads" })).toHaveAttribute("href", "/threads/all");
		await expect(nav.getByRole("link", { name: "Your Turn" })).toHaveAttribute("href", "/threads/your-turn");
		await expect(nav.getByRole("link", { name: "Their Turn" })).toHaveAttribute("href", "/threads/their-turn");
		await expect(nav.getByRole("link", { name: "Archived" })).toHaveAttribute("href", "/threads/archived");
		await expect(nav.getByRole("link", { name: "Queued" })).toHaveAttribute("href", "/threads/queued");
		await expect(nav.getByRole("link", { name: "Characters" })).toHaveAttribute("href", "/manage-characters");
		await expect(nav.getByRole("link", { name: "Tools" })).toHaveAttribute("href", "/tools");
		await expect(nav.getByRole("link", { name: "Settings" })).toHaveAttribute("href", "/settings");
		await expect(nav.getByRole("link", { name: "Help" })).toHaveAttribute("href", "/help");
	});

	test("active page link is visually highlighted", async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto("/threads/all");
		const activeLink = page.getByRole("link", { name: "All Threads" });
		await expect(activeLink).toHaveClass(/bg-primary/);
	});
});
