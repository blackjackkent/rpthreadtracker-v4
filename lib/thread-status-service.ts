import type { ThreadStatusRequest, ThreadStatusResponse } from "@/types/tumblr";
import { getActiveThreadsForUser } from "./db/thread";
import { ThreadWithCharacter } from "./db/types";

export interface DashboardStats {
	activeThreadsCount: number;
	yourTurnCount: number;
	theirTurnCount: number;
	queuedCount: number;
}

export interface RefreshProgress {
	current: number;
	total: number;
}

export interface RefreshResult {
	threadStatuses: Map<number, ThreadStatusResponse>;
	dashboardStats: DashboardStats;
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

/**
 * Helper: Convert thread data to API request format
 */
function threadToRequest(thread: ThreadWithCharacter): ThreadStatusRequest {
	return {
		threadId: thread.ThreadId,
		postId: thread.PostId!,
		characterUrlIdentifier: thread.Characters.UrlIdentifier!,
		partnerUrlIdentifier: thread.PartnerUrlIdentifier || undefined,
		dateMarkedQueued: thread.DateMarkedQueued || undefined,
	};
}

/**
 * Helper: Calculate dashboard stats from thread statuses
 */
function calculateStats(
	allStatuses: ThreadStatusResponse[],
	totalThreadCount: number
): DashboardStats {
	let yourTurnCount = 0;
	let theirTurnCount = 0;
	let queuedCount = 0;

	for (const status of allStatuses) {
		if (status.isQueued) {
			queuedCount++;
		}
		if (status.isCallingCharactersTurn) {
			yourTurnCount++;
		} else {
			theirTurnCount++;
		}
	}

	return {
		activeThreadsCount: totalThreadCount,
		yourTurnCount,
		theirTurnCount,
		queuedCount,
	};
}

/**
 * Fetch thread statuses in chunks with progress callback
 * Chunks are processed in parallel for performance
 * @param userId - The user's ID (not used, fetches from session via API)
 * @param onProgress - Callback for progress updates
 * @returns Thread statuses map and dashboard stats
 */
export async function refreshThreadStatusesInChunks(
	userId: string,
	onProgress?: (progress: RefreshProgress) => void
): Promise<RefreshResult> {
	// Fetch active threads from API (uses session authentication)
	const response = await fetch("/api/threads/active", {
		cache: "no-store",
	});

	if (!response.ok) {
		throw new Error("Failed to fetch active threads");
	}

	const activeThreads: ThreadWithCharacter[] = await response.json();

	const activeThreadsCount = activeThreads.length;

	// Filter to threads with PostId
	const threadsWithPostId = activeThreads.filter(
		(thread) => thread.PostId && thread.Characters.UrlIdentifier
	);

	// If no threads to process, return empty result
	if (threadsWithPostId.length === 0) {
		return {
			threadStatuses: new Map(),
			dashboardStats: {
				activeThreadsCount,
				yourTurnCount: 0,
				theirTurnCount: 0,
				queuedCount: 0,
			},
		};
	}

	// Split into chunks of 10
	const CHUNK_SIZE = 10;
	const chunks: ThreadWithCharacter[][] = [];
	for (let i = 0; i < threadsWithPostId.length; i += CHUNK_SIZE) {
		chunks.push(threadsWithPostId.slice(i, i + CHUNK_SIZE));
	}

	// Track completed chunks for progress
	let completedCount = 0;

	// Process all chunks in parallel
	const chunkPromises = chunks.map(async (chunk) => {
		const chunkRequests = chunk.map(threadToRequest);

		try {
			const response = await fetch("/api/thread", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(chunkRequests),
				cache: "no-store",
			});

			if (!response.ok) {
				throw new Error(`Failed to fetch thread statuses: ${response.status}`);
			}

			const chunkStatuses: ThreadStatusResponse[] = await response.json();

			// Update progress
			completedCount += chunk.length;
			if (onProgress) {
				onProgress({
					current: completedCount,
					total: threadsWithPostId.length,
				});
			}
			return chunkStatuses;
		} catch (error) {
			console.error("Error fetching chunk:", error);
			throw error; // Re-throw to propagate the error up
		}
	});

	// Wait for all chunks to complete
	const chunkResults = await Promise.all(chunkPromises);

	// Flatten all results
	const allStatuses = chunkResults.flat();

	// Build thread statuses map
	const threadStatusesMap = new Map<number, ThreadStatusResponse>();
	for (const status of allStatuses) {
		if (status.threadId) {
			threadStatusesMap.set(status.threadId, status);
		}
	}

	// Calculate dashboard stats
	const dashboardStats = calculateStats(allStatuses, activeThreadsCount);

	return {
		threadStatuses: threadStatusesMap,
		dashboardStats,
	};
}
