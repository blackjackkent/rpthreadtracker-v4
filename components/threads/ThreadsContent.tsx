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
import { ThreadStatusWithDetails } from "@/types/tumblr";
import { ThreadsTable } from "./ThreadsTable";
import { createThreadColumns } from "./columns";
import type { ThreadFilterFunction } from "./filters";
import type { ColumnDef } from "@tanstack/react-table";

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

	// Column actions
	const columnActions = {
		onEdit: (thread: ThreadStatusWithDetails) => {
			console.log("Edit thread:", thread.threadId);
			// TODO: Open edit modal
		},
		onArchive: (threadId: number) => {
			console.log("Archive thread:", threadId);
			// TODO: Call archive server action
		},
		onUnarchive: (threadId: number) => {
			console.log("Unarchive thread:", threadId);
			// TODO: Call unarchive server action
		},
		onToggleQueue: (threadId: number) => {
			console.log("Toggle queue:", threadId);
			// TODO: Call toggle queue server action
		},
		onUntrack: (threadId: number) => {
			console.log("Untrack thread:", threadId);
			// TODO: Show confirmation dialog, call delete server action
		},
	};

	// Bulk actions
	const handleBulkArchive = () => {
		console.log("Bulk archive:", selectedThreadIds);
		// TODO: Call bulk archive server action
	};

	const handleBulkUnarchive = () => {
		console.log("Bulk unarchive:", selectedThreadIds);
		// TODO: Call bulk unarchive server action
	};

	const handleBulkToggleQueue = () => {
		console.log("Bulk toggle queue:", selectedThreadIds);
		// TODO: Call bulk toggle queue server action
	};

	const handleBulkUntrack = () => {
		console.log("Bulk untrack:", selectedThreadIds);
		// TODO: Show confirmation dialog, call bulk delete server action
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
					<button className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors inline-flex items-center gap-2">
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
		</div>
	);
};
