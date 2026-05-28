import { test, expect, Page } from "@playwright/test";
import { mockExternalApis } from "../helpers/tumblr-mock";

async function waitForThreads(page: Page) {
	await expect(page.getByRole("table")).toBeVisible({ timeout: 30000 });
}

test.beforeEach(async ({ page }) => {
	await mockExternalApis(page);
});

test.describe.configure({ mode: "parallel" });

// 6.1 All Threads (/threads/all)
test.describe("All Threads", () => {
	test("page loads with non-archived threads visible", async ({ page }) => {
		await page.goto("/threads/all");
		await waitForThreads(page);
		const table = page.getByRole("table");
		await expect(table.getByText("Your Turn Thread")).toBeVisible();
		await expect(table.getByText("Their Turn Thread")).toBeVisible();
		await expect(table.getByText("Queued Thread")).toBeVisible();
		await expect(table.getByText("No Post Thread")).toBeVisible();
		await expect(table.getByText("Queued But Posted Thread")).toBeVisible();
		// Archived and hiatus threads should not appear
		await expect(table.getByText("Archived Thread")).not.toBeVisible();
		await expect(table.getByText("Hiatus Thread")).not.toBeVisible();
	});

	test("status badges display correctly", async ({ page }) => {
		// Status column is only visible at 2xl (1536px+)
		await page.setViewportSize({ width: 1536, height: 900 });
		await page.goto("/threads/all");
		await waitForThreads(page);
		const yourTurnRow = page.getByRole("row").filter({ hasText: "Your Turn Thread" });
		await expect(yourTurnRow.getByText("Your Turn", { exact: true })).toBeVisible();
		const theirTurnRow = page.getByRole("row").filter({ hasText: "Their Turn Thread" });
		await expect(theirTurnRow.getByText("Their Turn", { exact: true })).toBeVisible();
		const queuedRow = page.getByRole("row").filter({ hasText: "Queued Thread" });
		await expect(queuedRow.getByText("Queued", { exact: true })).toBeVisible();
	});

	test("column filter inputs filter the table", async ({ page }) => {
		await page.goto("/threads/all");
		await waitForThreads(page);
		const table = page.getByRole("table");
		// Filter by thread title
		const titleFilter = table.getByPlaceholder("Search...").first();
		await titleFilter.fill("Your Turn");
		await expect(table.getByText("Your Turn Thread")).toBeVisible();
		await expect(table.getByText("Their Turn Thread")).not.toBeVisible();
		await titleFilter.clear();
		await expect(table.getByText("Their Turn Thread")).toBeVisible();
	});

	test("sorting columns works with sort indicator", async ({ page }) => {
		await page.goto("/threads/all");
		await waitForThreads(page);
		// Default sort is by Last Post desc — click Thread Title to sort by title
		await page.getByRole("columnheader", { name: "Thread Title" }).click();
		// Sort indicator bar should appear
		const header = page.getByRole("columnheader", { name: "Thread Title" });
		await expect(header.locator(".bg-primary")).toBeVisible();
	});

	test("pagination controls work", async ({ page }) => {
		await page.goto("/threads/all");
		await waitForThreads(page);
		// With only 4 threads and default page size 10, pagination should show page 1 of 1
		await expect(page.getByText("Page 1 of 1")).toBeVisible();
		// Page size selector should be present
		await expect(page.getByRole("combobox").filter({ hasText: "Show 10" })).toBeVisible();
	});

	test("expandable row shows description and tags", async ({ page }) => {
		await page.goto("/threads/all");
		await waitForThreads(page);
		const table = page.getByRole("table");
		// Click the expander on the first row
		const firstRow = table.getByRole("row").filter({ hasText: "Your Turn Thread" });
		await firstRow.getByRole("button").first().click();
		// Expanded row should show the seeded tags
		await expect(table.getByText("adventure")).toBeVisible();
		await expect(table.getByText("angst")).toBeVisible();
	});

	test("row checkboxes and select-all work", async ({ page }) => {
		await page.goto("/threads/all");
		await waitForThreads(page);
		// Select a single row
		const yourTurnRow = page.getByRole("row").filter({ hasText: "Your Turn Thread" });
		await yourTurnRow.getByRole("checkbox").click();
		await expect(page.getByText("1 selected")).toBeVisible();

		// Select all via header checkbox
		const headerCheckbox = page.getByRole("row").first().getByRole("checkbox");
		await headerCheckbox.click();
		await expect(page.getByText("5 selected")).toBeVisible();
	});

	test("edit action opens pre-filled modal", async ({ page }) => {
		await page.goto("/threads/all");
		await waitForThreads(page);
		const row = page.getByRole("row").filter({ hasText: "Your Turn Thread" });
		await row.getByTitle("Edit thread").click();
		await expect(page.getByRole("dialog")).toBeVisible();
		await expect(page.getByLabel("Thread Title")).toHaveValue("Your Turn Thread");
		// Close without saving
		await page.getByRole("button", { name: /cancel/i }).click();
	});

	test("archive action removes thread from table", async ({ page }) => {
		await page.goto("/threads/all");
		await waitForThreads(page);
		const table = page.getByRole("table");
		// Create a thread to archive so we don't mutate fixture data
		await page.getByRole("button", { name: /track new thread/i }).click();
		await page.getByLabel("Character").selectOption({ label: "Active Character" });
		await page.getByLabel("Post ID").fill("999888777");
		await page.getByRole("button", { name: "Track Thread", exact: true }).click();
		await expect(page.getByRole("dialog")).toBeHidden();
		await expect(table.getByText("999888777")).toBeVisible();

		// Archive it
		const row = table.getByRole("row").filter({ hasText: "999888777" });
		await row.getByTitle("Archive thread").click();
		await expect(table.getByText("999888777")).not.toBeVisible();
	});

	test("untrack action removes thread from table", async ({ page }) => {
		await page.goto("/threads/all");
		await waitForThreads(page);
		const table = page.getByRole("table");
		// Create a thread to untrack
		await page.getByRole("button", { name: /track new thread/i }).click();
		await page.getByLabel("Character").selectOption({ label: "Active Character" });
		await page.getByLabel("Post ID").fill("999888666");
		await page.getByRole("button", { name: "Track Thread", exact: true }).click();
		await expect(page.getByRole("dialog")).toBeHidden();
		await expect(table.getByText("999888666")).toBeVisible();

		// Accept the confirm dialog before clicking untrack
		page.on("dialog", (dialog) => dialog.accept());
		const row = table.getByRole("row").filter({ hasText: "999888666" });
		await row.getByTitle("Untrack thread").click();
		await expect(table.getByText("999888666")).not.toBeVisible();
	});

	test("Mark Queued button is hidden on All Threads page", async ({ page }) => {
		await page.goto("/threads/all");
		await waitForThreads(page);
		const row = page.getByRole("row").filter({ hasText: "Your Turn Thread" });
		await expect(row.getByTitle("Edit thread")).toBeVisible();
		await expect(row.getByTitle("Archive thread")).toBeVisible();
		await expect(row.getByTitle(/queue/i)).not.toBeVisible();
	});

	test("bulk archive removes threads from table", async ({ page }) => {
		await page.goto("/threads/all");
		await waitForThreads(page);
		const table = page.getByRole("table");
		// Create two threads to bulk archive
		for (const postId of ["bulk-test-1", "bulk-test-2"]) {
			await page.getByRole("button", { name: /track new thread/i }).click();
			await page.getByLabel("Character").selectOption({ label: "Active Character" });
			await page.getByLabel("Post ID").fill(postId);
			await page.getByRole("button", { name: "Track Thread", exact: true }).click();
			await expect(page.getByRole("dialog")).toBeHidden();
			await expect(table.getByText(postId)).toBeVisible();
		}

		// Select both
		const row1 = table.getByRole("row").filter({ hasText: "bulk-test-1" });
		const row2 = table.getByRole("row").filter({ hasText: "bulk-test-2" });
		await row1.getByRole("checkbox").click();
		await row2.getByRole("checkbox").click();
		await expect(page.getByText("2 selected")).toBeVisible();

		// Bulk archive
		await page.getByRole("button", { name: /^archive$/i }).click();
		await expect(table.getByText("bulk-test-1")).not.toBeVisible();
		await expect(table.getByText("bulk-test-2")).not.toBeVisible();
	});

	test("bulk untrack removes threads from table", async ({ page }) => {
		await page.goto("/threads/all");
		await waitForThreads(page);
		const table = page.getByRole("table");
		// Create two threads to bulk untrack
		for (const postId of ["bulk-del-1", "bulk-del-2"]) {
			await page.getByRole("button", { name: /track new thread/i }).click();
			await page.getByLabel("Character").selectOption({ label: "Active Character" });
			await page.getByLabel("Post ID").fill(postId);
			await page.getByRole("button", { name: "Track Thread", exact: true }).click();
			await expect(page.getByRole("dialog")).toBeHidden();
			await expect(table.getByText(postId)).toBeVisible();
		}

		// Select both
		const row1 = table.getByRole("row").filter({ hasText: "bulk-del-1" });
		const row2 = table.getByRole("row").filter({ hasText: "bulk-del-2" });
		await row1.getByRole("checkbox").click();
		await row2.getByRole("checkbox").click();

		// Accept the confirm dialog
		page.on("dialog", (dialog) => dialog.accept());
		await page.getByRole("button", { name: "Untrack", exact: true }).click();
		await expect(table.getByText("bulk-del-1")).not.toBeVisible();
		await expect(table.getByText("bulk-del-2")).not.toBeVisible();
	});
});

