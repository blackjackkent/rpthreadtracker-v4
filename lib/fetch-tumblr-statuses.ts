import type {
	ThreadStatusRequest,
	ThreadStatusResponse,
} from "@/types/tumblr";

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

	const CHUNK_SIZE = 10;
	const chunks: ThreadStatusRequest[][] = [];
	for (let i = 0; i < requests.length; i += CHUNK_SIZE) {
		chunks.push(requests.slice(i, i + CHUNK_SIZE));
	}

	let completedCount = 0;

	const chunkPromises = chunks.map(async (chunk) => {
		const response = await fetch("/api/thread", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(chunk),
			cache: "no-store",
		});

		if (!response.ok) {
			throw new Error(`Failed to fetch thread statuses: ${response.status}`);
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

	const chunkResults = await Promise.all(chunkPromises);
	return chunkResults.flat();
}
