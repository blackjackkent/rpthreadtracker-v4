"use client";

import { useThreadStatus } from "@/components/providers/ThreadStatusProvider";
import { RecentThreadItem } from "./RecentThreadItem";
import { useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBolt } from "@fortawesome/free-solid-svg-icons";

export function RecentActivity() {
	const { threadStatuses } = useThreadStatus();

	// Filter to Your Turn threads (not queued) and sort by most recent post date
	const recentThreads = useMemo(() => {
		const threadsArray = Array.from(threadStatuses.values());

		// Filter to "Your Turn" threads only (isCallingCharactersTurn = true, isQueued = false)
		// Also exclude threads with null lastPostDate (post not found)
		const yourTurnThreads = threadsArray.filter(
			(thread) =>
				thread.isCallingCharactersTurn &&
				!thread.isQueued &&
				thread.lastPostDate !== null
		);

		// Sort by lastPostDate descending (most recent first)
		return yourTurnThreads
			.sort((a, b) => {
				const dateA = new Date(a.lastPostDate!).getTime();
				const dateB = new Date(b.lastPostDate!).getTime();
				return dateB - dateA; // Descending order
			})
			.slice(0, 5); // Take top 5
	}, [threadStatuses]);

	if (recentThreads.length === 0) {
		return (
			<div className="bg-surface border border-border rounded-lg shadow-sm flex flex-col md:h-[400px]">
				<div className="px-4 py-3 border-b-2 border-primary bg-linear-to-r from-primary/5 to-transparent">
					<h2 className="text-lg font-semibold flex items-center gap-2">
						<FontAwesomeIcon icon={faBolt} className="w-4 h-4 text-primary" />
						<span>Recent Activity</span>
					</h2>
				</div>
				<div className="p-4">
					<p className="text-text-muted text-sm">
						You do not owe a reply on any of your threads! Nice job!
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="bg-surface border border-border rounded-lg shadow-sm flex flex-col md:h-[400px]">
			<div className="px-4 py-3 border-b-2 border-primary bg-linear-to-r from-primary/5 to-transparent">
				<h2 className="text-lg font-semibold flex items-center gap-2">
					<FontAwesomeIcon icon={faBolt} className="w-4 h-4 text-primary" />
					<span>Recent Activity</span>
				</h2>
			</div>
			<div className="flex-1 overflow-y-auto p-4">
				<div className="divide-y divide-border">
					{recentThreads.map((thread) => (
						<RecentThreadItem key={thread.threadId} thread={thread} />
					))}
				</div>
			</div>
		</div>
	);
}