// 6.2 Your Turn (/threads/your-turn)
test.describe("Your Turn", () => {
	test("only shows Your Turn threads", async ({ page }) => {
		await page.goto("/threads/your-turn");
		await waitForThreads(page);
		const table = page.getByRole("table");
		await expect(table.getByText("Your Turn Thread")).toBeVisible();
		await expect(table.getByText("No Post Thread")).toBeVisible();
		await expect(table.getByText("Queued But Posted Thread")).toBeVisible();
		await expect(table.getByText("Their Turn Thread")).not.toBeVisible();
		await expect(table.getByText("Queued Thread")).not.toBeVisible();
	});

	test("thread with post newer than queue date appears in Your Turn, not Queued", async ({ page }) => {
		await page.goto("/threads/your-turn");
		await waitForThreads(page);
		const table = page.getByRole("table");
		await expect(table.getByText("Queued But Posted Thread")).toBeVisible();

		// Verify it's NOT in the Queued view
		await page.goto("/threads/queued");
		await waitForThreads(page);
		const queuedTable = page.getByRole("table");
		await expect(queuedTable.getByText("Queued But Posted Thread")).not.toBeVisible();
	});

	test("Mark Queued button visible and disabled for threads without a Tumblr post", async ({ page }) => {
		await page.goto("/threads/your-turn");
		await waitForThreads(page);
		// Your Turn Thread has a valid post — queue button should be enabled
		const yourTurnRow = page.getByRole("row").filter({ hasText: "Your Turn Thread" });
		const enabledQueueBtn = yourTurnRow.getByTitle(/queue thread/i);
		await expect(enabledQueueBtn).toBeVisible();
		await expect(enabledQueueBtn).toBeEnabled();

		// No Post Thread has no post — queue button should be disabled
		const noPostRow = page.getByRole("row").filter({ hasText: "No Post Thread" });
		const disabledQueueBtn = noPostRow.getByTitle(/cannot queue/i);
		await expect(disabledQueueBtn).toBeVisible();
		await expect(disabledQueueBtn).toBeDisabled();
	});
});

