"use client";

import { useState, useMemo } from "react";
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
	filterFunction?: ThreadFilterFunction;
}

export const ThreadsContent = ({
	threads,
	pageTitle,
	pageDescription,
	showAddButton = false,
	isArchived = false,
	filterFunction,
}: ThreadsContentProps) => {
	const [selectedThreadIds, setSelectedThreadIds] = useState<number[]>([]);
	const [characterFilter, setCharacterFilter] = useState<number | "all">("all");
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [threadToEdit, setThreadToEdit] = useState<ThreadStatusWithDetails | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const { refreshSingleThread } = useThreadStatus();

	// Apply filters to threads
	const filteredThreads = useMemo(() => {
		let result = threads;

		// Apply page-specific filter (Your Turn, Their Turn, etc.)
		if (filterFunction) {
			result = result.filter(filterFunction);
		}

		// Apply character filter
		if (characterFilter !== "all") {
			result = result.filter((thread) => thread.characterId === characterFilter);
		}

		return result;
	}, [threads, filterFunction, characterFilter]);

	// Extract unique characters for filter dropdown
	const characters = useMemo(() => {
		const charMap = new Map<
			number,
			{ id: number; name: string; urlIdentifier: string }
		>();

		threads.forEach((thread) => {
			if (thread.characterId) {
				charMap.set(thread.characterId, {
					id: thread.characterId,
					name: thread.characterName,
					urlIdentifier: thread.characterUrlIdentifier,
				});
			}
		});

		return Array.from(charMap.values()).sort((a, b) =>
			a.name.localeCompare(b.name)
		);
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
				toast.success("Thread unarchived");
			} catch (error) {
				console.error("Error unarchiving thread:", error);
				toast.error("Failed to unarchive thread");
			}
		},
		onToggleQueue: async (threadId: number) => {
			try {
				await toggleThreadQueued(threadId);
				toast.success("Thread queue status updated");
			} catch (error) {
				console.error("Error toggling queue:", error);
				toast.error("Failed to update queue status");
			}
		},
		onUntrack: async (threadId: number) => {
			if (window.confirm("Are you sure you want to untrack this thread? This action cannot be undone.")) {
				try {
					await deleteThread(threadId);
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
			toast.success(`Queue status updated for ${selectedThreadIds.length} thread(s)`);
			setSelectedThreadIds([]);
		} catch (error) {
			console.error("Error bulk toggle queue:", error);
			toast.error("Failed to update queue status");
		}
	};

	const handleBulkUntrack = async () => {
		if (window.confirm(`Are you sure you want to untrack ${selectedThreadIds.length} thread(s)? This action cannot be undone.`)) {
			try {
				await bulkDeleteThreads(selectedThreadIds);
				toast.success(`${selectedThreadIds.length} thread(s) untracked`);
				setSelectedThreadIds([]);
			} catch (error) {
				console.error("Error bulk deleting:", error);
				toast.error("Failed to untrack threads");
			}
		}
	};

	const columns = createThreadColumns(columnActions, isArchived) as ColumnDef<ThreadStatusWithDetails>[];

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
				{/* Character Filter */}
				<div className="flex items-center gap-2">
					<label htmlFor="character-filter" className="text-sm text-text-muted">
						Filter by character:
					</label>
					<select
						id="character-filter"
						value={characterFilter}
						onChange={(e) =>
							setCharacterFilter(
								e.target.value === "all" ? "all" : Number(e.target.value)
							)
						}
						className="px-3 py-1.5 text-sm border border-border rounded bg-surface text-text"
					>
						<option value="all">All Characters</option>
						{characters.map((char) => (
							<option key={char.id} value={char.id}>
								{char.name || char.urlIdentifier}
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
								<button
									onClick={handleBulkToggleQueue}
									className="px-3 py-1.5 text-sm bg-primary hover:bg-primary-dark text-white rounded transition-colors inline-flex items-center gap-1.5"
									title="Toggle queue for selected threads"
								>
									<FontAwesomeIcon icon={faClock} className="w-3 h-3" />
									Toggle Queue
								</button>
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

			{/* Table */}
			<ThreadsTable
				threads={filteredThreads}
				columns={columns}
				onRowSelectionChange={setSelectedThreadIds}
				initialPageSize={10} // TODO: Get from ProfileSettingsProvider when implemented
			/>

			{/* Thread Modal */}
			<UpsertThreadModal
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
