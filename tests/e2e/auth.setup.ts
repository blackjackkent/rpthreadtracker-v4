import { test as setup, expect } from "@playwright/test";
import { TEST_USERNAME, TEST_PASSWORD } from "../fixtures/seed";

const AUTH_FILE = "tests/.auth/user.json";

setup("authenticate as test user", async ({ page }) => {
	await page.goto("/login");
	await page.getByLabel("Email or Username").fill(TEST_USERNAME);
	await page.getByLabel("Password").fill(TEST_PASSWORD);
	await page.getByRole("button", { name: "Sign in" }).click();

	// Wait for redirect to dashboard
	await page.waitForURL("/", { timeout: 15000 });
	await expect(page).toHaveURL("/");

	await page.context().storageState({ path: AUTH_FILE });
});