// 6.3 Their Turn (/threads/their-turn)
test.describe("Their Turn", () => {
	test("only shows Their Turn threads", async ({ page }) => {
		await page.goto("/threads/their-turn");
		await waitForThreads(page);
		const table = page.getByRole("table");
		await expect(table.getByText("Their Turn Thread")).toBeVisible();
		await expect(table.getByText("Your Turn Thread")).not.toBeVisible();
		await expect(table.getByText("Queued Thread")).not.toBeVisible();
	});
});

// 6.4 Queued (/threads/queued)
test.describe("Queued", () => {
	test("only shows queued threads", async ({ page }) => {
		await page.goto("/threads/queued");
		await waitForThreads(page);
		const table = page.getByRole("table");
		await expect(table.getByText("Queued Thread")).toBeVisible();
		await expect(table.getByText("Your Turn Thread")).not.toBeVisible();
		await expect(table.getByText("Their Turn Thread")).not.toBeVisible();
	});
});

// 6.5 Archived (/threads/archived)
test.describe("Archived", () => {
	test("only shows archived threads", async ({ page }) => {
		await page.goto("/threads/archived");
		const table = page.getByRole("table");
		await expect(table.getByText("Archived Thread")).toBeVisible();
		await expect(table.getByText("Your Turn Thread")).not.toBeVisible();
	});

	test("unarchive action removes thread from archived view", async ({ page }) => {
		// First archive a thread so we have something to unarchive
		await page.goto("/threads/all");
		await waitForThreads(page);
		await page.getByRole("button", { name: /track new thread/i }).click();
		await page.getByLabel("Character").selectOption({ label: "Active Character" });
		await page.getByLabel("Post ID").fill("unarchive-test");
		await page.getByRole("button", { name: "Track Thread", exact: true }).click();
		await expect(page.getByRole("dialog")).toBeHidden();
		const allTable = page.getByRole("table");
		const row = allTable.getByRole("row").filter({ hasText: "unarchive-test" });
		await row.getByTitle("Archive thread").click();
		await expect(allTable.getByText("unarchive-test")).not.toBeVisible();

		// Now go to archived and unarchive it
		await page.goto("/threads/archived");
		const archivedTable = page.getByRole("table");
		await expect(archivedTable.getByText("unarchive-test")).toBeVisible();
		const archivedRow = archivedTable.getByRole("row").filter({ hasText: "unarchive-test" });
		await archivedRow.getByTitle("Unarchive thread").click();
		await expect(archivedTable.getByText("unarchive-test")).not.toBeVisible();
	});
});

