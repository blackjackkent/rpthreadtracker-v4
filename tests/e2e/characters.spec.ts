import { test, expect } from "@playwright/test";
import { mockExternalApis } from "../helpers/tumblr-mock";

test.beforeEach(async ({ page }) => {
	await mockExternalApis(page);
});

// 5. Character Management
test.describe("Character Management", () => {
	test("page loads with character list", async ({ page }) => {
		await page.goto("/manage-characters");
		await expect(page.getByText("Active Character")).toBeVisible();
		await expect(page.getByText("Hiatus Character")).toBeVisible();
	});

	test("hiatus character shows On Hiatus status and dash for thread count", async ({
		page,
	}) => {
		await page.goto("/manage-characters");
		const hiatusRow = page.getByRole("row").filter({ hasText: "Hiatus Character" });
		await expect(hiatusRow.getByText("On Hiatus")).toBeVisible();
		await expect(hiatusRow.getByRole("cell", { name: "-", exact: true })).toBeVisible();
	});

	test("empty URL identifier shows validation error", async ({ page }) => {
		await page.goto("/manage-characters");
		await page.getByRole("button", { name: /add character/i }).click();
		await page.getByRole("button", { name: /submit character/i }).click();
		await expect(page.getByText("URL Identifier is required")).toBeVisible();
	});

	test("create new character appears in table", async ({ page }) => {
		await page.goto("/manage-characters");
		await page.getByRole("button", { name: /add character/i }).click();
		await page.getByLabel("Character Name").fill("E2E Test Character");
		await page.getByLabel(/character url identifier/i).fill("e2e-test-char");
		await page.getByRole("button", { name: /submit character/i }).click();
		await expect(page.getByRole("dialog")).toBeHidden();
		await expect(page.getByText("E2E Test Character")).toBeVisible();
	});

	test("edit character updates in table", async ({ page }) => {
		await page.goto("/manage-characters");
		// Create a character to edit
		await page.getByRole("button", { name: /add character/i }).click();
		await page.getByLabel("Character Name").fill("Before Edit");
		await page.getByLabel(/character url identifier/i).fill("edit-test-char");
		await page.getByRole("button", { name: /submit character/i }).click();
		await expect(page.getByText("Before Edit")).toBeVisible();

		// Edit it
		const row = page.getByRole("row").filter({ hasText: "Before Edit" });
		await row.getByTitle("Edit").click();
		await page.getByLabel("Character Name").fill("After Edit");
		await page.getByRole("button", { name: /submit character/i }).click();
		await expect(page.getByText("After Edit")).toBeVisible();
		await expect(page.getByText("Before Edit")).not.toBeVisible();
	});

	test("hiatus toggle changes character status", async ({ page }) => {
		await page.goto("/manage-characters");
		// Create a character to toggle
		await page.getByRole("button", { name: /add character/i }).click();
		await page.getByLabel("Character Name").fill("Hiatus Toggle Test");
		await page.getByLabel(/character url identifier/i).fill("hiatus-toggle-test");
		await page.getByRole("button", { name: /submit character/i }).click();

		const row = page.getByRole("row").filter({ hasText: "Hiatus Toggle Test" });
		await expect(row.getByText("Active")).toBeVisible();

		// Set on hiatus
		await row.getByTitle("Set On Hiatus").click();
		await expect(row.getByText("On Hiatus")).toBeVisible();

		// Set off hiatus
		await row.getByTitle("Set Off Hiatus").click();
		await expect(row.getByText("Active")).toBeVisible();
	});

	test("delete character removes from table", async ({ page }) => {
		await page.goto("/manage-characters");
		// Create a character to delete
		await page.getByRole("button", { name: /add character/i }).click();
		await page.getByLabel("Character Name").fill("Delete Me");
		await page.getByLabel(/character url identifier/i).fill("delete-me-char");
		await page.getByRole("button", { name: /submit character/i }).click();
		await expect(page.getByText("Delete Me")).toBeVisible();

		// Accept the confirm dialog before clicking delete
		page.on("dialog", (dialog) => dialog.accept());
		const row = page.getByRole("row").filter({ hasText: "Delete Me" });
		await row.getByTitle("Untrack").click();
		await expect(page.getByText("Delete Me")).not.toBeVisible();
	});

	test("cancel delete does nothing", async ({ page }) => {
		await page.goto("/manage-characters");
		// Dismiss the confirm dialog
		page.on("dialog", (dialog) => dialog.dismiss());
		const row = page.getByRole("row").filter({ hasText: "Active Character" });
		await row.getByTitle("Untrack").click();
		await expect(page.getByText("Active Character")).toBeVisible();
	});
});
