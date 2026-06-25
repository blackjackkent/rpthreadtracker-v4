import type {
	TumblrPost,
	TumblrNote,
	ThreadStatusRequest,
	ThreadStatusResponse,
} from "@/types/tumblr";
import { getTumblrPostWithRetry } from "@/lib/tumblr-client";

/**
 * Get the most recent relevant reblog note from a post
 * @param post - The Tumblr post with notes
 * @param characterUrlIdentifier - The character's blog identifier
 * @param partnerUrlIdentifier - Optional partner's blog identifier
 * @returns The most recent relevant reblog note, or null if none found
 */
function getMostRecentRelevantNote(
	post: TumblrPost,
	characterUrlIdentifier: string,
	partnerUrlIdentifier?: string
): TumblrNote | null {
	if (!post.notes || post.notes.length === 0) {
		return null;
	}

	// Filter to only reblog notes
	const reblogNotes = post.notes.filter((note) => note.type === "reblog");

	if (reblogNotes.length === 0) {
		return null;
	}

	// Sort by timestamp descending (most recent first)
	reblogNotes.sort((a, b) => b.timestamp - a.timestamp);

	// If partner is specified, return the most recent reblog by character OR partner
	if (partnerUrlIdentifier) {
		const characterLower = characterUrlIdentifier.toLowerCase();
		const partnerLower = partnerUrlIdentifier.toLowerCase();

		const relevantNote = reblogNotes.find(
			(note) =>
				note.blog_name.toLowerCase() === characterLower ||
				note.blog_name.toLowerCase() === partnerLower
		);

		return relevantNote || null;
	}

	// If no partner specified, return the absolute most recent reblog
	return reblogNotes[0];
}

/**
 * Calculate thread status based on Tumblr post data
 * @param request - Thread status request with post and character info
 * @param post - The Tumblr post data (or null if not found)
 * @returns Thread status response with null date if post not found
 */
export function calculateThreadStatus(
	request: ThreadStatusRequest,
	post: TumblrPost | null
): ThreadStatusResponse {
	const { threadId, postId, characterUrlIdentifier, partnerUrlIdentifier } =
		request;

	// Handle missing post - mark as user's turn with null date
	if (!post) {
		return {
			threadId,
			postId,
			lastPostDate: null, // null indicates post not found
			lastPosterUrlIdentifier: "",
			lastPostUrl: "",
			isCallingCharactersTurn: true, // Treat as user's turn
			isQueued: false,
		};
	}

	// Get the most recent relevant reblog note
	const mostRecentNote = getMostRecentRelevantNote(
		post,
		characterUrlIdentifier,
		partnerUrlIdentifier
	);

	// Determine last post info
	const lastPostTimestamp = mostRecentNote?.timestamp || post.timestamp;
	const lastPostDate = new Date(lastPostTimestamp * 1000); // Convert Unix timestamp to JS Date
	const lastPosterUrlIdentifier = mostRecentNote?.blog_name || post.blog_name;

	// Build last post URL
	let lastPostUrl = post.post_url;
	if (mostRecentNote?.post_id) {
		lastPostUrl = `https://${mostRecentNote.blog_name}.tumblr.com/post/${mostRecentNote.post_id}`;
	}

	// Determine whose turn it is
	// If last poster is NOT the character, it's the character's turn
	const isCallingCharactersTurn =
		lastPosterUrlIdentifier.toLowerCase() !==
		characterUrlIdentifier.toLowerCase();

	// Check if queued (marked queued AFTER the last post date)
	let isQueued = false;
	if (request.dateMarkedQueued) {
		const queuedDate =
			typeof request.dateMarkedQueued === "string"
				? new Date(request.dateMarkedQueued)
				: request.dateMarkedQueued;

		// Thread is queued if marked queued AFTER the last post
		// If lastPostDate is null (post not found), treat as queued if dateMarkedQueued is set
		isQueued = lastPostDate === null || queuedDate > lastPostDate;
	}

	return {
		threadId,
		postId,
		lastPostDate,
		lastPosterUrlIdentifier,
		lastPostUrl,
		isCallingCharactersTurn,
		isQueued,
	};
}

/**
 * Run async tasks with a concurrency limit.
 */
async function withConcurrency<T>(
	tasks: (() => Promise<T>)[],
	limit: number
): Promise<T[]> {
	const results: T[] = new Array(tasks.length);
	let next = 0;

	async function worker() {
		while (next < tasks.length) {
			const i = next++;
			results[i] = await tasks[i]();
		}
	}

	await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, () => worker()));
	return results;
}

const CONCURRENCY_LIMIT = 3;

/**
 * Fetch Tumblr data and calculate statuses for a batch of threads.
 * Runs requests with limited concurrency to avoid Tumblr rate limits.
 * Used by both the authenticated API route and the public view page.
 */
export async function batchCalculateThreadStatuses(
	requests: ThreadStatusRequest[]
): Promise<ThreadStatusResponse[]> {
	const tasks = requests.map((request) => async () => {
		try {
			const post = await getTumblrPostWithRetry(
				request.characterUrlIdentifier,
				request.postId
			);
			return calculateThreadStatus(request, post);
		} catch {
			return calculateThreadStatus(request, null);
		}
	});
	return withConcurrency(tasks, CONCURRENCY_LIMIT);
}
