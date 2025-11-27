import { Page } from '@playwright/test';

/**
 * Mock data for Tumblr API responses
 */
export const mockThreads = [
  {
    threadId: 1,
    postId: '123456789',
    characterUrlIdentifier: 'test-character-1',
    partnerUrlIdentifier: 'partner-blog-1',
    dateMarkedQueued: null,
  },
  {
    threadId: 2,
    postId: '987654321',
    characterUrlIdentifier: 'test-character-2',
    partnerUrlIdentifier: 'partner-blog-2',
    dateMarkedQueued: null,
  },
  {
    threadId: 3,
    postId: '555555555',
    characterUrlIdentifier: 'test-character-3',
    partnerUrlIdentifier: 'partner-blog-3',
    dateMarkedQueued: new Date().toISOString(),
  },
];

export const mockThreadStatuses = [
  {
    postId: '123456789',
    isPartnerTurn: false, // Your turn
    isQueued: false,
    lastPostDate: new Date().toISOString(),
    lastPosterUrlIdentifier: 'partner-blog-1',
  },
  {
    postId: '987654321',
    isPartnerTurn: true, // Their turn
    isQueued: false,
    lastPostDate: new Date().toISOString(),
    lastPosterUrlIdentifier: 'test-character-2',
  },
  {
    postId: '555555555',
    isPartnerTurn: false,
    isQueued: true, // Queued
    lastPostDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    lastPosterUrlIdentifier: 'partner-blog-3',
  },
];

/**
 * Mock all API endpoints to prevent real API calls during tests
 *
 * This function intercepts:
 * - POST /api/thread - Batch thread status fetch (Tumblr API)
 * - GET /api/thread - Single thread status fetch (Tumblr API)
 * - GET /api/threads/active - Fetch active threads from database
 *
 * @param page - Playwright page object
 * @param options - Optional configuration for mock responses
 */
export async function mockTumblrAPI(
  page: Page,
  options: {
    threads?: typeof mockThreads;
    statuses?: typeof mockThreadStatuses;
    shouldFail?: boolean;
  } = {}
) {
  const {
    threads = mockThreads,
    statuses = mockThreadStatuses,
    shouldFail = false,
  } = options;

  // Mock POST /api/thread (batch thread status check)
  await page.route('**/api/thread', async (route) => {
    if (route.request().method() === 'POST') {
      if (shouldFail) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' }),
        });
      } else {
        // Return mock statuses for all threads
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(statuses),
        });
      }
    } else if (route.request().method() === 'GET') {
      // Mock GET for single thread (if needed)
      const url = new URL(route.request().url());
      const postId = url.searchParams.get('postId');

      const status = statuses.find((s) => s.postId === postId);

      if (status) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(status),
        });
      } else {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Thread not found' }),
        });
      }
    } else {
      await route.continue();
    }
  });

  // Mock GET /api/threads/active (fetch active threads from database)
  await page.route('**/api/threads/active', async (route) => {
    if (shouldFail) {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Database error' }),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(threads),
      });
    }
  });
}

/**
 * Mock API with custom response data
 * Useful for testing specific scenarios
 */
export async function mockTumblrAPIWithCustomData(
  page: Page,
  customData: {
    activeCount?: number;
    yourTurnCount?: number;
    theirTurnCount?: number;
    queuedCount?: number;
  }
) {
  const { activeCount = 3, yourTurnCount = 1, theirTurnCount = 1, queuedCount = 1 } = customData;

  // Generate mock threads
  const threads = Array.from({ length: activeCount }, (_, i) => ({
    threadId: i + 1,
    postId: `${100000000 + i}`,
    characterUrlIdentifier: `test-character-${i + 1}`,
    partnerUrlIdentifier: `partner-blog-${i + 1}`,
    dateMarkedQueued: i < queuedCount ? new Date().toISOString() : null,
  }));

  // Generate mock statuses
  let statusIndex = 0;
  const statuses = [];

  // Your turn threads
  for (let i = 0; i < yourTurnCount; i++) {
    statuses.push({
      postId: threads[statusIndex].postId,
      isPartnerTurn: false,
      isQueued: false,
      lastPostDate: new Date().toISOString(),
      lastPosterUrlIdentifier: threads[statusIndex].partnerUrlIdentifier,
    });
    statusIndex++;
  }

  // Their turn threads
  for (let i = 0; i < theirTurnCount; i++) {
    statuses.push({
      postId: threads[statusIndex].postId,
      isPartnerTurn: true,
      isQueued: false,
      lastPostDate: new Date().toISOString(),
      lastPosterUrlIdentifier: threads[statusIndex].characterUrlIdentifier,
    });
    statusIndex++;
  }

  // Queued threads
  for (let i = 0; i < queuedCount; i++) {
    statuses.push({
      postId: threads[statusIndex].postId,
      isPartnerTurn: false,
      isQueued: true,
      lastPostDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      lastPosterUrlIdentifier: threads[statusIndex].partnerUrlIdentifier,
    });
    statusIndex++;
  }

  await mockTumblrAPI(page, { threads, statuses });
}

/**
 * Wait for API calls to complete
 * Useful for waiting for initial data load
 */
export async function waitForAPIResponse(page: Page, url: string, timeout = 10000) {
  return page.waitForResponse(
    (response) => response.url().includes(url) && response.status() === 200,
    { timeout }
  );
}