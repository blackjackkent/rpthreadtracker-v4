import type {
	ThreadStatusRequest,
	ThreadStatusResponse,
} from "@/types/tumblr";
import { withConcurrency } from "./concurrency";
import { HttpError } from "./http-error";

const CHUNK_SIZE = 10;
// Each chunk runs up to 3 Tumblr calls server-side, so this caps a single page load at ~9 in flight
const MAX_CONCURRENT_CHUNKS = 3;

export interface FetchProgress {
	current: number;
	total: number;
}

/**
 * Fetch Tumblr statuses for a batch of threads in parallel chunks via /api/thread.
 * Client-safe — used by both the authenticated ThreadStatusProvider and public views.
 */
export async function fetchTumblrStatusesInChunks(
	requests: ThreadStatusRequest[],
	onProgress?: (progress: FetchProgress) => void,
	onChunkComplete?: (statuses: ThreadStatusResponse[]) => void
): Promise<ThreadStatusResponse[]> {
	if (requests.length === 0) return [];

	const chunks: ThreadStatusRequest[][] = [];
	for (let i = 0; i < requests.length; i += CHUNK_SIZE) {
		chunks.push(requests.slice(i, i + CHUNK_SIZE));
	}

	let completedCount = 0;

	const chunkTasks = chunks.map((chunk) => async () => {
		const response = await fetch("/api/thread", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(chunk),
			cache: "no-store",
		});

		if (!response.ok) {
			throw new HttpError(
				`Failed to fetch thread statuses: ${response.status}`,
				response.status
			);
		}

		const chunkStatuses: ThreadStatusResponse[] = await response.json();

		completedCount += chunk.length;
		onProgress?.({
			current: completedCount,
			total: requests.length,
		});
		onChunkComplete?.(chunkStatuses);

		return chunkStatuses;
	});

	const chunkResults = await withConcurrency(chunkTasks, MAX_CONCURRENT_CHUNKS);
	return chunkResults.flat();
}
