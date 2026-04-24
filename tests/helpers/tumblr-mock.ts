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
	const isQueued = req.dateMarkedQueued != null;

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
		isQueued,
	};
}

/**
 * Intercepts POST /api/thread and returns deterministic mock responses.
 * Call this in beforeEach for any test that triggers the ThreadStatusProvider.
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
 * Sets up all external API mocks. Call in beforeEach.
 */
export async function mockExternalApis(page: Page) {
	await mockTumblrApi(page);
	await mockNewsApi(page);
}
