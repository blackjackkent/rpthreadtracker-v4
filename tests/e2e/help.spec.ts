import { test, expect } from "@playwright/test";
import { mockExternalApis } from "../helpers/tumblr-mock";

test.beforeEach(async ({ page }) => {
	await mockExternalApis(page);
});

test.describe("Help Page", () => {
	test("page loads with About tab active by default", async ({ page }) => {
		await page.goto("/help");
		await expect(page.getByRole("heading", { name: "About RPThreadTracker" })).toBeVisible();
	});

	test("all 4 tabs render and are clickable", async ({ page }) => {
		await page.goto("/help");

		await page.getByRole("button", { name: /support guides/i }).click();
		await expect(page.getByText("Intro Tutorial")).toBeVisible();

		await page.getByRole("button", { name: /faq/i }).click();
		await expect(page.getByText(/not found.*error/i)).toBeVisible();

		await page.getByRole("button", { name: /contact/i }).click();
		await expect(page.getByText(/bug to report/i)).toBeVisible();

		await page.getByRole("button", { name: /about/i }).click();
		await expect(page.getByRole("heading", { name: "About RPThreadTracker" })).toBeVisible();
	});

	test("FAQ accordion items expand and collapse", async ({ page }) => {
		await page.goto("/help");
		await page.getByRole("button", { name: /faq/i }).click();

		const firstQuestion = page.getByRole("button", { name: /not found.*error/i });
		await expect(firstQuestion).toBeVisible();

		// Initially collapsed — answer text not visible
		const answerText = page.getByText(/few reasons a thread might show/i);
		await expect(answerText).not.toBeVisible();

		// Click to expand
		await firstQuestion.click();
		await expect(answerText).toBeVisible();

		// Click again to collapse
		await firstQuestion.click();
		await expect(answerText).not.toBeVisible();
	});

	test("external links have correct targets", async ({ page }) => {
		await page.goto("/help");

		// About tab — Patreon link
		const patreonLink = page.getByRole("link", { name: /patreon/i });
		await expect(patreonLink).toHaveAttribute("target", "_blank");

		// Contact tab — GitHub Issues link
		await page.getByRole("button", { name: /contact/i }).click();
		const githubLink = page.getByRole("link", { name: /open a github issue/i });
		await expect(githubLink).toHaveAttribute("target", "_blank");
		await expect(githubLink).toHaveAttribute("href", /github\.com/);
	});
});
