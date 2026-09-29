import type {
	ThreadStatusRequest,
	ThreadStatusResponse,
	ThreadStatusWithDetails,
} from "@/types/tumblr";
import type { ThreadWithCharacter } from "./db/types";
import { fetchTumblrStatusesInChunks } from "./fetch-tumblr-statuses";
import { HttpError } from "./http-error";

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
 * Helper: Calculate dashboard stats from thread statuses.
 * Pending placeholders count toward active threads but not toward any turn bucket.
 */
export function calculateStats(
	allStatuses: ThreadStatusWithDetails[]
): DashboardStats {
	let yourTurnCount = 0;
	let theirTurnCount = 0;
	let queuedCount = 0;

	for (const status of allStatuses) {
		if (status.isStatusPending) {
			continue;
		} else if (status.isQueued) {
			queuedCount++;
		} else if (status.isCallingCharactersTurn) {
			yourTurnCount++;
		} else {
			theirTurnCount++;
		}
	}

	return {
		activeThreadsCount: allStatuses.length,
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
/**
 * Merge a thread's DB data with its optional Tumblr status into a single object.
 */
function mergeThreadStatus(
	thread: ThreadWithCharacter,
	status?: ThreadStatusResponse,
	isStatusPending = false
): ThreadStatusWithDetails {
	return {
		isStatusPending,
		threadId: thread.ThreadId,
		postId: thread.PostId || "",
		lastPostDate: status?.lastPostDate ?? null,
		lastPosterUrlIdentifier: status?.lastPosterUrlIdentifier ?? "",
		lastPostUrl: status?.lastPostUrl ?? "",
		isCallingCharactersTurn: status?.isCallingCharactersTurn ?? true,
		isQueued: status?.isQueued ?? false,
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
}

export async function refreshThreadStatusesInChunks(
	_userId: string,
	onProgress?: (progress: RefreshProgress) => void,
	onChunkComplete?: (statuses: Map<number, ThreadStatusWithDetails>) => void
): Promise<RefreshResult> {
	// Fetch active threads from API (uses session authentication)
	const response = await fetch("/api/threads/active", {
		cache: "no-store",
	});

	if (!response.ok) {
		throw new HttpError("Failed to fetch active threads", response.status);
	}

	const activeThreads: ThreadWithCharacter[] = await response.json();

	// Build a lookup from threadId → thread for fast merging
	const threadLookup = new Map<number, ThreadWithCharacter>();
	for (const thread of activeThreads) {
		threadLookup.set(thread.ThreadId, thread);
	}

	const hasTumblrPost = (thread: ThreadWithCharacter) =>
		!!thread.PostId && !!thread.Characters.UrlIdentifier;

	// Emit ALL threads immediately with default status so the table
	// populates right away; Tumblr data updates them as chunks arrive
	if (onChunkComplete) {
		const initialMap = new Map<number, ThreadStatusWithDetails>();
		for (const thread of activeThreads) {
			initialMap.set(
				thread.ThreadId,
				mergeThreadStatus(thread, undefined, hasTumblrPost(thread))
			);
		}
		onChunkComplete(initialMap);
	}

	const threadsWithPostId = activeThreads.filter(hasTumblrPost);

	// If no threads to process, return result with what we have
	if (threadsWithPostId.length === 0) {
		const threadStatusesMap = new Map<number, ThreadStatusWithDetails>();
		for (const thread of activeThreads) {
			threadStatusesMap.set(thread.ThreadId, mergeThreadStatus(thread));
		}
		return { threadStatuses: threadStatusesMap };
	}

	const requests = threadsWithPostId.map(threadToRequest);
	const allStatuses = await fetchTumblrStatusesInChunks(
		requests,
		{ url: "/api/thread", toBody: (chunk) => chunk },
		onProgress,
		(chunkStatuses) => {
			if (!onChunkComplete) return;
			const chunkMap = new Map<number, ThreadStatusWithDetails>();
			for (const status of chunkStatuses) {
				if (!status.threadId) continue;
				const thread = threadLookup.get(status.threadId);
				if (thread) {
					chunkMap.set(thread.ThreadId, mergeThreadStatus(thread, status));
				}
			}
			onChunkComplete(chunkMap);
		}
	);

	// Build final complete map
	const statusMap = new Map<number, ThreadStatusResponse>();
	for (const status of allStatuses) {
		if (status.threadId) {
			statusMap.set(status.threadId, status);
		}
	}

	const threadStatusesMap = new Map<number, ThreadStatusWithDetails>();
	for (const thread of activeThreads) {
		threadStatusesMap.set(
			thread.ThreadId,
			mergeThreadStatus(thread, statusMap.get(thread.ThreadId))
		);
	}

	return { threadStatuses: threadStatusesMap };
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
			isStatusPending: cached?.isStatusPending ?? false,
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
