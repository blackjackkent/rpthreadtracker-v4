import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getActiveThreadsForUser } from "@/lib/db/thread";

/**
 * GET /api/threads/active
 * Fetch all active threads for the authenticated user
 *
 * @requires Authentication
 */
export async function GET() {
	// Require authentication
	const authResult = await requireAuth();
	if (authResult instanceof NextResponse) return authResult;
	const session = authResult;

	try {
		const activeThreads = await getActiveThreadsForUser(session.user.id);

		return NextResponse.json(activeThreads);
	} catch (error) {
		console.error("Error fetching active threads:", error);
		return NextResponse.json(
			{ error: "Failed to fetch active threads" },
			{ status: 500 }
		);
	}
}
