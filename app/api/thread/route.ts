import { NextRequest, NextResponse } from "next/server";
import { getTumblrPostWithRetry } from "@/lib/tumblr-client";
import { calculateThreadStatus } from "@/lib/thread-status-calculator";
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

/**
 * POST /api/thread
 * Batch fetch thread status for multiple threads
 * Body: ThreadStatusRequest[]
 *
 * @requires Authentication
 */
export async function POST(request: NextRequest) {
	// Require authentication
	const authResult = await requireAuth();
	if (authResult instanceof NextResponse) return authResult;

	try {
		const body: ThreadStatusRequest[] = await request.json();

		// Validate request body
		if (!Array.isArray(body)) {
			return NextResponse.json(
				{ error: "Request body must be an array of ThreadStatusRequest" },
				{ status: 400 }
			);
		}

		// Process all threads in parallel
		const results = await Promise.all(
			body.map(async (threadRequest) => {
				try {
					// Fetch post from Tumblr with retry logic
					const post = await getTumblrPostWithRetry(
						threadRequest.characterUrlIdentifier,
						threadRequest.postId
					);

					// Calculate thread status
					return calculateThreadStatus(threadRequest, post);
				} catch (error) {
					console.error(
						`Error processing thread ${threadRequest.postId}:`,
						error
					);
					// Return a default "character's turn" response for failed requests
					return calculateThreadStatus(threadRequest, null);
				}
			})
		);

		return NextResponse.json(results);
	} catch (error) {
		console.error("Error processing batch thread status:", error);
		return NextResponse.json(
			{ error: "Failed to process batch thread status" },
			{ status: 500 }
		);
	}
}
