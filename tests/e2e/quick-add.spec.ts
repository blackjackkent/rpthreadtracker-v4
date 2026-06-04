import { test, expect } from "@playwright/test";
import { mockExternalApis } from "../helpers/tumblr-mock";
import { CHAR_IDS } from "../fixtures/seed";

test.beforeEach(async ({ page }) => {
	await mockExternalApis(page);
});

test.describe("Quick Add", () => {
	test("renders minimal shell without sidebar or header nav", async ({ page }) => {
		await page.goto(`/quick-add?blogShortname=${CHAR_IDS.active}&postId=12345`);

		await expect(page.getByText("RPThreadTracker")).toBeVisible();
		await expect(page.getByText("Quick Add")).toBeVisible();

		// No sidebar or main header navigation
		await expect(page.getByRole("navigation")).not.toBeVisible();
	});

	test("pre-fills character from blogShortname param", async ({ page }) => {
		await page.goto(`/quick-add?blogShortname=${CHAR_IDS.active}&postId=99999`);

		const characterSelect = page.getByLabel(/character/i);
		await expect(characterSelect).toBeVisible();
		await expect(characterSelect).toHaveValue(/\d+/); // has a selected character ID
		// The selected option text should contain the active character
		const selectedText = await characterSelect.locator("option:checked").textContent();
		expect(selectedText?.toLowerCase()).toContain("active");
	});

	test("pre-fills post ID from postId param", async ({ page }) => {
		await page.goto(`/quick-add?blogShortname=${CHAR_IDS.active}&postId=12345`);

		const postIdInput = page.getByLabel(/post id/i);
		await expect(postIdInput).toHaveValue("12345");
	});

	test("submit creates thread and shows success state", async ({ page }) => {
		await page.goto(`/quick-add?blogShortname=${CHAR_IDS.active}&postId=777777`);

		await page.getByRole("button", { name: /track thread/i }).click();

		await expect(page.getByText("Thread tracked!")).toBeVisible();
		await expect(page.getByText(/close this window/i)).toBeVisible();
		await expect(page.getByRole("link", { name: /open rpthreadtracker/i })).toHaveAttribute("target", "_blank");
	});

	test("works with no matching character for blogShortname", async ({ page }) => {
		await page.goto("/quick-add?blogShortname=nonexistent&postId=12345");

		// Character dropdown should default to placeholder / no selection
		const characterSelect = page.getByLabel(/character/i);
		await expect(characterSelect).toBeVisible();

		// Post ID should still be pre-filled
		await expect(page.getByLabel(/post id/i)).toHaveValue("12345");
	});
});
