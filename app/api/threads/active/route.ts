import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getActiveThreadsForUser } from "@/lib/db";

/**
 * GET /api/threads/active
 * Fetch all active threads for the authenticated user
 */
export async function GET(request: NextRequest) {
	try {
		const session = await auth();

		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

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
