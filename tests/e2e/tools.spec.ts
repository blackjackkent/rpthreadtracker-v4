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

// 7.3 Manage Public Views
// Each test creates its own preconditions — no ordering dependency.
test.describe("Manage Public Views", () => {
	/** Helper: navigate to the Manage Public Views tab */
	async function openPublicViewsTab(page: import("@playwright/test").Page) {
		await page.goto("/tools");
		await page.getByRole("button", { name: /manage public views/i }).click();
		await expect(page.getByRole("heading", { name: "Manage Public Views" })).toBeVisible();
	}

	/** Helper: create a view and wait for it to appear in the list */
	async function createView(page: import("@playwright/test").Page, name: string, slug: string) {
		await page.getByRole("button", { name: /new view/i }).click();
		await expect(page.getByRole("heading", { name: "Create Public View" })).toBeVisible();
		await page.getByLabel(/view name/i).fill(name);
		const slugInput = page.getByLabel(/url slug/i);
		await slugInput.fill(slug);
		await slugInput.blur();
		const submitBtn = page.getByRole("button", { name: /create view/i });
		await expect(submitBtn).toBeEnabled();
		await submitBtn.click();
		await expect(page.getByRole("heading", { name: "Create Public View" })).not.toBeVisible();
		await expect(page.getByText(name)).toBeVisible();
	}

	/** Helper: locate the card for a specific view by name */
	function viewCard(page: import("@playwright/test").Page, name: string) {
		return page.getByTestId("public-view-card").filter({ hasText: name });
	}

	test("create public view via modal", async ({ page }) => {
		await openPublicViewsTab(page);
		await page.getByRole("button", { name: /new view/i }).click();
		await expect(page.getByRole("heading", { name: "Create Public View" })).toBeVisible();

		await page.getByLabel(/view name/i).fill("Create Test View");
		const slugInput = page.getByLabel(/url slug/i);
		await slugInput.fill("create-test");
		await slugInput.blur();

		const submitBtn = page.getByRole("button", { name: /create view/i });
		await expect(submitBtn).toBeEnabled();
		await submitBtn.click();

		await expect(page.getByRole("heading", { name: "Create Public View" })).not.toBeVisible();
		await expect(page.getByText("Create Test View")).toBeVisible();
		await expect(page.getByText("/public/testuser/create-test")).toBeVisible();
	});

	test("edit public view via modal", async ({ page }) => {
		await openPublicViewsTab(page);
		await createView(page, "Edit Test View", "edit-test");

		await viewCard(page, "Edit Test View").getByTitle("Edit").click();
		await expect(page.getByRole("heading", { name: "Edit Public View" })).toBeVisible();

		const nameInput = page.getByLabel(/view name/i);
		await nameInput.clear();
		await nameInput.fill("Edited View");
		await page.getByRole("button", { name: /save changes/i }).click();

		await expect(page.getByText("Edited View")).toBeVisible();
	});

	test("copy URL button works", async ({ page }) => {
		await openPublicViewsTab(page);
		await createView(page, "Copy URL View", "copy-url-test");

		await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
		await viewCard(page, "Copy URL View").getByTitle("Copy URL").click();

		const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
		expect(clipboardText).toContain("/public/testuser/copy-url-test");
	});

	test("delete public view with confirmation", async ({ page }) => {
		await openPublicViewsTab(page);
		await createView(page, "Delete Test View", "delete-test");

		const card = viewCard(page, "Delete Test View");
		await card.getByTitle("Delete").click();
		await expect(card.getByText(/delete.*delete test view/i)).toBeVisible();
		await card.getByRole("button", { name: "Delete" }).click();

		await expect(page.getByTestId("public-view-card").filter({ hasText: "Delete Test View" })).not.toBeVisible();
	});

	test("delete can be cancelled", async ({ page }) => {
		await openPublicViewsTab(page);
		await createView(page, "Cancel Delete View", "cancel-del-test");

		const card = viewCard(page, "Cancel Delete View");
		await card.getByTitle("Delete").click();
		await expect(card.getByText(/delete.*cancel delete view/i)).toBeVisible();
		await card.getByRole("button", { name: "Cancel" }).click();

		await expect(page.getByText("Cancel Delete View")).toBeVisible();
	});

	test("slug availability check on blur", async ({ page }) => {
		await openPublicViewsTab(page);
		// The seeded view uses "seeded-view" slug — test collision against it
		await page.getByRole("button", { name: /new view/i }).click();
		await page.getByLabel(/view name/i).fill("Duplicate Slug");
		const slugInput = page.getByLabel(/url slug/i);
		await slugInput.fill("seeded-view");
		await slugInput.blur();
		await expect(page.getByText(/already taken/i)).toBeVisible();
	});
});

// 7.4 Browser Extensions
test.describe("Browser Extensions", () => {
	test("tab renders with instructions and download links", async ({ page }) => {
		await page.goto("/tools");
		await page.getByRole("button", { name: /browser extensions/i }).click();
		await expect(page.getByRole("heading", { name: "Browser Extensions" })).toBeVisible();
		await expect(page.getByText(/how it works/i)).toBeVisible();
		await expect(page.getByRole("heading", { name: "Chrome Extension" })).toBeVisible();
		await expect(page.getByRole("heading", { name: "Firefox Extension" })).toBeVisible();
		await expect(page.getByRole("link", { name: /chrome web store/i })).toBeVisible();
		await expect(page.getByRole("link", { name: /firefox add-ons/i })).toBeVisible();
	});
});
