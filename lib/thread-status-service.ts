import type {
	ThreadStatusRequest,
	ThreadStatusResponse,
	ThreadStatusWithDetails,
} from "@/types/tumblr";
import { getActiveThreadsForUser } from "./db/thread";
import { ThreadWithCharacter } from "./db/types";
import { fetchTumblrStatusesInChunks } from "./fetch-tumblr-statuses";

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
	threadStatuses: Map<number, ThreadStatusWithDetails>;
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
export function calculateStats(
	allStatuses: ThreadStatusResponse[],
	totalThreadCount: number
): DashboardStats {
	let yourTurnCount = 0;
	let theirTurnCount = 0;
	let queuedCount = 0;

	for (const status of allStatuses) {
		if (status.isQueued) {
			queuedCount++;
		} else if (status.isCallingCharactersTurn) {
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
	_userId: string,
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

	const requests = threadsWithPostId.map(threadToRequest);
	const allStatuses = await fetchTumblrStatusesInChunks(requests, onProgress);

	// Build status lookup map
	const statusMap = new Map<number, ThreadStatusResponse>();
	for (const status of allStatuses) {
		if (status.threadId) {
			statusMap.set(status.threadId, status);
		}
	}

	// Build thread statuses map - loop through all threads
	const threadStatusesMap = new Map<number, ThreadStatusWithDetails>();
	for (const thread of activeThreads) {
		const status = statusMap.get(thread.ThreadId);

		const mergedStatus: ThreadStatusWithDetails = {
			// Tumblr status (if available, otherwise defaults)
			threadId: thread.ThreadId,
			postId: thread.PostId || "",
			lastPostDate: status?.lastPostDate ?? null,
			lastPosterUrlIdentifier: status?.lastPosterUrlIdentifier ?? "",
			lastPostUrl: status?.lastPostUrl ?? "",
			isCallingCharactersTurn: status?.isCallingCharactersTurn ?? true, // Default to "Your Turn" if no status
			isQueued: status?.isQueued ?? false,
			// Database fields
			userTitle: thread.UserTitle,
			characterName: thread.Characters.CharacterName || "",
			characterUrlIdentifier: thread.Characters.UrlIdentifier || "",
			partnerUrlIdentifier: thread.PartnerUrlIdentifier,
			dateMarkedQueued: thread.DateMarkedQueued,
			isArchived: thread.IsArchived,
			description: thread.Description,
			characterId: thread.Characters.CharacterId,
			characterIsOnHiatus: thread.Characters.IsOnHiatus,
			tags: thread.ThreadTags?.map((tag) => ({
				tagId: tag.TagID,
				tagText: tag.TagText,
				threadId: tag.ThreadID || 0,
			})),
		};
		threadStatusesMap.set(thread.ThreadId, mergedStatus);
	}

	// Calculate dashboard stats from the full merged map (includes no-PostId threads with defaults)
	const dashboardStats = calculateStats(
		Array.from(threadStatusesMap.values()),
		activeThreadsCount
	);

	return {
		threadStatuses: threadStatusesMap,
		dashboardStats,
	};
}

/**
 * Re-fetch thread metadata from the database and patch cached entries.
 * Preserves existing Tumblr status data (lastPostDate, turn, etc.)
 * while updating DB fields (tags, title, description, etc.).
 */
export async function refreshThreadMetadata(
	existing: Map<number, ThreadStatusWithDetails>
): Promise<Map<number, ThreadStatusWithDetails>> {
	const response = await fetch("/api/threads/active", {
		cache: "no-store",
	});

	if (!response.ok) {
		throw new Error("Failed to fetch active threads");
	}

	const activeThreads: ThreadWithCharacter[] = await response.json();
	const updated = new Map<number, ThreadStatusWithDetails>();

	for (const thread of activeThreads) {
		const cached = existing.get(thread.ThreadId);
		updated.set(thread.ThreadId, {
			threadId: thread.ThreadId,
			postId: thread.PostId || "",
			lastPostDate: cached?.lastPostDate ?? null,
			lastPosterUrlIdentifier: cached?.lastPosterUrlIdentifier ?? "",
			lastPostUrl: cached?.lastPostUrl ?? "",
			isCallingCharactersTurn: cached?.isCallingCharactersTurn ?? true,
			isQueued: cached?.isQueued ?? false,
			userTitle: thread.UserTitle,
			characterName: thread.Characters.CharacterName || "",
			characterUrlIdentifier: thread.Characters.UrlIdentifier || "",
			partnerUrlIdentifier: thread.PartnerUrlIdentifier,
			dateMarkedQueued: thread.DateMarkedQueued,
			isArchived: thread.IsArchived,
			description: thread.Description,
			characterId: thread.Characters.CharacterId,
			characterIsOnHiatus: thread.Characters.IsOnHiatus,
			tags: thread.ThreadTags?.map((tag) => ({
				tagId: tag.TagID,
				tagText: tag.TagText,
				threadId: tag.ThreadID || 0,
			})),
		});
	}

	return updated;
}

/**
 * Fetch status for a single thread
 * Used after creating/updating a thread to get fresh Tumblr data
 * @param threadId - The thread ID to refresh
 * @returns Thread status with details
 */
export async function refreshSingleThreadStatus(
	threadId: number
): Promise<ThreadStatusWithDetails | null> {
	try {
		// Fetch the thread from the database
		const response = await fetch(`/api/threads/active`, {
			cache: "no-store",
		});

		if (!response.ok) {
			throw new Error("Failed to fetch active threads");
		}

		const activeThreads: ThreadWithCharacter[] = await response.json();

		// Find the specific thread
		const thread = activeThreads.find((t) => t.ThreadId === threadId);

		if (!thread) {
			console.error("Thread not found:", threadId);
			return null;
		}

		// If thread doesn't have PostId, return basic data without Tumblr status
		if (!thread.PostId || !thread.Characters.UrlIdentifier) {
			return {
				threadId: thread.ThreadId,
				postId: thread.PostId || "",
				userTitle: thread.UserTitle,
				characterName: thread.Characters.CharacterName || "",
				characterUrlIdentifier: thread.Characters.UrlIdentifier || "",
				partnerUrlIdentifier: thread.PartnerUrlIdentifier,
				dateMarkedQueued: thread.DateMarkedQueued,
				isArchived: thread.IsArchived,
				description: thread.Description,
				characterId: thread.Characters.CharacterId,
				characterIsOnHiatus: thread.Characters.IsOnHiatus,
				tags: thread.ThreadTags?.map((tag) => ({
					tagId: tag.TagID,
					tagText: tag.TagText,
					threadId: tag.ThreadID || 0,
				})),
				// No Tumblr data
				lastPostDate: null,
				lastPosterUrlIdentifier: "",
				lastPostUrl: "",
				isCallingCharactersTurn: true,
				isQueued: false,
			};
		}

		// Fetch Tumblr status for this thread
		const threadRequest: ThreadStatusRequest = threadToRequest(thread);

		const statusResponse = await fetch("/api/thread", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify([threadRequest]),
			cache: "no-store",
		});

		if (!statusResponse.ok) {
			throw new Error("Failed to fetch thread status from Tumblr");
		}

		const statuses: ThreadStatusResponse[] = await statusResponse.json();
		const status = statuses[0];

		if (!status) {
			throw new Error("No status returned from API");
		}

		// Merge status with thread details
		const mergedStatus: ThreadStatusWithDetails = {
			...status,
			// Database fields
			userTitle: thread.UserTitle,
			characterName: thread.Characters.CharacterName || "",
			characterUrlIdentifier: thread.Characters.UrlIdentifier || "",
			partnerUrlIdentifier: thread.PartnerUrlIdentifier,
			dateMarkedQueued: thread.DateMarkedQueued,
			isArchived: thread.IsArchived,
			description: thread.Description,
			characterId: thread.Characters.CharacterId,
			characterIsOnHiatus: thread.Characters.IsOnHiatus,
			tags: thread.ThreadTags?.map((tag) => ({
				tagId: tag.TagID,
				tagText: tag.TagText,
				threadId: tag.ThreadID || 0,
			})),
		};

		return mergedStatus;
	} catch (error) {
		console.error("Error refreshing single thread status:", error);
		return null;
	}
}
