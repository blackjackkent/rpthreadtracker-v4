import { test, expect } from "@playwright/test";
import { mockExternalApis } from "../helpers/tumblr-mock";

test.beforeEach(async ({ page }) => {
	await mockExternalApis(page);
});

test.describe.configure({ mode: "parallel" });

// 7.1 Export to Excel
test.describe("Export to Excel", () => {
	test("export button triggers xlsx download", async ({ page }) => {
		await page.goto("/tools");
		await expect(page.getByRole("heading", { name: "Export Threads" })).toBeVisible();
		const downloadPromise = page.waitForEvent("download");
		await page.getByRole("button", { name: /export to excel/i }).click();
		const download = await downloadPromise;
		expect(download.suggestedFilename()).toBe("threads-export.xlsx");
	});

	test("include archived toggle is present and toggleable", async ({ page }) => {
		await page.goto("/tools");
		const archivedCheckbox = page.getByLabel(/include archived/i);
		await expect(archivedCheckbox).toBeVisible();
		await expect(archivedCheckbox).not.toBeChecked();
		await archivedCheckbox.check();
		await expect(archivedCheckbox).toBeChecked();
	});

	test("include hiatused toggle is present and toggleable", async ({ page }) => {
		await page.goto("/tools");
		const hiatusCheckbox = page.getByLabel(/include characters on hiatus/i);
		await expect(hiatusCheckbox).toBeVisible();
		await expect(hiatusCheckbox).not.toBeChecked();
		await hiatusCheckbox.check();
		await expect(hiatusCheckbox).toBeChecked();
	});
});

// 7.2 Manage Tags
test.describe("Manage Tags", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/tools");
		await page.getByRole("button", { name: /manage tags/i }).click();
		await expect(page.getByRole("heading", { name: "Manage Tags" })).toBeVisible();
	});

	test("tag list loads with counts", async ({ page }) => {
		// Seed data: adventure (2 threads), angst (2 threads), fluff (1 thread)
		await expect(page.getByText("#adventure")).toBeVisible();
		await expect(page.getByText("#angst")).toBeVisible();
		await expect(page.getByText("#fluff")).toBeVisible();
		await expect(page.getByText("2 threads").first()).toBeVisible();
		await expect(page.getByText("1 thread")).toBeVisible();
		await expect(page.getByText("3 tags total")).toBeVisible();
	});

	test("search filters the tag list", async ({ page }) => {
		await page.getByPlaceholder(/search tags/i).fill("adv");
		await expect(page.getByText("#adventure")).toBeVisible();
		await expect(page.getByText("#angst")).not.toBeVisible();
		await expect(page.getByText("#fluff")).not.toBeVisible();
	});

	test("rename tag updates the list", async ({ page }) => {
		// Rename "fluff" (1 thread) — won't affect other tests that target adventure/angst
		const fluffRow = page.locator("div").filter({ hasText: /^#fluff1 thread$/ });
		await fluffRow.getByTitle("Rename tag").click();
		const renameInput = page.locator("input[type='text']").last();
		await expect(renameInput).toHaveValue("fluff");
		await renameInput.clear();
		await renameInput.fill("romance");
		await page.getByTitle("Save").click();
		await expect(page.getByText("#romance")).toBeVisible();
		await expect(page.getByText("#fluff")).not.toBeVisible();
	});

	test("rename can be cancelled with Escape", async ({ page }) => {
		// Target "adventure" — independent of fluff mutations
		const adventureRow = page.locator("div").filter({ hasText: /^#adventure2 threads$/ });
		await adventureRow.getByTitle("Rename tag").click();
		const renameInput = page.locator("input[type='text']").last();
		await renameInput.clear();
		await renameInput.fill("something-else");
		await renameInput.press("Escape");
		await expect(page.getByText("#adventure")).toBeVisible();
		await expect(page.getByText("#something-else")).not.toBeVisible();
	});

	test("delete tag removes it from the list", async ({ page }) => {
		// Delete "angst" (2 threads) — independent of fluff/adventure mutations
		const angstRow = page.locator("div").filter({ hasText: /^#angst2 threads$/ });
		await angstRow.getByTitle("Delete tag").click();
		await expect(page.getByText(/remove from/i)).toBeVisible();
		await page.getByTitle("Confirm delete").click();
		await expect(page.getByText("#angst")).not.toBeVisible();
	});

	test("delete can be cancelled", async ({ page }) => {
		// Target "adventure" — cancel doesn't mutate, so safe to share
		const adventureRow = page.locator("div").filter({ hasText: /^#adventure2 threads$/ });
		await adventureRow.getByTitle("Delete tag").click();
		await expect(page.getByText(/remove from/i)).toBeVisible();
		await page.getByTitle("Cancel").click();
		await expect(page.getByText("#adventure")).toBeVisible();
	});
});
