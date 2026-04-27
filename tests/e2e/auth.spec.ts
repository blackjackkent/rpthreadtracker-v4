import { test, expect } from "@playwright/test";
import { TEST_USERNAME, TEST_EMAIL, TEST_PASSWORD } from "../fixtures/seed";
import { mockExternalApis } from "../helpers/tumblr-mock";

test.beforeEach(async ({ page }) => {
	await mockExternalApis(page);
});

// 1.1 Login
test.describe("Login", () => {
	test.use({ storageState: { cookies: [], origins: [] } });

	test("login page renders without redirect loop", async ({ page }) => {
		await page.goto("/login");
		await expect(page).toHaveURL("/login");
		await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
	});

	test("empty form shows validation errors on both fields", async ({
		page,
	}) => {
		await page.goto("/login");
		await page.getByRole("button", { name: /sign in/i }).click();
		await expect(
			page.getByText(/email or username is required/i),
		).toBeVisible();
		await expect(page.getByText(/password is required/i)).toBeVisible();
	});

	test("wrong credentials shows error, no crash", async ({ page }) => {
		await page.goto("/login");
		await page.getByLabel(/email or username/i).fill("notauser");
		await page.getByLabel(/password/i).fill("wrongpassword");
		await page.getByRole("button", { name: /sign in/i }).click();
		await expect(page.getByText(/invalid/i)).toBeVisible();
		await expect(page).toHaveURL("/login");
	});

	test("valid credentials redirect to dashboard", async ({ page }) => {
		await page.goto("/login");
		await page.getByLabel(/email or username/i).fill(TEST_USERNAME);
		await page.getByLabel(/password/i).fill(TEST_PASSWORD);
		await page.getByRole("button", { name: /sign in/i }).click();
		await page.waitForURL("/", { timeout: 15000 });
		await expect(page).toHaveURL("/");
	});

	test("logged-out user navigating to / redirects to login", async ({
		page,
	}) => {
		await page.goto("/");
		await expect(page).toHaveURL(/\/login/);
	});

	test("logged-in user navigating to /login redirects to dashboard", async ({
		page,
	}) => {
		// Log in first
		await page.goto("/login");
		await page.getByLabel(/email or username/i).fill(TEST_USERNAME);
		await page.getByLabel(/password/i).fill(TEST_PASSWORD);
		await page.getByRole("button", { name: /sign in/i }).click();
		await page.waitForURL("/", { timeout: 15000 });

		// Now try to visit /login again
		await page.goto("/login");
		await expect(page).toHaveURL("/");
	});
});

