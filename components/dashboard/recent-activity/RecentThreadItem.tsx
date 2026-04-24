"use client";

import type { ThreadStatusWithDetails } from "@/types/tumblr";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
	deleteThread,
	archiveThread,
	toggleThreadQueued,
} from "@/app/actions/thread";
import { useThreadStatus } from "@/components/providers/ThreadStatusProvider";

interface RecentThreadItemProps {
	thread: ThreadStatusWithDetails;
}

export function RecentThreadItem({ thread }: RecentThreadItemProps) {
	const router = useRouter();
	const { refreshSingleThread, removeThread } = useThreadStatus();
	const [isUntracking, setIsUntracking] = useState(false);
	const [isArchiving, setIsArchiving] = useState(false);
	const [isQueuing, setIsQueuing] = useState(false);

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

	const handleUntrack = async () => {
		if (!thread.threadId) return;
		if (!confirm("Are you sure you want to untrack this thread? This action cannot be undone.")) return;

		setIsUntracking(true);
		try {
			await deleteThread(thread.threadId);
			removeThread(thread.threadId);
			router.refresh();
			toast.success("Thread untracked");
		} catch (error) {
			console.error("Error untracking thread:", error);
			toast.error("Failed to untrack thread");
		} finally {
			setIsUntracking(false);
		}
	};

	const handleArchive = async () => {
		if (!thread.threadId) return;

		setIsArchiving(true);
		try {
			await archiveThread(thread.threadId);
			removeThread(thread.threadId);
			router.refresh();
			toast.success("Thread archived");
		} catch (error) {
			console.error("Error archiving thread:", error);
			toast.error("Failed to archive thread");
		} finally {
			setIsArchiving(false);
		}
	};

	const handleMarkQueued = async () => {
		if (!thread.threadId) return;

		setIsQueuing(true);
		try {
			await toggleThreadQueued(thread.threadId);
			await refreshSingleThread(thread.threadId);
			router.refresh();
			toast.success("Thread marked as queued");
		} catch (error) {
			console.error("Error marking thread queued:", error);
			toast.error("Failed to mark thread as queued");
		} finally {
			setIsQueuing(false);
		}
	};

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
