/**
 * Run async tasks with at most `limit` in flight at once. Results keep task order.
 */
export async function withConcurrency<T>(
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

	await Promise.all(
		Array.from({ length: Math.min(limit, tasks.length) }, () => worker())
	);
	return results;
}
