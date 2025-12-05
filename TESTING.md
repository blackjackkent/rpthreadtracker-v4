# Testing Guide - RPThreadTracker v4

This document explains how to write and run end-to-end (E2E) tests for RPThreadTracker v4 using Playwright.

## Table of Contents

- [Overview](#overview)
- [Setup](#setup)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [API Mocking](#api-mocking)
- [Test Helpers](#test-helpers)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

We use **Playwright** for end-to-end testing because it:

- Supports multiple browsers (Chromium, Firefox, WebKit)
- Handles authentication and session management well
- Has built-in network mocking for API calls
- Provides reliable, fast test execution
- Integrates well with Next.js

## Setup

### 1. Install Dependencies

```bash
npm install
```

Playwright and browsers are already installed as dev dependencies.

### 2. Configure Test User

Create a test user in your database for running E2E tests.

**Option A: Using Environment Variables (Recommended for CI/CD)**

Create a `.env.test.local` file:

```env
TEST_USERNAME=testuser
TEST_PASSWORD=testpassword123
```

**Option B: Update Test Files Directly (Local Development)**

Edit `tests/e2e/auth/auth.setup.ts` and replace the credentials.

### 3. Verify Setup

Run the test setup to ensure authentication works:

```bash
npx playwright test tests/e2e/auth/auth.setup.ts
```

## Running Tests

### Run All Tests

```bash
npm test
# or
npx playwright test
```

### Run Specific Test File

```bash
npx playwright test tests/e2e/dashboard/at-a-glance.spec.ts
```

### Run Tests in UI Mode (Interactive)

```bash
npx playwright test --ui
```

### Run Tests in Headed Mode (See Browser)

```bash
npx playwright test --headed
```

### Run Tests in Debug Mode

```bash
npx playwright test --debug
```

### View Test Report

```bash
npx playwright show-report
```

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from "@playwright/test";
import { mockTumblrAPI } from "../../fixtures/mock-api";

test.describe("Feature Name", () => {
	// Mock API before each test
	test.beforeEach(async ({ page }) => {
		await mockTumblrAPI(page);
	});

	test("should do something", async ({ page }) => {
		// Navigate to page
		await page.goto("/");

		// Interact with page
		await page.click('[data-testid="some-button"]');

		// Assert expected behavior
		await expect(page.locator('[data-testid="result"]')).toBeVisible();
	});
});
```

### Using data-testid Selectors

Always prefer `data-testid` selectors over CSS classes or text content:

```typescript
// ✅ GOOD - Uses data-testid
await page.click('[data-testid="refresh-tumblr-button"]');
await expect(page.locator('[data-testid="active-threads-count"]')).toHaveText(
	"5"
);

// ❌ BAD - Uses CSS class (fragile, changes with styling)
await page.click(".refresh-button");

// ❌ BAD - Uses text content (fragile, changes with copy)
await page.click("text=Refresh");
```

### Adding data-testid to Components

When creating new components, add `data-testid` attributes:

```tsx
export const MyComponent = () => {
	return (
		<div data-testid="my-component">
			<button data-testid="my-button">Click me</button>
			<span data-testid="my-count">{count}</span>
		</div>
	);
};
```

**Naming Convention:**

- Use kebab-case: `my-component-name`
- Be descriptive: `active-threads-count` not just `count`
- Append type suffix for clarity: `-button`, `-widget`, `-count`, `-form`

## API Mocking

### Why Mock APIs?

All tests mock external API calls by default to:

- **Prevent hitting real Tumblr API** (avoid rate limits)
- **Make tests faster** (no network requests)
- **Make tests reliable** (no external dependencies)
- **Test error scenarios** (simulate API failures)

### Using Mock Helpers

Import and use the mock helpers from `tests/fixtures/mock-api.ts`:

#### Basic Mocking (Default Data)

```typescript
import { mockTumblrAPI } from "../../fixtures/mock-api";

test.beforeEach(async ({ page }) => {
	await mockTumblrAPI(page);
});
```

This mocks:

- `POST /api/thread` - Returns 3 mock threads (1 your turn, 1 their turn, 1 queued)
- `GET /api/threads/active` - Returns 3 mock active threads

#### Custom Data Mocking

```typescript
import { mockTumblrAPIWithCustomData } from "../../fixtures/mock-api";

test("should display 10 active threads", async ({ page }) => {
	await mockTumblrAPIWithCustomData(page, {
		activeCount: 10,
		yourTurnCount: 4,
		theirTurnCount: 5,
		queuedCount: 1,
	});

	await page.goto("/");
	// ... assertions
});
```

#### Error Scenario Mocking

```typescript
import { mockTumblrAPI } from "../../fixtures/mock-api";

test("should handle API errors", async ({ page }) => {
	await mockTumblrAPI(page, { shouldFail: true });

	await page.goto("/");
	// ... expect error toast
});
```

#### Selective Mocking

For tests that need real database calls but mock external APIs:

```typescript
test.beforeEach(async ({ page }) => {
	// Only mock Tumblr API, let database calls through
	await page.route("**/api/thread", (route) => {
		route.fulfill({ status: 200, body: JSON.stringify(mockData) });
	});
});
```

## Test Helpers

We provide utility functions in `tests/utils/test-helpers.ts`:

### Form Helpers

```typescript
import { fillField, clickAndWait } from "../utils/test-helpers";

// Fill a field and verify it was filled
await fillField(page, 'input[name="login"]', "testuser");

// Click and wait for navigation
await clickAndWait(page, '[data-testid="submit-button"]', {
	waitForNavigation: true,
	url: "/",
});
```

### Toast Notifications

```typescript
import { waitForToast } from "../utils/test-helpers";

await waitForToast(page, "success");
await waitForToast(page, "error", 10000); // Custom timeout
```

### Element Helpers

```typescript
import {
	waitForElement,
	getNumericValue,
	elementExists,
} from "../utils/test-helpers";

// Wait for element
await waitForElement(page, '[data-testid="my-component"]');

// Get numeric value
const count = await getNumericValue(page, '[data-testid="thread-count"]');
expect(count).toBe(5);

// Check if element exists
if (await elementExists(page, '[data-testid="error-message"]')) {
	// Handle error state
}
```

### Authentication Helpers

```typescript
import { login, logout, isLoggedIn } from "../utils/test-helpers";

// Login without using fixture
test.use({ storageState: { cookies: [], origins: [] } }); // No auth
await login(page);

// Logout
await logout(page);

// Check login status
const loggedIn = await isLoggedIn(page);
```

### API Helpers

```typescript
import { waitForAPIResponse } from "../utils/test-helpers";

// Wait for specific API call
await waitForAPIResponse(page, "/api/threads/active", 200);
```

## Best Practices

### 1. **Always Mock External APIs**

```typescript
test.beforeEach(async ({ page }) => {
	await mockTumblrAPI(page); // Prevents real API calls
});
```

### 2. **Use data-testid for Selectors**

```typescript
// ✅ GOOD
await page.click('[data-testid="submit-button"]');

// ❌ BAD
await page.click(".btn-primary");
```

### 3. **Test User Behavior, Not Implementation**

```typescript
// ✅ GOOD - Tests what user sees
test("should show error when login fails", async ({ page }) => {
	await page.goto("/login");
	await page.fill('input[name="login"]', "wrong");
	await page.fill('input[name="password"]', "wrong");
	await page.click('button[type="submit"]');
	await expect(page.locator("text=/invalid|incorrect/i")).toBeVisible();
});

// ❌ BAD - Tests implementation details
test("should call loginUser function", async ({ page }) => {
	// Don't test internal function calls, test user-visible outcomes
});
```

### 4. **Wait for Elements Properly**

```typescript
// ✅ GOOD - Uses Playwright's built-in waiting
await expect(page.locator('[data-testid="result"]')).toBeVisible();

// ❌ BAD - Manual sleep
await page.waitForTimeout(5000);
```

### 5. **Keep Tests Independent**

Each test should be able to run in isolation:

```typescript
test.beforeEach(async ({ page }) => {
	// Reset state for each test
	await mockTumblrAPI(page);
	await page.goto("/");
});
```

### 6. **Use Descriptive Test Names**

```typescript
// ✅ GOOD
test("should display error toast when refresh fails");

// ❌ BAD
test("error handling");
```

### 7. **Group Related Tests**

```typescript
test.describe("Dashboard - At a Glance", () => {
	test.describe("Widget Navigation", () => {
		test("should navigate to Your Turn when clicking widget", async ({
			page,
		}) => {
			// ...
		});

		test("should navigate to Their Turn when clicking widget", async ({
			page,
		}) => {
			// ...
		});
	});

	test.describe("Refresh Functionality", () => {
		// ...
	});
});
```

## Troubleshooting

### Tests Hitting Real Tumblr API

**Symptom:** Tests are slow or failing with rate limit errors.

**Solution:** Ensure `mockTumblrAPI()` is called in `beforeEach`:

```typescript
test.beforeEach(async ({ page }) => {
	await mockTumblrAPI(page);
});
```

### Authentication Failures

**Symptom:** Tests redirecting to login page unexpectedly.

**Solution:**

1. Check that test user exists in database
2. Verify credentials in `.env.test.local` or `auth.setup.ts`
3. Run auth setup manually: `npx playwright test tests/e2e/auth/auth.setup.ts`
4. Check `tests/.auth/user.json` was created

### Selectors Not Found

**Symptom:** `Error: locator.click: Target closed` or timeout errors.

**Solution:**

1. Check component has `data-testid` attribute
2. Run test in headed mode to see what's on page: `npx playwright test --headed`
3. Use debug mode: `npx playwright test --debug`
4. Check for typos in test ID: `active-threads-widget` not `active-thread-widget`

### Flaky Tests

**Symptom:** Tests pass/fail randomly.

**Solution:**

1. Add proper waits: `await expect(locator).toBeVisible()` instead of `await page.waitForTimeout()`
2. Increase timeout for slow operations: `{ timeout: 10000 }`
3. Check for race conditions (concurrent API calls)
4. Ensure tests are independent (don't rely on previous test state)

### Dev Server Not Starting

**Symptom:** `Error: connect ECONNREFUSED ::1:3000`

**Solution:**

1. Make sure dev server isn't already running
2. Kill any orphaned Node processes
3. Check port 3000 is available: `netstat -ano | findstr :3000`
4. Update `playwright.config.ts` webServer port if needed

## Test File Structure

```
tests/
├── e2e/                          # End-to-end tests
│   ├── auth/
│   │   ├── auth.setup.ts         # Authentication setup (runs first)
│   │   └── login.spec.ts         # Login flow tests
│   └── dashboard/
│       └── at-a-glance.spec.ts   # Dashboard tests
├── fixtures/
│   └── mock-api.ts               # API mocking helpers
├── utils/
│   └── test-helpers.ts           # Test utility functions
└── .auth/
    └── user.json                 # Stored auth state (gitignored)
```

## Adding New Tests

### 1. Create Test File

```bash
# Create directory
mkdir -p tests/e2e/threads

# Create test file
touch tests/e2e/threads/thread-list.spec.ts
```

### 2. Write Test

```typescript
import { test, expect } from "@playwright/test";
import { mockTumblrAPI } from "../../fixtures/mock-api";

test.describe("Thread List", () => {
	test.beforeEach(async ({ page }) => {
		await mockTumblrAPI(page);
	});

	test("should display all threads", async ({ page }) => {
		await page.goto("/threads/all");
		await expect(page.locator('[data-testid="thread-list"]')).toBeVisible();
	});
});
```

### 3. Add data-testid to Components

```tsx
// components/threads/ThreadList.tsx
export const ThreadList = () => {
	return <div data-testid="thread-list">{/* ... */}</div>;
};
```

### 4. Run Test

```bash
npx playwright test tests/e2e/threads/thread-list.spec.ts
```

## CI/CD Integration

### GitHub Actions Example

```yaml
# .github/workflows/e2e.yml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: npm ci

      - name: Run Playwright tests
        run: npx playwright test
        env:
          TEST_USERNAME: ${{ secrets.TEST_USERNAME }}
          TEST_PASSWORD: ${{ secrets.TEST_PASSWORD }}
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
          NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}

      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Next.js Testing](https://nextjs.org/docs/testing)
- [Project Test Examples](./tests/e2e/)

## Questions?

If you encounter issues not covered here:

1. Check the [Playwright documentation](https://playwright.dev)
2. Run tests in debug mode: `npx playwright test --debug`
3. Open an issue in the repository
