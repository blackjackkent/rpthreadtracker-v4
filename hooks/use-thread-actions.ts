"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
	deleteThread,
	archiveThread,
	unarchiveThread,
	toggleThreadQueued,
} from "@/app/actions/thread";
import { useThreadStatus } from "@/components/providers/ThreadStatusProvider";

export type ThreadAction = "untrack" | "archive" | "unarchive" | "queue";

interface UseThreadActionsOptions {
	onSuccess?: (threadId: number, action: ThreadAction) => void;
}

export const useThreadActions = ({ onSuccess }: UseThreadActionsOptions = {}) => {
	const router = useRouter();
	const { refreshSingleThread, removeThread } = useThreadStatus();
	const [pendingAction, setPendingAction] = useState<ThreadAction | null>(null);

	const run = async (
		action: ThreadAction,
		threadId: number,
		perform: () => Promise<void>,
		successMessage: string,
		errorMessage: string
	) => {
		setPendingAction(action);
		try {
			await perform();
			onSuccess?.(threadId, action);
			router.refresh();
			toast.success(successMessage);
		} catch (error) {
			console.error(`Error performing thread action "${action}":`, error);
			toast.error(errorMessage);
		} finally {
			setPendingAction(null);
		}
	};

	const untrack = async (threadId: number) => {
		if (
			!window.confirm(
				"Are you sure you want to untrack this thread? This action cannot be undone."
			)
		)
			return;

		await run(
			"untrack",
			threadId,
			async () => {
				await deleteThread(threadId);
				removeThread(threadId);
			},
			"Thread untracked",
			"Failed to untrack thread"
		);
	};

	const archive = (threadId: number) =>
		run(
			"archive",
			threadId,
			async () => {
				await archiveThread(threadId);
				removeThread(threadId);
			},
			"Thread archived",
			"Failed to archive thread"
		);

	const unarchive = (threadId: number) =>
		run(
			"unarchive",
			threadId,
			async () => {
				await unarchiveThread(threadId);
				await refreshSingleThread(threadId);
			},
			"Thread unarchived",
			"Failed to unarchive thread"
		);

	const toggleQueue = async (threadId: number) => {
		await toggleThreadQueued(threadId);
		await refreshSingleThread(threadId);
	};

	const toggleQueued = (threadId: number) =>
		run(
			"queue",
			threadId,
			() => toggleQueue(threadId),
			"Thread queue status updated",
			"Failed to update queue status"
		);

	// For callers that only surface unqueued threads, so the toggle always queues.
	const markQueued = (threadId: number) =>
		run(
			"queue",
			threadId,
			() => toggleQueue(threadId),
			"Thread marked as queued",
			"Failed to mark thread as queued"
		);

	return {
		untrack,
		archive,
		unarchive,
		toggleQueued,
		markQueued,
		pendingAction,
	};
};
