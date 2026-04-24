# RPThreadTracker v4 — Testing

## Overview

Two layers of testing:

1. **Manual smoke tests** — `SMOKE_TEST.md` — run by hand against the dev server when verifying a release
2. **Playwright E2E tests** — this file — automated, run locally and in CI

---

## E2E Test Architecture

### Approach

Tests run against a real Next.js dev server pointed at a **dedicated test SQL Server database**. This gives genuine end-to-end coverage of server components, server actions, and client-side data fetching without touching production data.

The only external service mocked is the **Tumblr API** — intercepted client-side via Playwright's `page.route()` since we don't want real API calls in tests and can't predict post content.

### Test Database

A separate `RPThreadTracker_Test` database is seeded with known fixture data before the suite runs (`tests/global-setup.ts`). The schema is identical to production — same Prisma schema, same SQL Server.

| Layer | Strategy |
|---|---|
| SQL Server (threads, characters, users) | Real test database |
| Tumblr API (`POST /api/thread`) | `page.route()` mock |
| News feed (`GET /api/news`) | `page.route()` mock — returns `[]` |
| Auth session | Saved via `auth.setup.ts`, reused across tests |

### Fixture Data

Defined in `tests/fixtures/seed.ts`. One test user with:

| Thread | PostId | Status |
|---|---|---|
| Your Turn Thread | `101010101` | Your Turn (Tumblr mock) |
| Their Turn Thread | `202020202` | Their Turn (Tumblr mock) |
| Queued Thread | `303030303` | Queued (DateMarkedQueued set) |
| Archived Thread | `404040404` | Archived (IsArchived = true) |
| No Post Thread | _(none)_ | Your Turn (default) |
| Hiatus Thread | `505050505` | Belongs to hiatus character — excluded from active views |

Expected dashboard counts from this fixture set:
- **All Threads**: 4 · **Your Turn**: 2 · **Their Turn**: 1 · **Queued**: 1

---

## File Structure

```
tests/
├── .auth/
│   └── user.json              # Saved auth session (gitignored)
├── e2e/
│   ├── auth.setup.ts          # Logs in as test user, saves session
│   ├── auth.spec.ts           # Login, registration, forgot password, protected routes
│   ├── dashboard.spec.ts      # At a Glance counts, news sidebar, character section
│   ├── characters.spec.ts     # Character CRUD + hiatus toggle
│   └── threads.spec.ts        # All 5 thread views + thread CRUD
├── fixtures/
│   └── seed.ts                # Test user credentials, post IDs, expected counts
├── helpers/
│   └── tumblr-mock.ts         # page.route() interceptors for Tumblr + news APIs
├── global-setup.ts            # Wipes + reseeds test DB before suite
└── global-teardown.ts         # Cleans up test user data after suite
```

---

## Local Setup

### 1. Ensure your SQL Server login has `dbcreator`

Prisma creates the test database automatically on first push. Your SQL Server login needs the `dbcreator` server role — grant it in SSMS under **Security → Logins → [your login] → Properties → Server Roles**.

### 2. Push the schema

```bash
DATABASE_URL="sqlserver://localhost:49893;database=RPThreadTracker_Test;user=YOUR_USER;password=YOUR_PASSWORD;trustServerCertificate=true" \
  npx prisma db push
```

This creates `RPThreadTracker_Test` and applies the schema in one step. Do **not** create the database manually first — Prisma's SQL Server connector always runs `CREATE DATABASE` and will error with P1009 if it already exists.

### 3. Configure environment

```bash
cp .env.test.local.example .env.test.local
# Fill in TEST_DATABASE_URL
```

`.env.test.local` is loaded before `.env.local` by `playwright.config.ts`, so `TEST_DATABASE_URL` overrides `DATABASE_URL` for the test server process.

### 4. Run tests

```bash
npm test              # Run full suite (headless)
npm run test:ui       # Playwright UI mode (interactive)
npm run test:headed   # Headed browser (visible)
npm run test:debug    # Debug mode
npm run test:report   # Open last HTML report
```

> **Note:** The dev server must not already be running on port 3000 unless you want to reuse it. Set `reuseExistingServer: true` in `playwright.config.ts` (already the default for local runs).

---

## CI (GitHub Actions)

See `.github/workflows/e2e.yml`. The workflow:

1. Starts a SQL Server 2022 Docker container as a service
2. Creates `RPThreadTracker_Test` database
3. Runs `prisma db push` to apply the schema
4. Runs `npm test` with test DB URL and other secrets injected

### Required GitHub Secrets

| Secret | Description |
|---|---|
| `CI_DB_PASSWORD` | SA password for the SQL Server container |
| `CI_TEST_DATABASE_URL` | Full Prisma connection string for the test DB |
| `CI_NEXTAUTH_SECRET` | NextAuth secret (any random string, consistent with test server) |

`CI_TEST_DATABASE_URL` format:
```
sqlserver://localhost:1433;database=RPThreadTracker_Test;user=sa;password=YOUR_PASSWORD;trustServerCertificate=true
```

### What is NOT needed in CI

- Tumblr API credentials — all Tumblr calls are mocked via `page.route()`
- Resend API key — email flows are not tested in E2E (set to a placeholder)
- Production `DATABASE_URL` — tests only touch the test database

---

## Writing New Tests

### Setup pattern

```typescript
import { test, expect } from "@playwright/test";
import { mockExternalApis } from "../helpers/tumblr-mock";

test.beforeEach(async ({ page }) => {
  await mockExternalApis(page); // always mock Tumblr + news
});
```

### Auth

All tests in `tests/e2e/` use the saved session from `auth.setup.ts` by default (configured in `playwright.config.ts`). To test unauthenticated flows, override it:

```typescript
test.use({ storageState: { cookies: [], origins: [] } });
```

### Adding fixture data

If a test needs data beyond the base fixtures, create and clean it up within the test:

```typescript
test("my test", async ({ page }) => {
  // Create test-specific data via UI actions (preferred)
  // or directly via Prisma in a beforeEach/afterEach if needed
});
```

Avoid modifying the shared fixture records (the threads and characters seeded by `global-setup.ts`) — other tests depend on them.

---

## Known Limitations

- Tests run sequentially in CI (`workers: 1`) to avoid race conditions on shared DB records
- Email flows (forgot password, email change) are not covered by E2E — they would require a real SMTP server or a dedicated email testing service
- The Tumblr mock returns fixed responses — tests do not cover edge cases like deleted posts or rate limiting
