import { NextRequest, NextResponse } from "next/server";
import { getTumblrPostWithRetry } from "@/lib/tumblr-client";
import {
	calculateThreadStatus,
	batchCalculateThreadStatuses,
	MAX_THREAD_STATUS_BATCH_SIZE,
} from "@/lib/thread-status-calculator";
import { requireAuth } from "@/lib/api-auth";
import type { ThreadStatusRequest } from "@/types/tumblr";

/**
 * GET /api/thread
 * Fetch thread status for a single thread
 * Query params: postId, characterUrlIdentifier, partnerUrlIdentifier (optional), dateMarkedQueued (optional)
 *
 * @requires Authentication
 */
export async function GET(request: NextRequest) {
	// Require authentication
	const authResult = await requireAuth();
	if (authResult instanceof NextResponse) return authResult;

	const searchParams = request.nextUrl.searchParams;

	const postId = searchParams.get("postId");
	const characterUrlIdentifier = searchParams.get("characterUrlIdentifier");
	const partnerUrlIdentifier = searchParams.get("partnerUrlIdentifier");
	const dateMarkedQueued = searchParams.get("dateMarkedQueued");

	// Validate required parameters
	if (!postId || !characterUrlIdentifier) {
		return NextResponse.json(
			{
				error: "Missing required parameters: postId and characterUrlIdentifier",
			},
			{ status: 400 }
		);
	}

	// Build request object
	const threadRequest: ThreadStatusRequest = {
		postId,
		characterUrlIdentifier,
		partnerUrlIdentifier: partnerUrlIdentifier || undefined,
		dateMarkedQueued: dateMarkedQueued ? new Date(dateMarkedQueued) : undefined,
	};

	try {
		// Fetch post from Tumblr with retry logic
		const post = await getTumblrPostWithRetry(characterUrlIdentifier, postId);

		// Calculate thread status
		const status = calculateThreadStatus(threadRequest, post);

		return NextResponse.json(status);
	} catch (error) {
		console.error("Error fetching thread status:", error);
		return NextResponse.json(
			{ error: "Failed to fetch thread status" },
			{ status: 500 }
		);
	}
}

const isValidThreadStatusRequest = (item: unknown): item is ThreadStatusRequest => {
	if (typeof item !== "object" || item === null) return false;
	const { postId, characterUrlIdentifier } = item as Record<string, unknown>;
	return (
		typeof postId === "string" &&
		postId.length > 0 &&
		typeof characterUrlIdentifier === "string" &&
		characterUrlIdentifier.length > 0
	);
};

/**
 * POST /api/thread
 * Batch fetch thread status for multiple threads
 * Body: ThreadStatusRequest[] (at most MAX_THREAD_STATUS_BATCH_SIZE)
 *
 * @requires Authentication — public views use /api/public-views/[viewId]/thread-status
 */
export async function POST(request: NextRequest) {
	const authResult = await requireAuth();
	if (authResult instanceof NextResponse) return authResult;

	try {
		const body: unknown = await request.json();

		if (
			!Array.isArray(body) ||
			body.length > MAX_THREAD_STATUS_BATCH_SIZE ||
			!body.every(isValidThreadStatusRequest)
		) {
			return NextResponse.json(
				{
					error: `Request body must be an array of at most ${MAX_THREAD_STATUS_BATCH_SIZE} ThreadStatusRequest objects`,
				},
				{ status: 400 }
			);
		}

		const results = await batchCalculateThreadStatuses(body);

		return NextResponse.json(results);
	} catch (error) {
		console.error("Error processing batch thread status:", error);
		return NextResponse.json(
			{ error: "Failed to process batch thread status" },
			{ status: 500 }
		);
	}
}
