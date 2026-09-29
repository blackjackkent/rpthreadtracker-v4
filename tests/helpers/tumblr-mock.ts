import { Page } from "@playwright/test";
import { POST_IDS } from "../fixtures/seed";

interface TumblrStatusRequest {
	threadId?: number;
	postId: string;
	characterUrlIdentifier: string;
	partnerUrlIdentifier?: string;
	dateMarkedQueued?: string;
}

interface TumblrStatusResponse {
	threadId?: number;
	postId: string;
	lastPostDate: string | null;
	lastPosterUrlIdentifier: string;
	lastPostUrl: string;
	isCallingCharactersTurn: boolean;
	isQueued: boolean;
}

/**
 * Returns a deterministic mock Tumblr status for a given postId.
 * Matches the seed data defined in fixtures/seed.ts.
 */
function mockStatusForPost(
	req: TumblrStatusRequest
): TumblrStatusResponse {
	const statusByPostId: Record<string, Partial<TumblrStatusResponse>> = {
		[POST_IDS.yourTurn]: {
			isCallingCharactersTurn: true,
			lastPosterUrlIdentifier: req.partnerUrlIdentifier ?? "partner",
			lastPostDate: "2024-06-01T00:00:00.000Z",
			lastPostUrl: `https://${req.characterUrlIdentifier}.tumblr.com/post/${req.postId}`,
		},
		[POST_IDS.theirTurn]: {
			isCallingCharactersTurn: false,
			lastPosterUrlIdentifier: req.characterUrlIdentifier,
			lastPostDate: "2024-06-01T00:00:00.000Z",
			lastPostUrl: `https://${req.characterUrlIdentifier}.tumblr.com/post/${req.postId}`,
		},
		[POST_IDS.queued]: {
			isCallingCharactersTurn: true,
			lastPosterUrlIdentifier: req.partnerUrlIdentifier ?? "partner",
			lastPostDate: "2023-12-01T00:00:00.000Z",
			lastPostUrl: `https://${req.characterUrlIdentifier}.tumblr.com/post/${req.postId}`,
		},
		[POST_IDS.archived]: {
			isCallingCharactersTurn: false,
			lastPosterUrlIdentifier: req.characterUrlIdentifier,
			lastPostDate: "2024-01-01T00:00:00.000Z",
			lastPostUrl: `https://${req.characterUrlIdentifier}.tumblr.com/post/${req.postId}`,
		},
		[POST_IDS.queuedButPosted]: {
			isCallingCharactersTurn: true,
			lastPosterUrlIdentifier: req.partnerUrlIdentifier ?? "partner",
			lastPostDate: "2024-06-01T00:00:00.000Z",
			lastPostUrl: `https://${req.characterUrlIdentifier}.tumblr.com/post/${req.postId}`,
		},
		[POST_IDS.hiatus]: {
			isCallingCharactersTurn: true,
			lastPosterUrlIdentifier: req.partnerUrlIdentifier ?? "partner",
			lastPostDate: "2024-06-01T00:00:00.000Z",
			lastPostUrl: `https://${req.characterUrlIdentifier}.tumblr.com/post/${req.postId}`,
		},
	};

	const known = statusByPostId[req.postId];

	return {
		threadId: req.threadId,
		postId: req.postId,
		lastPostDate: known?.lastPostDate ?? null,
		lastPosterUrlIdentifier: known?.lastPosterUrlIdentifier ?? "",
		lastPostUrl: known?.lastPostUrl ?? "",
		isCallingCharactersTurn: known?.isCallingCharactersTurn ?? true,
		isQueued: (() => {
			if (!req.dateMarkedQueued) return false;
			const lastPostDate = known?.lastPostDate;
			if (!lastPostDate) return true;
			return new Date(req.dateMarkedQueued) > new Date(lastPostDate);
		})(),
	};
}

function getSeededThreads(): Map<number, TumblrStatusRequest> {
	const raw = process.env.E2E_SEEDED_THREADS;
	if (!raw) {
		throw new Error("E2E_SEEDED_THREADS is not set; it is populated by global-setup.ts");
	}
	const threads: (TumblrStatusRequest & { threadId: number })[] = JSON.parse(raw);
	return new Map(threads.map((thread) => [thread.threadId, thread]));
}

/**
 * Intercepts the thread status endpoints and returns deterministic mock responses:
 * POST /api/thread (logged-in, sends post details) and
 * POST /api/public-views/:viewId/thread-status (public, sends only thread IDs).
 * Call this in beforeEach for any test that loads thread statuses.
 */
export async function mockTumblrApi(page: Page) {
	await page.route("/api/thread", async (route) => {
		if (route.request().method() !== "POST") {
			await route.continue();
			return;
		}
		const body: TumblrStatusRequest[] = route.request().postDataJSON();
		const responses = body.map(mockStatusForPost);
		await route.fulfill({ json: responses });
	});

	await page.route("/api/public-views/*/thread-status", async (route) => {
		const seededThreads = getSeededThreads();
		const { threadIds }: { threadIds: number[] } = route.request().postDataJSON();
		const responses = threadIds
			.map((id) => seededThreads.get(id))
			.filter((thread): thread is TumblrStatusRequest => !!thread)
			.map(mockStatusForPost);
		await route.fulfill({ json: responses });
	});
}

/**
 * Intercepts GET /api/news and returns an empty array.
 * Prevents real Tumblr API calls during tests.
 */
export async function mockNewsApi(page: Page) {
	await page.route("/api/news", async (route) => {
		await route.fulfill({ json: [] });
	});
}

/**
 * Intercepts GET /api/news and returns two fake news items.
 * Use in news sidebar tests that need actual content.
 */
export async function mockNewsApiWithItems(page: Page) {
	await page.route("/api/news", async (route) => {
		await route.fulfill({
			json: [
				{
					postId: "news-1",
					postTitle: "Test News Item One",
					postDate: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
					postUrl: "https://tblrthreadtracker.tumblr.com/post/1",
				},
				{
					postId: "news-2",
					postTitle: "Test News Item Two",
					postDate: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
					postUrl: "https://tblrthreadtracker.tumblr.com/post/2",
				},
			],
		});
	});
}

/**
 * Sets up all external API mocks. Call in beforeEach.
 */
export async function mockExternalApis(page: Page) {
	await mockTumblrApi(page);
	await mockNewsApi(page);
}
