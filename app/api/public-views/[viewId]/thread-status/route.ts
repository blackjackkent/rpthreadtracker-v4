import { NextRequest, NextResponse } from "next/server";
import {
	getPublicViewById,
	getThreadsForPublicView,
} from "@/lib/db/public-view";
import {
	batchCalculateThreadStatuses,
	MAX_THREAD_STATUS_BATCH_SIZE,
} from "@/lib/thread-status-calculator";
import type { ThreadStatusRequest } from "@/types/tumblr";

const UUID_PATTERN =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST /api/public-views/[viewId]/thread-status
 * Body: { threadIds: number[] } (at most MAX_THREAD_STATUS_BATCH_SIZE)
 *
 * Unauthenticated. Post IDs and blogs are read from the database, and only
 * threads that belong to the given public view are checked.
 */
export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ viewId: string }> }
) {
	const { viewId } = await params;
	if (!UUID_PATTERN.test(viewId)) {
		return NextResponse.json({ error: "Public view not found" }, { status: 404 });
	}

	let threadIds: unknown;
	try {
		({ threadIds } = await request.json());
	} catch {
		return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
	}

	if (
		!Array.isArray(threadIds) ||
		threadIds.length > MAX_THREAD_STATUS_BATCH_SIZE ||
		!threadIds.every((id) => Number.isInteger(id))
	) {
		return NextResponse.json(
			{
				error: `threadIds must be an array of at most ${MAX_THREAD_STATUS_BATCH_SIZE} integers`,
			},
			{ status: 400 }
		);
	}

	try {
		const view = await getPublicViewById(viewId);
		if (!view) {
			return NextResponse.json({ error: "Public view not found" }, { status: 404 });
		}

		const threads = await getThreadsForPublicView(
			view.userId,
			view.includeArchived,
			view.characterIds,
			threadIds as number[]
		);

		const requests: ThreadStatusRequest[] = threads
			.filter((thread) => thread.PostId && thread.Characters.UrlIdentifier)
			.map((thread) => ({
				threadId: thread.ThreadId,
				postId: thread.PostId!,
				characterUrlIdentifier: thread.Characters.UrlIdentifier!,
				partnerUrlIdentifier: thread.PartnerUrlIdentifier || undefined,
				dateMarkedQueued: thread.DateMarkedQueued || undefined,
			}));

		const results = await batchCalculateThreadStatuses(requests);
		return NextResponse.json(results);
	} catch (error) {
		console.error("Error processing public view thread status:", error);
		return NextResponse.json(
			{ error: "Failed to process thread status" },
			{ status: 500 }
		);
	}
}
