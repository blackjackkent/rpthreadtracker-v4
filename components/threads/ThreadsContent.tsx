"use client";

import { useState, useMemo, useId } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faPlus,
	faBoxArchive,
	faBoxOpen,
	faClock,
	faTrash,
	faSpinner,
	faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";
import type { RefreshProgress } from "@/lib/thread-status-service";
import { toast } from "react-toastify";
import { ThreadStatusWithDetails } from "@/types/tumblr";
import { ThreadsTable } from "./ThreadsTable";
import { ThreadCard } from "./ThreadCard";
import { createThreadColumns } from "./columns";
import { UpsertThreadModal } from "./UpsertThreadModal";
import type { ThreadFilterFunction } from "./filters";
import type { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import { useThreadStatus } from "@/components/providers/ThreadStatusProvider";
import { useThreadActions } from "@/hooks/use-thread-actions";
import {
	createThread,
	updateThread,
	bulkArchiveThreads,
	bulkUnarchiveThreads,
	bulkToggleThreadsQueued,
	bulkDeleteThreads,
} from "@/app/actions/thread";

interface ThreadsContentProps {
	threads: ThreadStatusWithDetails[];
	pageTitle: string;
	pageDescription: string;
	showAddButton?: boolean;
	isArchived?: boolean;
	isAllThreadsPage?: boolean;
	filterFunction?: ThreadFilterFunction;
	isLoadingStatuses?: boolean;
	loadingProgress?: RefreshProgress | null;
}

export const ThreadsContent = ({
	threads,
	pageTitle,
	pageDescription,
	showAddButton = false,
	isArchived = false,
	isAllThreadsPage = false,
	filterFunction,
	isLoadingStatuses = false,
	loadingProgress = null,
}: ThreadsContentProps) => {
	const emptyMessage = isLoadingStatuses
		? "Loading threads…"
		: "No threads found";
	const slowLoadingTooltipId = useId();
	const router = useRouter();
	const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
	const [tagFilter, setTagFilter] = useState<string>("all");
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [threadToEdit, setThreadToEdit] =
		useState<ThreadStatusWithDetails | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const { refreshSingleThread, removeThread, characters } = useThreadStatus();

	const selectedThreadIds = useMemo(
		() =>
			Object.entries(rowSelection)
				.filter(([, isSelected]) => isSelected)
				.map(([id]) => Number(id))
				.filter((id) => !isNaN(id)),
		[rowSelection],
	);

	const threadActions = useThreadActions({
		onSuccess: (threadId) =>
			setRowSelection((prev) => {
				const next = { ...prev };
				delete next[String(threadId)];
				return next;
			}),
	});

	// Apply filters to threads
	const filteredThreads = useMemo(() => {
		let result = threads;

		// Filter out threads for characters on hiatus
		result = result.filter((thread) => !thread.characterIsOnHiatus);

		// Apply page-specific filter (Your Turn, Their Turn, etc.)
		if (filterFunction) {
			result = result.filter(filterFunction);
		}

		// Apply tag filter
		if (tagFilter !== "all") {
			result = result.filter((thread) =>
				thread.tags?.some((tag) => tag.tagText === tagFilter),
			);
		}

		result.sort((a, b) => {
			const dateA = a.lastPostDate ? new Date(a.lastPostDate).getTime() : 0;
			const dateB = b.lastPostDate ? new Date(b.lastPostDate).getTime() : 0;
			return dateB - dateA;
		});

		return result;
	}, [threads, filterFunction, tagFilter]);

	// Extract unique tags for filter dropdown (only from threads on this page)
	const uniqueTags = useMemo(() => {
		const tagSet = new Set<string>();

		threads.forEach((thread) => {
			if (!thread.characterIsOnHiatus && thread.tags) {
				thread.tags.forEach((tag) => {
					tagSet.add(tag.tagText);
				});
			}
		});

		return Array.from(tagSet).sort();
	}, [threads]);

	// Modal handlers
	const handleOpenModal = (thread?: ThreadStatusWithDetails) => {
		setThreadToEdit(thread || null);
		setIsModalOpen(true);
	};

	const handleCloseModal = () => {
		setIsModalOpen(false);
		setThreadToEdit(null);
	};

	const handleSubmitThread = async (data: {
		characterId: number;
		postId: string;
		userTitle?: string;
		partnerUrlIdentifier?: string;
		description?: string;
		tags?: string[];
	}) => {
		setIsLoading(true);
		try {
			if (threadToEdit?.threadId) {
				// Update existing thread
				await updateThread({
					threadId: threadToEdit.threadId,
					userTitle: data.userTitle,
					partnerUrlIdentifier: data.partnerUrlIdentifier,
					description: data.description,
					tags: data.tags,
				});
				// Refresh Tumblr status for updated thread
				await refreshSingleThread(threadToEdit.threadId);
				toast.success("Thread updated successfully");
			} else {
				// Create new thread
				const result = await createThread(data);
				await refreshSingleThread(result.threadId);
				router.refresh();
				toast.success("Thread tracked successfully");
			}
		} catch (error) {
			console.error("Error saving thread:", error);
			throw error; // Let modal handle the error
		} finally {
			setIsLoading(false);
		}
	};

	// Column actions
	const columnActions = {
		onEdit: (thread: ThreadStatusWithDetails) => {
			handleOpenModal(thread);
		},
		onArchive: threadActions.archive,
		onUnarchive: threadActions.unarchive,
		onToggleQueue: threadActions.toggleQueued,
		onUntrack: threadActions.untrack,
		getPendingAction: threadActions.getPendingAction,
	};

	// Bulk actions
	const handleBulkArchive = async () => {
		try {
			await bulkArchiveThreads(selectedThreadIds);
			selectedThreadIds.forEach(removeThread);
			toast.success(`${selectedThreadIds.length} thread(s) archived`);
			setRowSelection({});
			router.refresh();
		} catch (error) {
			console.error("Error bulk archiving:", error);
			toast.error("Failed to archive threads");
		}
	};

	const handleBulkUnarchive = async () => {
		try {
			await bulkUnarchiveThreads(selectedThreadIds);
			await Promise.all(selectedThreadIds.map(refreshSingleThread));
			toast.success(`${selectedThreadIds.length} thread(s) unarchived`);
			setRowSelection({});
			router.refresh();
		} catch (error) {
			console.error("Error bulk unarchiving:", error);
			toast.error("Failed to unarchive threads");
		}
	};

	const handleBulkToggleQueue = async () => {
		try {
			await bulkToggleThreadsQueued(selectedThreadIds);
			await Promise.all(selectedThreadIds.map(refreshSingleThread));
			toast.success(
				`Queue status updated for ${selectedThreadIds.length} thread(s)`,
			);
			setRowSelection({});
			router.refresh();
		} catch (error) {
			console.error("Error bulk toggle queue:", error);
			toast.error("Failed to update queue status");
		}
	};

	const handleBulkUntrack = async () => {
		if (
			window.confirm(
				`Are you sure you want to untrack ${selectedThreadIds.length} thread(s)? This action cannot be undone.`,
			)
		) {
			try {
				await bulkDeleteThreads(selectedThreadIds);
				selectedThreadIds.forEach(removeThread);
				router.refresh();
				toast.success(`${selectedThreadIds.length} thread(s) untracked`);
				setRowSelection({});
			} catch (error) {
				console.error("Error bulk deleting:", error);
				toast.error("Failed to untrack threads");
			}
		}
	};

	const columns = createThreadColumns(
		columnActions,
		isArchived,
		!isAllThreadsPage, // Hide toggle queue on All Threads page
	) as ColumnDef<ThreadStatusWithDetails>[];

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-semibold">{pageTitle}</h1>
					<p className="text-text-muted mt-1">{pageDescription}</p>
				</div>
				{showAddButton && (
					<button
						onClick={() => handleOpenModal()}
						className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors inline-flex items-center gap-2 cursor-pointer"
					>
						<FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
						Track New Thread
					</button>
				)}
			</div>

			{/* Filters and Bulk Actions */}
			<div className="flex flex-col items-start gap-3 xl:flex-row xl:items-center xl:justify-between xl:gap-4">
				<div className="flex flex-col items-start gap-3 xl:flex-row xl:items-center xl:gap-2">
					{/* Tag Filter */}
					<div className="flex items-center gap-2">
						<label htmlFor="tag-filter" className="text-sm text-text-muted">
							Filter by tag:
						</label>
						<select
							id="tag-filter"
							value={tagFilter}
							onChange={(e) => setTagFilter(e.target.value)}
							className="px-3 py-1.5 text-sm border border-border rounded bg-surface text-text"
						>
							<option value="all">All Tags</option>
							{uniqueTags.map((tag) => (
								<option key={tag} value={tag}>
									{tag}
								</option>
							))}
						</select>
					</div>
					{isLoadingStatuses && (
						<span className="flex items-center gap-2 text-sm text-text-muted xl:ml-2 xl:whitespace-nowrap">
							<span className="flex items-center gap-2" role="status">
								<FontAwesomeIcon
									icon={faSpinner}
									className="w-3.5 h-3.5 animate-spin"
								/>
								{loadingProgress && loadingProgress.total > 0
									? `Checking ${loadingProgress.current} of ${loadingProgress.total} threads with Tumblr…`
									: "Loading…"}
							</span>
							<span className="relative group">
								<button
									type="button"
									aria-label="Why is this taking a while?"
									aria-describedby={slowLoadingTooltipId}
									className="text-text-muted hover:text-text cursor-help"
								>
									<FontAwesomeIcon
										icon={faInfoCircle}
										className="w-3.5 h-3.5"
									/>
								</button>
								<span
									id={slowLoadingTooltipId}
									role="tooltip"
									className="invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 transition-opacity absolute right-0 top-full mt-2 z-20 w-60 whitespace-normal rounded-md border border-border bg-surface px-3 py-2 text-xs text-text shadow-lg"
								>
									If this is taking a while, you may have enough threads that
									Tumblr is rate-limiting requests. The tracker will retry these
									requests automatically and should fill the remainder in
									shortly.
								</span>
							</span>
						</span>
					)}
				</div>

				{/* Bulk Actions */}
				{selectedThreadIds.length > 0 && (
					<div className="flex flex-wrap items-center gap-2">
						<span className="text-sm text-text-muted">
							{selectedThreadIds.length} selected
						</span>
						{isArchived ? (
							<button
								onClick={handleBulkUnarchive}
								className="px-3 py-1.5 text-sm bg-primary hover:bg-primary-dark text-white rounded transition-colors inline-flex items-center gap-1.5"
								title="Unarchive selected threads"
							>
								<FontAwesomeIcon icon={faBoxOpen} className="w-3 h-3" />
								Unarchive
							</button>
						) : (
							<>
								<button
									onClick={handleBulkArchive}
									className="px-3 py-1.5 text-sm bg-primary hover:bg-primary-dark text-white rounded transition-colors inline-flex items-center gap-1.5"
									title="Archive selected threads"
								>
									<FontAwesomeIcon icon={faBoxArchive} className="w-3 h-3" />
									Archive
								</button>
								{!isAllThreadsPage &&
									(() => {
										// Check if any selected threads have no valid Tumblr post
										const selectedThreadsWithNoPost = filteredThreads
											.filter(
												(t) =>
													t.threadId && selectedThreadIds.includes(t.threadId),
											)
											.some((t) => !t.lastPostDate);

										return (
											<button
												onClick={handleBulkToggleQueue}
												disabled={selectedThreadsWithNoPost}
												className={
													selectedThreadsWithNoPost
														? "px-3 py-1.5 text-sm bg-text-muted text-white rounded opacity-50 cursor-not-allowed inline-flex items-center gap-1.5"
														: "px-3 py-1.5 text-sm bg-primary hover:bg-primary-dark text-white rounded transition-colors inline-flex items-center gap-1.5"
												}
												title={
													selectedThreadsWithNoPost
														? "Cannot queue - some selected threads not found on Tumblr"
														: "Toggle queue for selected threads"
												}
											>
												<FontAwesomeIcon icon={faClock} className="w-3 h-3" />
												Toggle Queue
											</button>
										);
									})()}
							</>
						)}
						<button
							onClick={handleBulkUntrack}
							className="px-3 py-1.5 text-sm bg-red-500 hover:bg-red-600 text-white rounded transition-colors inline-flex items-center gap-1.5"
							title="Untrack selected threads"
						>
							<FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
							Untrack
						</button>
					</div>
				)}
			</div>

			{/* Table (Desktop) */}
			<div className="hidden lg:block">
				<ThreadsTable
					threads={filteredThreads}
					columns={columns}
					rowSelection={rowSelection}
					onRowSelectionChange={setRowSelection}
					emptyMessage={emptyMessage}
				/>
			</div>

			{/* Cards (Mobile/Tablet) */}
			<div className="lg:hidden space-y-4">
				{filteredThreads.length === 0 ? (
					<div className="text-center py-12 text-text-muted">
						{emptyMessage}
					</div>
				) : (
					filteredThreads.map((thread) => (
						<ThreadCard
							key={thread.threadId}
							thread={thread}
							isSelected={
								thread.threadId
									? selectedThreadIds.includes(thread.threadId)
									: false
							}
							onSelect={(threadId) => {
								setRowSelection((prev) => {
									const next = { ...prev };
									if (next[String(threadId)]) {
										delete next[String(threadId)];
									} else {
										next[String(threadId)] = true;
									}
									return next;
								});
							}}
							onEdit={columnActions.onEdit}
							onArchive={columnActions.onArchive}
							onUnarchive={columnActions.onUnarchive}
							onToggleQueue={columnActions.onToggleQueue}
							onUntrack={columnActions.onUntrack}
							isArchivedPage={isArchived}
							showToggleQueue={!isAllThreadsPage}
							pendingAction={threadActions.getPendingAction(thread.threadId)}
						/>
					))
				)}
			</div>

			{/* Thread Modal */}
			<UpsertThreadModal
				key={isModalOpen ? "add-thread" : "thread-closed"}
				isOpen={isModalOpen}
				onClose={handleCloseModal}
				onSubmit={handleSubmitThread}
				threadToEdit={threadToEdit}
				characters={characters}
				isLoading={isLoading}
			/>
		</div>
	);
};
