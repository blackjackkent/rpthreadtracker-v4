"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faEdit,
	faBoxArchive,
	faBoxOpen,
	faClock,
	faTrash,
	faChevronDown,
	faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { ThreadStatusWithDetails } from "@/types/tumblr";
import { ThreadStatusBadge } from "./ThreadStatusBadge";

const columnHelper = createColumnHelper<ThreadStatusWithDetails>();

interface ColumnActions {
	onEdit: (thread: ThreadStatusWithDetails) => void;
	onArchive: (threadId: number) => void;
	onUnarchive: (threadId: number) => void;
	onToggleQueue: (threadId: number) => void;
	onUntrack: (threadId: number) => void;
}

export const createThreadColumns = (
	actions: ColumnActions,
	isArchivedPage: boolean = false
) => [
	// Checkbox column for row selection
	columnHelper.display({
		id: "select",
		header: ({ table }) => (
			<input
				type="checkbox"
				checked={table.getIsAllRowsSelected()}
				ref={(el) => {
					if (el) el.indeterminate = table.getIsSomeRowsSelected();
				}}
				onChange={table.getToggleAllRowsSelectedHandler()}
				className="cursor-pointer"
			/>
		),
		cell: ({ row }) => (
			<input
				type="checkbox"
				checked={row.getIsSelected()}
				disabled={!row.getCanSelect()}
				onChange={row.getToggleSelectedHandler()}
				className="cursor-pointer"
			/>
		),
		size: 40,
	}),

	// Expander column for description/tags
	columnHelper.display({
		id: "expander",
		header: () => null,
		cell: ({ row }) => (
			<button
				onClick={row.getToggleExpandedHandler()}
				className="cursor-pointer text-text-muted hover:text-text"
			>
				{row.getIsExpanded() ? (
					<FontAwesomeIcon icon={faChevronDown} className="w-3 h-3" />
				) : (
					<FontAwesomeIcon icon={faChevronRight} className="w-3 h-3" />
				)}
			</button>
		),
		size: 40,
	}),

	// Thread Title column
	columnHelper.accessor("userTitle", {
		header: "Thread Title",
		cell: (info) => {
			const title = info.getValue();
			const postId = info.row.original.postId;
			return (
				<span className="font-medium">
					{title || postId || "Untitled Thread"}
				</span>
			);
		},
		sortingFn: (rowA, rowB) => {
			const titleA = rowA.original.userTitle || rowA.original.postId || "";
			const titleB = rowB.original.userTitle || rowB.original.postId || "";
			return titleA.localeCompare(titleB);
		},
	}),

	// Character column
	columnHelper.accessor("characterName", {
		header: "Character",
		cell: (info) => {
			const characterName = info.getValue();
			const characterUrl = info.row.original.characterUrlIdentifier;
			return <span>{characterName || characterUrl}</span>;
		},
		sortingFn: (rowA, rowB) => {
			const nameA =
				rowA.original.characterName || rowA.original.characterUrlIdentifier;
			const nameB =
				rowB.original.characterName || rowB.original.characterUrlIdentifier;
			return nameA.localeCompare(nameB);
		},
	}),

	// Partner column (Tracked Partner)
	columnHelper.accessor("partnerUrlIdentifier", {
		header: "Partner",
		cell: (info) => {
			const partner = info.getValue();
			if (!partner) return <span className="text-text-muted">-</span>;
			return <span>{partner}</span>;
		},
		sortingFn: (rowA, rowB) => {
			const partnerA = rowA.original.partnerUrlIdentifier || "";
			const partnerB = rowB.original.partnerUrlIdentifier || "";
			return partnerA.localeCompare(partnerB);
		},
	}),

	// Last Poster column (most recent poster with link to post)
	columnHelper.accessor("lastPosterUrlIdentifier", {
		header: "Last Poster",
		cell: (info) => {
			const lastPoster = info.getValue();
			const lastPostUrl = info.row.original.lastPostUrl;

			if (!lastPoster) return <span className="text-text-muted">-</span>;

			if (lastPostUrl) {
				return (
					<a
						href={lastPostUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="text-primary hover:text-primary-dark hover:underline"
					>
						{lastPoster}
					</a>
				);
			}

			return <span>{lastPoster}</span>;
		},
		sortingFn: (rowA, rowB) => {
			const posterA = rowA.original.lastPosterUrlIdentifier || "";
			const posterB = rowB.original.lastPosterUrlIdentifier || "";
			return posterA.localeCompare(posterB);
		},
	}),

	// Status column
	columnHelper.display({
		id: "status",
		header: "Status",
		cell: ({ row }) => (
			<ThreadStatusBadge
				isArchived={row.original.isArchived}
				isQueued={row.original.isQueued}
				isCallingCharactersTurn={row.original.isCallingCharactersTurn}
			/>
		),
	}),

	// Last Post Date column (with time)
	columnHelper.accessor("lastPostDate", {
		header: "Last Post",
		cell: (info) => {
			const date = info.getValue();
			if (!date) return <span className="text-text-muted">-</span>;
			return new Intl.DateTimeFormat("en-US", {
				year: "numeric",
				month: "short",
				day: "numeric",
				hour: "numeric",
				minute: "2-digit",
				hour12: true,
			}).format(new Date(date));
		},
		sortingFn: (rowA, rowB) => {
			const dateA = rowA.original.lastPostDate;
			const dateB = rowB.original.lastPostDate;
			// Handle null dates: treat them as infinitely old (smaller than any real date)
			// This way they appear last when sorting desc (newest first) and first when sorting asc (oldest first)
			if (!dateA && !dateB) return 0;
			if (!dateA) return -1; // A is null (infinitely old), comes before B
			if (!dateB) return 1; // B is null (infinitely old), comes before A
			return new Date(dateA).getTime() - new Date(dateB).getTime();
		},
	}),

	// Actions column
	columnHelper.display({
		id: "actions",
		header: "Actions",
		cell: ({ row }) => {
			const thread = row.original;
			const threadId = thread.threadId;

			if (!threadId) return null;

			return (
				<div className="flex items-center gap-2">
					{/* Edit button */}
					<button
						onClick={() => actions.onEdit(thread)}
						className="text-primary hover:text-primary-dark cursor-pointer"
						title="Edit thread"
					>
						<FontAwesomeIcon icon={faEdit} className="w-4 h-4" />
					</button>

					{/* Archive/Unarchive button */}
					{isArchivedPage ? (
						<button
							onClick={() => actions.onUnarchive(threadId)}
							className="text-primary hover:text-primary-dark cursor-pointer"
							title="Unarchive thread"
						>
							<FontAwesomeIcon icon={faBoxOpen} className="w-4 h-4" />
						</button>
					) : (
						<button
							onClick={() => actions.onArchive(threadId)}
							className="text-primary hover:text-primary-dark cursor-pointer"
							title="Archive thread"
						>
							<FontAwesomeIcon icon={faBoxArchive} className="w-4 h-4" />
						</button>
					)}

					{/* Toggle Queue button (not shown for archived threads) */}
					{!isArchivedPage && (
						<button
							onClick={() => actions.onToggleQueue(threadId)}
							className="text-primary hover:text-primary-dark cursor-pointer"
							title={thread.isQueued ? "Unqueue thread" : "Queue thread"}
						>
							<FontAwesomeIcon icon={faClock} className="w-4 h-4" />
						</button>
					)}

					{/* Untrack button */}
					<button
						onClick={() => actions.onUntrack(threadId)}
						className="text-red-500 hover:text-red-600 cursor-pointer"
						title="Untrack thread"
					>
						<FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
					</button>
				</div>
			);
		},
		size: 180,
	}),
];