// 6.6 Track New Thread (modal)
test.describe("Track New Thread Modal", () => {
	test("opens from header Add menu", async ({ page }) => {
		await page.goto("/threads/all");
		await waitForThreads(page);
		await page.getByRole("button", { name: "Add menu" }).click();
		await page.getByRole("banner").getByRole("button", { name: "Track New Thread" }).click();
		await expect(page.getByRole("dialog")).toBeVisible();
	});

	test("opens from Track New Thread button on thread pages", async ({ page }) => {
		await page.goto("/threads/all");
		await waitForThreads(page);
		await page.getByRole("button", { name: /track new thread/i }).click();
		await expect(page.getByRole("dialog")).toBeVisible();
	});

	test("character dropdown is populated and required", async ({ page }) => {
		await page.goto("/threads/all");
		await waitForThreads(page);
		await page.getByRole("button", { name: /track new thread/i }).click();
		// Dropdown should have the Active Character option
		const charSelect = page.getByLabel("Character");
		await expect(charSelect.getByRole("option", { name: "Active Character" })).toBeAttached();
		// Submit without selecting a character — validation error
		await page.getByRole("button", { name: "Track Thread", exact: true }).click();
		await expect(page.getByText("Please select a character")).toBeVisible();
	});

	test("tags can be added via Enter and removed via x button", async ({ page }) => {
		await page.goto("/threads/all");
		await waitForThreads(page);
		await page.getByRole("button", { name: /track new thread/i }).click();
		const tagInput = page.getByPlaceholder(/add tags/i);
		// Add a tag by typing and pressing Enter
		await tagInput.fill("test-tag");
		await tagInput.press("Enter");
		const firstTag = page.getByRole("listitem").filter({ hasText: "test-tag" });
		await expect(firstTag).toBeVisible();
		// Add another
		await tagInput.fill("second-tag");
		await tagInput.press("Enter");
		const secondTag = page.getByRole("listitem").filter({ hasText: "second-tag" });
		await expect(secondTag).toBeVisible();
		// Remove the first tag via x button
		await firstTag.getByRole("button").click();
		await expect(firstTag).not.toBeVisible();
		await expect(secondTag).toBeVisible();
	});

	test("save creates thread and appears in table", async ({ page }) => {
		await page.goto("/threads/all");
		await waitForThreads(page);
		const table = page.getByRole("table");
		await page.getByRole("button", { name: /track new thread/i }).click();
		await page.getByLabel("Character").selectOption({ label: "Active Character" });
		await page.getByLabel("Thread Title").fill("Modal Test Thread");
		await page.getByRole("button", { name: "Track Thread", exact: true }).click();
		await expect(page.getByRole("dialog")).toBeHidden();
		await expect(table.getByText("Modal Test Thread")).toBeVisible();
	});
});
