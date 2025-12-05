import { Page } from "@playwright/test";

/**
 * Mock data for Tumblr API responses
 * NOTE: Uses PascalCase to match database schema (ThreadWithCharacter type)
 */
export const mockThreads = [
	{
		ThreadId: 1,
		PostId: "123456789",
		PartnerUrlIdentifier: "partner-blog-1",
		DateMarkedQueued: null,
		IsArchived: false,
		Characters: {
			UrlIdentifier: "test-character-1",
		},
	},
	{
		ThreadId: 2,
		PostId: "987654321",
		PartnerUrlIdentifier: "partner-blog-2",
		DateMarkedQueued: null,
		IsArchived: false,
		Characters: {
			UrlIdentifier: "test-character-2",
		},
	},
	{
		ThreadId: 3,
		PostId: "555555555",
		PartnerUrlIdentifier: "partner-blog-3",
		DateMarkedQueued: new Date().toISOString(),
		IsArchived: false,
		Characters: {
			UrlIdentifier: "test-character-3",
		},
	},
];

export const mockThreadStatuses = [
	{
		threadId: 1,
		postId: "123456789",
		isCallingCharactersTurn: true, // Your turn
		isQueued: false,
		lastPostDate: new Date().toISOString(),
		lastPosterUrlIdentifier: "partner-blog-1",
		lastPostUrl: "https://tumblr.com/partner-blog-1/123456789",
	},
	{
		threadId: 2,
		postId: "987654321",
		isCallingCharactersTurn: false, // Their turn
		isQueued: false,
		lastPostDate: new Date().toISOString(),
		lastPosterUrlIdentifier: "test-character-2",
		lastPostUrl: "https://tumblr.com/test-character-2/987654321",
	},
	{
		threadId: 3,
		postId: "555555555",
		isCallingCharactersTurn: true, // Your turn
		isQueued: true, // Queued
		lastPostDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
		lastPosterUrlIdentifier: "partner-blog-3",
		lastPostUrl: "https://tumblr.com/partner-blog-3/555555555",
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
	await page.route("**/api/thread", async (route) => {
		if (route.request().method() === "POST") {
			if (shouldFail) {
				await route.fulfill({
					status: 500,
					contentType: "application/json",
					body: JSON.stringify({ error: "Internal server error" }),
				});
			} else {
				// Return mock statuses for all threads
				await route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify(statuses),
				});
			}
		} else if (route.request().method() === "GET") {
			// Mock GET for single thread (if needed)
			const url = new URL(route.request().url());
			const postId = url.searchParams.get("postId");

			const status = statuses.find((s) => s.postId === postId);

			if (status) {
				await route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify(status),
				});
			} else {
				await route.fulfill({
					status: 404,
					contentType: "application/json",
					body: JSON.stringify({ error: "Thread not found" }),
				});
			}
		} else {
			await route.continue();
		}
	});

	// Mock GET /api/threads/active (fetch active threads from database)
	await page.route("**/api/threads/active", async (route) => {
		if (shouldFail) {
			await route.fulfill({
				status: 500,
				contentType: "application/json",
				body: JSON.stringify({ error: "Database error" }),
			});
		} else {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
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
	const {
		activeCount = 3,
		yourTurnCount = 1,
		theirTurnCount = 1,
		queuedCount = 1,
	} = customData;

	// Generate mock threads (all active threads)
	// NOTE: Uses PascalCase to match database schema (ThreadWithCharacter type)
	const threads = Array.from({ length: activeCount }, (_, i) => ({
		ThreadId: i + 1,
		PostId: `${100000000 + i}`,
		PartnerUrlIdentifier: `partner-blog-${i + 1}`,
		DateMarkedQueued: i < queuedCount ? new Date().toISOString() : null,
		IsArchived: false,
		Characters: {
			UrlIdentifier: `test-character-${i + 1}`,
		},
	}));

	// Generate mock statuses
	// Note: yourTurn + theirTurn should equal activeCount
	// Queued threads are a separate flag that can overlap with turn status
	const statuses = [];
	let statusIndex = 0;

	// Your turn threads (first yourTurnCount threads)
	for (let i = 0; i < yourTurnCount && statusIndex < activeCount; i++) {
		statuses.push({
			threadId: threads[statusIndex].ThreadId,
			postId: threads[statusIndex].PostId,
			isCallingCharactersTurn: true, // Your turn
			isQueued: statusIndex < queuedCount, // First queuedCount threads are queued
			lastPostDate: new Date().toISOString(),
			lastPosterUrlIdentifier: threads[statusIndex].PartnerUrlIdentifier,
			lastPostUrl: `https://tumblr.com/${threads[statusIndex].PartnerUrlIdentifier}/${threads[statusIndex].PostId}`,
		});
		statusIndex++;
	}

	// Their turn threads (next theirTurnCount threads)
	for (let i = 0; i < theirTurnCount && statusIndex < activeCount; i++) {
		statuses.push({
			threadId: threads[statusIndex].ThreadId,
			postId: threads[statusIndex].PostId,
			isCallingCharactersTurn: false, // Their turn
			isQueued: statusIndex < queuedCount, // Based on queue position
			lastPostDate: new Date().toISOString(),
			lastPosterUrlIdentifier: threads[statusIndex].Characters.UrlIdentifier || "",
			lastPostUrl: `https://tumblr.com/${threads[statusIndex].Characters.UrlIdentifier}/${threads[statusIndex].PostId}`,
		});
		statusIndex++;
	}

	// Fill remaining threads (if any) as "their turn"
	while (statusIndex < activeCount) {
		statuses.push({
			threadId: threads[statusIndex].ThreadId,
			postId: threads[statusIndex].PostId,
			isCallingCharactersTurn: false,
			isQueued: statusIndex < queuedCount,
			lastPostDate: new Date().toISOString(),
			lastPosterUrlIdentifier: threads[statusIndex].Characters.UrlIdentifier || "",
			lastPostUrl: `https://tumblr.com/${threads[statusIndex].Characters.UrlIdentifier}/${threads[statusIndex].PostId}`,
		});
		statusIndex++;
	}

	await mockTumblrAPI(page, { threads, statuses });
}

/**
 * Wait for API calls to complete
 * Useful for waiting for initial data load
 */
export async function waitForAPIResponse(
	page: Page,
	url: string,
	timeout = 10000
) {
	return page.waitForResponse(
		(response) => response.url().includes(url) && response.status() === 200,
		{ timeout }
	);
}
