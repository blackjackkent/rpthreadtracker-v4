import { getActiveThreadsForUser } from "@/lib/db";
import type {
	ThreadStatusRequest,
	ThreadStatusResponse,
} from "@/types/tumblr";

export interface DashboardStats {
	activeThreadsCount: number;
	yourTurnCount: number;
	theirTurnCount: number;
	queuedCount: number;
}

/**
 * Fetch all dashboard statistics for a user
 * Includes active thread count, your turn count, their turn count, and queued count
 * @param userId - The user's ID
 * @returns Dashboard statistics
 */
export async function getDashboardStats(
	userId: string
): Promise<DashboardStats> {
	// Fetch active threads
	const activeThreads = await getActiveThreadsForUser(userId);

	const activeThreadsCount = activeThreads.length;

	// Filter to threads that have a PostId and character identifier
	const threadsWithPostId = activeThreads.filter(
		(thread) => thread.PostId && thread.Characters.UrlIdentifier
	);

	// If no threads with PostId, return basic counts
	if (threadsWithPostId.length === 0) {
		return {
			activeThreadsCount,
			yourTurnCount: 0,
			theirTurnCount: 0,
			queuedCount: 0,
		};
	}

	try {
		// Build batch request for thread API
		const threadRequests: ThreadStatusRequest[] = threadsWithPostId.map(
			(thread) => ({
				threadId: thread.ThreadId,
				postId: thread.PostId!,
				characterUrlIdentifier: thread.Characters.UrlIdentifier!,
				partnerUrlIdentifier: thread.PartnerUrlIdentifier || undefined,
				dateMarkedQueued: thread.DateMarkedQueued || undefined,
			})
		);

		// Call the thread status API
		const response = await fetch(
			`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/thread`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(threadRequests),
				cache: "no-store", // Don't cache API calls
			}
		);

		if (!response.ok) {
			console.error(
				"Failed to fetch thread statuses:",
				response.status,
				response.statusText
			);
			return {
				activeThreadsCount,
				yourTurnCount: 0,
				theirTurnCount: 0,
				queuedCount: 0,
			};
		}

		const threadStatuses: ThreadStatusResponse[] = await response.json();

		// Count Your Turn, Their Turn, and Queued
		let yourTurnCount = 0;
		let theirTurnCount = 0;
		let queuedCount = 0;

		for (const status of threadStatuses) {
			if (status.isQueued) {
				queuedCount++;
			} else if (status.isCallingCharactersTurn) {
				yourTurnCount++;
			} else {
				theirTurnCount++;
			}
		}

		return {
			activeThreadsCount,
			yourTurnCount,
			theirTurnCount,
			queuedCount,
		};
	} catch (error) {
		console.error("Error fetching thread statuses:", error);
		return {
			activeThreadsCount,
			yourTurnCount: 0,
			theirTurnCount: 0,
			queuedCount: 0,
		};
	}
}
