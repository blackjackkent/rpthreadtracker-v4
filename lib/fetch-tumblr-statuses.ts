import type { ThreadStatusResponse } from "@/types/tumblr";
import { withConcurrency } from "./concurrency";
import { HttpError } from "./http-error";

const CHUNK_SIZE = 10;
// Each chunk runs up to 3 Tumblr calls server-side, so this caps a single page load at ~9 in flight
const MAX_CONCURRENT_CHUNKS = 3;

export interface FetchProgress {
	current: number;
	total: number;
}

export interface ThreadStatusEndpoint<T> {
	url: string;
	toBody: (chunk: T[]) => unknown;
}

/**
 * Fetch Tumblr statuses in chunks with limited concurrency.
 * Client-safe — used by both the authenticated ThreadStatusProvider and public views,
 * which post to different endpoints with different request bodies.
 */
export async function fetchTumblrStatusesInChunks<T>(
	items: T[],
	endpoint: ThreadStatusEndpoint<T>,
	onProgress?: (progress: FetchProgress) => void,
	onChunkComplete?: (statuses: ThreadStatusResponse[]) => void
): Promise<ThreadStatusResponse[]> {
	if (items.length === 0) return [];

	const chunks: T[][] = [];
	for (let i = 0; i < items.length; i += CHUNK_SIZE) {
		chunks.push(items.slice(i, i + CHUNK_SIZE));
	}

	let completedCount = 0;

	const chunkTasks = chunks.map((chunk) => async () => {
		const response = await fetch(endpoint.url, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(endpoint.toBody(chunk)),
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
			total: items.length,
		});
		onChunkComplete?.(chunkStatuses);

		return chunkStatuses;
	});

	const chunkResults = await withConcurrency(chunkTasks, MAX_CONCURRENT_CHUNKS);
	return chunkResults.flat();
}
