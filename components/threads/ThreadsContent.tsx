"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faPlus,
	faBoxArchive,
	faBoxOpen,
	faClock,
	faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import { ThreadStatusWithDetails } from "@/types/tumblr";
import { ThreadsTable } from "./ThreadsTable";
import { ThreadCard } from "./ThreadCard";
import { createThreadColumns } from "./columns";
import { UpsertThreadModal } from "./UpsertThreadModal";
import type { ThreadFilterFunction } from "./filters";
import type { ColumnDef } from "@tanstack/react-table";
import { useThreadStatus } from "@/components/providers/ThreadStatusProvider";
import {
	createThread,
	updateThread,
	archiveThread,
	unarchiveThread,
	toggleThreadQueued,
	deleteThread,
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
}

export const ThreadsContent = ({
	threads,
	pageTitle,
	pageDescription,
	showAddButton = false,
	isArchived = false,
	isAllThreadsPage = false,
	filterFunction,
}: ThreadsContentProps) => {
	const router = useRouter();
	const [selectedThreadIds, setSelectedThreadIds] = useState<number[]>([]);
	const [tagFilter, setTagFilter] = useState<string>("all");
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [threadToEdit, setThreadToEdit] =
		useState<ThreadStatusWithDetails | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const { refreshSingleThread, characters } = useThreadStatus();

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
				thread.tags?.some((tag) => tag.tagText === tagFilter)
			);
		}

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
				// Refresh Tumblr status for new thread
				await refreshSingleThread(result.threadId);
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
		onArchive: async (threadId: number) => {
			try {
				await archiveThread(threadId);
				router.refresh();
				toast.success("Thread archived");
			} catch (error) {
				console.error("Error archiving thread:", error);
				toast.error("Failed to archive thread");
			}
		},
		onUnarchive: async (threadId: number) => {
			try {
				await unarchiveThread(threadId);
				// Refresh Tumblr status when unarchiving
				await refreshSingleThread(threadId);
				router.refresh();
				toast.success("Thread unarchived");
			} catch (error) {
				console.error("Error unarchiving thread:", error);
				toast.error("Failed to unarchive thread");
			}
		},
		onToggleQueue: async (threadId: number) => {
			try {
				await toggleThreadQueued(threadId);
				await refreshSingleThread(threadId);
				router.refresh();
				toast.success("Thread queue status updated");
			} catch (error) {
				console.error("Error toggling queue:", error);
				toast.error("Failed to update queue status");
			}
		},
		onUntrack: async (threadId: number) => {
			if (
				window.confirm(
					"Are you sure you want to untrack this thread? This action cannot be undone."
				)
			) {
				try {
					await deleteThread(threadId);
					router.refresh();
					toast.success("Thread untracked");
				} catch (error) {
					console.error("Error deleting thread:", error);
					toast.error("Failed to untrack thread");
				}
			}
		},
	};

	// Bulk actions
	const handleBulkArchive = async () => {
		try {
			await bulkArchiveThreads(selectedThreadIds);
			router.refresh();
			toast.success(`${selectedThreadIds.length} thread(s) archived`);
			setSelectedThreadIds([]);
		} catch (error) {
			console.error("Error bulk archiving:", error);
			toast.error("Failed to archive threads");
		}
	};

	const handleBulkUnarchive = async () => {
		try {
			await bulkUnarchiveThreads(selectedThreadIds);
			router.refresh();
			toast.success(`${selectedThreadIds.length} thread(s) unarchived`);
			setSelectedThreadIds([]);
		} catch (error) {
			console.error("Error bulk unarchiving:", error);
			toast.error("Failed to unarchive threads");
		}
	};

	const handleBulkToggleQueue = async () => {
		try {
			await bulkToggleThreadsQueued(selectedThreadIds);
			router.refresh();
			toast.success(
				`Queue status updated for ${selectedThreadIds.length} thread(s)`
			);
			setSelectedThreadIds([]);
		} catch (error) {
			console.error("Error bulk toggle queue:", error);
			toast.error("Failed to update queue status");
		}
	};

	const handleBulkUntrack = async () => {
		if (
			window.confirm(
				`Are you sure you want to untrack ${selectedThreadIds.length} thread(s)? This action cannot be undone.`
			)
		) {
			try {
				await bulkDeleteThreads(selectedThreadIds);
				router.refresh();
				toast.success(`${selectedThreadIds.length} thread(s) untracked`);
				setSelectedThreadIds([]);
			} catch (error) {
				console.error("Error bulk deleting:", error);
				toast.error("Failed to untrack threads");
			}
		}
	};

	const columns = createThreadColumns(
		columnActions,
		isArchived,
		!isAllThreadsPage // Hide toggle queue on All Threads page
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
						className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors inline-flex items-center gap-2"
					>
						<FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
						Track New Thread
					</button>
				)}
			</div>

			{/* Filters and Bulk Actions */}
			<div className="flex items-center justify-between gap-4">
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

				{/* Bulk Actions */}
				{selectedThreadIds.length > 0 && (
					<div className="flex items-center gap-2">
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
								{!isAllThreadsPage && (() => {
									// Check if any selected threads have no valid Tumblr post
									const selectedThreadsWithNoPost = filteredThreads
										.filter((t) =>
											t.threadId && selectedThreadIds.includes(t.threadId)
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
					onRowSelectionChange={setSelectedThreadIds}
					initialPageSize={10} // TODO: Get from ProfileSettingsProvider when implemented
				/>
			</div>

			{/* Cards (Mobile/Tablet) */}
			<div className="lg:hidden space-y-4">
				{filteredThreads.length === 0 ? (
					<div className="text-center py-12 text-text-muted">No threads found</div>
				) : (
					filteredThreads.map((thread) => (
						<ThreadCard
							key={thread.threadId}
							thread={thread}
							isSelected={
								thread.threadId ? selectedThreadIds.includes(thread.threadId) : false
							}
							onSelect={(threadId) => {
								setSelectedThreadIds((prev) =>
									prev.includes(threadId)
										? prev.filter((id) => id !== threadId)
										: [...prev, threadId]
								);
							}}
							onEdit={columnActions.onEdit}
							onArchive={columnActions.onArchive}
							onUnarchive={columnActions.onUnarchive}
							onToggleQueue={columnActions.onToggleQueue}
							onUntrack={columnActions.onUntrack}
							isArchivedPage={isArchived}
							showToggleQueue={!isAllThreadsPage}
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
