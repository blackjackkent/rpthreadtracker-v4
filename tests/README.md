# E2E Testing with Playwright

## Quick Start

```bash
# Run all tests
npm test

# Run tests with UI (interactive)
npm run test:ui

# Run tests in headed mode (see browser)
npm run test:headed

# Debug a specific test
npm run test:debug

# View test report
npm run test:report
```

## Test Structure

```
tests/
├── e2e/                          # End-to-end test specs
│   ├── auth/
│   │   ├── auth.setup.ts         # Authentication setup (runs first)
│   │   └── login.spec.ts         # Login flow tests
│   └── dashboard/
│       └── at-a-glance.spec.ts   # Dashboard widget tests
├── fixtures/
│   └── mock-api.ts               # API mocking utilities
├── utils/
│   └── test-helpers.ts           # Test helper functions
└── .auth/
    └── user.json                 # Stored auth state (auto-generated)
```

## Key Features

### ✅ Automatic Authentication
Tests use a stored authentication state, so you don't need to log in for every test.

### ✅ API Mocking
All tests mock external API calls to prevent hitting the real Tumblr API:

```typescript
import { mockTumblrAPI } from '../../fixtures/mock-api';

test.beforeEach(async ({ page }) => {
  await mockTumblrAPI(page); // Mocks Tumblr API calls
});
```

### ✅ Test Helpers
Utility functions for common tasks:

```typescript
import { fillField, waitForToast, getNumericValue } from '../utils/test-helpers';

await fillField(page, 'input[name="username"]', 'testuser');
await waitForToast(page, 'success');
const count = await getNumericValue(page, '[data-testid="thread-count"]');
```

### ✅ data-testid Selectors
Components use `data-testid` attributes for reliable test selectors:

```typescript
// ✅ Reliable - won't break with styling changes
await page.click('[data-testid="refresh-button"]');

// ❌ Fragile - breaks when CSS classes change
await page.click('.btn-primary');
```

## Writing Your First Test

1. **Create test file:**
```bash
touch tests/e2e/my-feature/my-test.spec.ts
```

2. **Write test:**
```typescript
import { test, expect } from '@playwright/test';
import { mockTumblrAPI } from '../../fixtures/mock-api';

test.describe('My Feature', () => {
  test.beforeEach(async ({ page }) => {
    await mockTumblrAPI(page);
  });

  test('should work correctly', async ({ page }) => {
    await page.goto('/my-page');
    await page.click('[data-testid="my-button"]');
    await expect(page.locator('[data-testid="result"]')).toBeVisible();
  });
});
```

3. **Add data-testid to component:**
```tsx
export const MyComponent = () => {
  return (
    <div data-testid="my-component">
      <button data-testid="my-button">Click me</button>
      <span data-testid="result">Success!</span>
    </div>
  );
};
```

4. **Run test:**
```bash
npx playwright test tests/e2e/my-feature/my-test.spec.ts
```

## Configuration

Test configuration is in `playwright.config.ts`. Key settings:

- **Base URL:** `http://localhost:3000`
- **Browsers:** Chromium (default), Firefox, WebKit available
- **Retries:** 2 retries on CI, 0 locally
- **Timeout:** 30s per test
- **Screenshots:** On failure only
- **Video:** On first retry only

## Setup Requirements

### Test User

You need a test user in your database. Configure credentials in one of two ways:

**Option 1: Environment Variables (Recommended)**
```env
# .env.test.local
TEST_USERNAME=testuser
TEST_PASSWORD=testpassword123
```

**Option 2: Direct Configuration**
Edit `tests/e2e/auth/auth.setup.ts` and update the credentials.

### First Time Setup

Run the authentication setup once:
```bash
npx playwright test tests/e2e/auth/auth.setup.ts
```

This creates `tests/.auth/user.json` which is reused by all tests.

## Common Commands

```bash
# Run all tests
npm test

# Run specific test file
npx playwright test tests/e2e/dashboard/at-a-glance.spec.ts

# Run tests matching pattern
npx playwright test --grep "dashboard"

# Run in UI mode (interactive, best for development)
npm run test:ui

# Run in headed mode (see browser)
npm run test:headed

# Debug specific test
npx playwright test tests/e2e/auth/login.spec.ts --debug

# Update snapshots (if using visual regression)
npx playwright test --update-snapshots

# Generate test code (record actions)
npx playwright codegen http://localhost:3000
```

## Debugging

### View test in slow motion:
```bash
npx playwright test --headed --slowMo=1000
```

### Use debug mode:
```bash
npm run test:debug
```

### Check what's on the page:
```typescript
// Print all data-testids
const testIds = await page.locator('[data-testid]').allTextContents();
console.log(testIds);

// Take screenshot
await page.screenshot({ path: 'debug.png' });

// Pause execution
await page.pause();
```

## Full Documentation

See [TESTING.md](../TESTING.md) for comprehensive documentation including:
- Best practices
- Troubleshooting guide
- CI/CD integration
- Advanced testing patterns

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Project Testing Guide](../TESTING.md)
- [Next.js Testing](https://nextjs.org/docs/testing)