"use client";

import type { ThreadStatusWithDetails } from "@/types/tumblr";
import { useThreadActions } from "@/hooks/use-thread-actions";

interface RecentThreadItemProps {
	thread: ThreadStatusWithDetails;
}

export function RecentThreadItem({ thread }: RecentThreadItemProps) {
	const { untrack, archive, markQueued, pendingAction } = useThreadActions();
	const isUntracking = pendingAction === "untrack";
	const isArchiving = pendingAction === "archive";
	const isQueuing = pendingAction === "queue";

	// Format date using Intl.DateTimeFormat
	const formatDate = (dateString: string | Date) => {
		const date = new Date(dateString);
		return new Intl.DateTimeFormat("en-US", {
			month: "long",
			day: "numeric",
			year: "numeric",
			hour: "numeric",
			minute: "2-digit",
			hour12: true,
		}).format(date);
	};

	const handleUntrack = () => thread.threadId && untrack(thread.threadId);
	const handleArchive = () => thread.threadId && archive(thread.threadId);
	const handleMarkQueued = () => thread.threadId && markQueued(thread.threadId);

	return (
		<div className="py-3 first:pt-0 last:pb-0">
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
				{/* Left Column: Thread Info */}
				<div className="flex-1 min-w-0">
					<a
						href={thread.lastPostUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="font-medium text-sm text-primary hover:underline truncate block"
					>
						{thread.userTitle || "Untitled Thread"}
					</a>
					<p className="text-xs text-text-muted">
						Last Post by{" "}
						<a
							href={`https://${thread.lastPosterUrlIdentifier}.tumblr.com`}
							target="_blank"
							rel="noopener noreferrer"
							className="text-primary hover:underline"
						>
							{thread.lastPosterUrlIdentifier}
						</a>
					</p>
				</div>

				{/* Right Column: Date & Actions */}
				<div className="text-xs sm:text-right">
					<div className="text-text-muted mb-1">
						{!!thread.lastPostDate && formatDate(thread.lastPostDate)}
					</div>
					<div className="flex flex-wrap gap-1 sm:justify-end">
						<button
							onClick={handleUntrack}
							disabled={isUntracking}
							className="text-primary hover:underline disabled:opacity-50 cursor-pointer"
						>
							{isUntracking ? "Untracking..." : "Untrack"}
						</button>
						<span className="text-text-muted">•</span>
						<button
							onClick={handleArchive}
							disabled={isArchiving}
							className="text-primary hover:underline disabled:opacity-50 cursor-pointer"
						>
							{isArchiving ? "Archiving..." : "Archive"}
						</button>
						<span className="text-text-muted">•</span>
						<button
							onClick={handleMarkQueued}
							disabled={isQueuing}
							className="text-primary hover:underline disabled:opacity-50 cursor-pointer"
						>
							{isQueuing ? "Queuing..." : "Mark Queued"}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