// 1.2 Registration
test.describe("Registration", () => {
	test.use({ storageState: { cookies: [], origins: [] } });

	test("register page renders while logged out", async ({ page }) => {
		await page.goto("/register");
		await expect(page).toHaveURL("/register");
		await expect(
			page.getByRole("heading", { name: /create an account/i }),
		).toBeVisible();
	});

	test("empty form shows validation errors on all fields", async ({ page }) => {
		await page.goto("/register");
		await page.getByRole("button", { name: /create account/i }).click();
		await expect(page.getByText("Username is required")).toBeVisible();
		await expect(
			page.getByText("Please enter a valid email address"),
		).toBeVisible();
		await expect(
			page.getByText("Password must be at least 6 characters"),
		).toBeVisible();
		await expect(page.getByText("Please confirm your password")).toBeVisible();
	});

	test("mismatched passwords shows error", async ({ page }) => {
		await page.goto("/register");
		await page.getByLabel("Username").fill("newuser");
		await page.getByLabel("Email").fill("newuser@example.com");
		await page.getByLabel("Password", { exact: true }).fill("password123");
		await page.getByLabel("Confirm Password").fill("differentpassword");
		await page.getByRole("button", { name: /create account/i }).click();
		await expect(page.getByText("Passwords do not match")).toBeVisible();
	});

	test("password under 6 characters shows error", async ({ page }) => {
		await page.goto("/register");
		await page.getByLabel("Username").fill("newuser");
		await page.getByLabel("Email").fill("newuser@example.com");
		await page.getByLabel("Password", { exact: true }).fill("abc");
		await page.getByLabel("Confirm Password").fill("abc");
		await page.getByRole("button", { name: /create account/i }).click();
		await expect(
			page.getByText("Password must be at least 6 characters"),
		).toBeVisible();
	});

	test("email already in use shows error", async ({ page }) => {
		await page.goto("/register");
		await page.getByLabel("Username").fill("brandnewuser");
		await page.getByLabel("Email").fill(TEST_EMAIL);
		await page.getByLabel("Password", { exact: true }).fill("TestPassword123!");
		await page.getByLabel("Confirm Password").fill("TestPassword123!");
		await page.getByRole("button", { name: /create account/i }).click();
		await expect(
			page.getByText(
				"Unable to create account. Please check your details and try again.",
			),
		).toBeVisible();
	});

	test("username already in use shows error", async ({ page }) => {
		await page.goto("/register");
		await page.getByLabel("Username").fill(TEST_USERNAME);
		await page.getByLabel("Email").fill("brandnew@example.com");
		await page.getByLabel("Password", { exact: true }).fill("TestPassword123!");
		await page.getByLabel("Confirm Password").fill("TestPassword123!");
		await page.getByRole("button", { name: /create account/i }).click();
		await expect(
			page.getByText(
				"Unable to create account. Please check your details and try again.",
			),
		).toBeVisible();
	});

	test("sign in link navigates to /login", async ({ page }) => {
		await page.goto("/register");
		await page.getByRole("link", { name: /sign in/i }).click();
		await expect(page).toHaveURL("/login");
	});

	test("valid new credentials auto-sign-in and redirect to dashboard", async ({
		page,
	}) => {
		const uniqueSuffix = Date.now();
		await page.goto("/register");
		await page.getByLabel("Username").fill(`testregistered${uniqueSuffix}`);
		await page
			.getByLabel("Email")
			.fill(`testregistered${uniqueSuffix}@example.com`);
		await page.getByLabel("Password", { exact: true }).fill("TestPassword123!");
		await page.getByLabel("Confirm Password").fill("TestPassword123!");
		await page.getByRole("button", { name: /create account/i }).click();
		await page.waitForURL("/", { timeout: 15000 });
		await expect(page).toHaveURL("/");
	});
});

// 1.5 Logout
test.describe("Logout", () => {
	test("profile menu logout redirects to /login", async ({ page }) => {
		await page.goto("/");
		await page.getByRole("button", { name: /user menu/i }).click();
		await page.getByRole("button", { name: /logout/i }).click();
		await page.waitForURL("/login", { timeout: 10000 });
		await expect(page).toHaveURL("/login");
	});
});

// 1.3 Forgot Password (email-independent cases)
test.describe("Forgot Password", () => {
	test.use({ storageState: { cookies: [], origins: [] } });

	test("login page has forgot password link", async ({ page }) => {
		await page.goto("/login");
		await expect(
			page.getByRole("link", { name: /forgot your password/i }),
		).toBeVisible();
	});

	test("forgot password page renders while logged out", async ({ page }) => {
		await page.goto("/forgot-password");
		await expect(page).toHaveURL("/forgot-password");
		await expect(
			page.getByRole("heading", { name: /reset your password/i }),
		).toBeVisible();
	});

	test("unknown email shows success message (user enumeration safe)", async ({
		page,
	}) => {
		await page.goto("/forgot-password");
		await page.getByLabel(/email address/i).fill("nobody@example.com");
		await page.getByRole("button", { name: /send reset link/i }).click();
		await expect(page.getByText(/if an account exists/i)).toBeVisible();
	});

	test("known email shows same success message", async ({ page }) => {
		await page.goto("/forgot-password");
		await page.getByLabel(/email address/i).fill(TEST_EMAIL);
		await page.getByRole("button", { name: /send reset link/i }).click();
		await expect(page.getByText(/if an account exists/i)).toBeVisible();
	});

	test("reset success banner visible on login page", async ({ page }) => {
		await page.goto("/login?reset=success");
		await expect(page.getByText(/your password has been reset/i)).toBeVisible();
	});

	test("invalid reset token shows error", async ({ page }) => {
		await page.goto("/reset-password/not-a-real-token");
		await page
			.getByRole("textbox", { name: "New password", exact: true })
			.fill("NewPassword123!");
		await page.getByLabel(/confirm new password/i).fill("NewPassword123!");
		await page.getByRole("button", { name: /set new password/i }).click();
		await expect(page.getByText(/invalid or has expired/i)).toBeVisible();
	});
});
