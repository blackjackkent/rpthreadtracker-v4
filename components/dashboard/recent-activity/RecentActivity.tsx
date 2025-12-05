"use client";

import { useThreadStatus } from "@/components/providers/ThreadStatusProvider";
import { RecentThreadItem } from "./RecentThreadItem";
import { useMemo } from "react";

export function RecentActivity() {
	const { threadStatuses } = useThreadStatus();

	// Sort threads by most recent post date
	const recentThreads = useMemo(() => {
		const threadsArray = Array.from(threadStatuses.values());

		// Sort by lastPostDate descending (most recent first)
		return threadsArray
			.sort((a, b) => {
				const dateA = new Date(a.lastPostDate).getTime();
				const dateB = new Date(b.lastPostDate).getTime();
				return dateB - dateA; // Descending order
			})
			.slice(0, 10); // Take top 10
	}, [threadStatuses]);

	if (recentThreads.length === 0) {
		return (
			<div className="bg-surface border border-border rounded-lg p-6">
				<h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
				<p className="text-text-muted text-sm">
					No recent thread activity. Start tracking threads to see them here!
				</p>
			</div>
		);
	}

	return (
		<div className="bg-surface border border-border rounded-lg p-6">
			<h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
			<div className="space-y-3">
				{recentThreads.map((thread) => (
					<RecentThreadItem key={thread.threadId} thread={thread} />
				))}
			</div>
		</div>
	);
}