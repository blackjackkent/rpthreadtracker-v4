"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
	useReactTable,
	getCoreRowModel,
	getSortedRowModel,
	getPaginationRowModel,
	SortingState,
	ColumnDef,
	createColumnHelper,
	flexRender,
} from "@tanstack/react-table";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExternalLinkAlt, faSpinner } from "@fortawesome/free-solid-svg-icons";
import type { PublicView } from "@/lib/db/public-view";
import { fetchTumblrStatusesInChunks } from "@/lib/fetch-tumblr-statuses";
import type { ThreadStatusRequest } from "@/types/tumblr";

export interface PublicViewThread {
	threadId: number;
	postId: string;
	lastPostDate: string | null;
	lastPosterUrlIdentifier: string;
	lastPostUrl: string;
	isCallingCharactersTurn: boolean;
	isQueued: boolean;
	userTitle: string | null;
	characterName: string;
	characterUrlIdentifier: string;
	partnerUrlIdentifier: string | null;
	dateMarkedQueued: string | null;
	isArchived: boolean;
	description: string | null;
	characterId: number;
	characterIsOnHiatus: boolean;
	tags: { tagId: string; tagText: string; threadId: number }[];
}

interface PublicViewContentProps {
	view: PublicView;
	threads: PublicViewThread[];
}

function getThreadStatus(thread: PublicViewThread): string {
	if (thread.isArchived) return "archived";
	if (thread.isQueued) return "queued";
	if (thread.isCallingCharactersTurn) return "myTurn";
	return "theirTurn";
}

function formatDate(dateStr: string | null): string {
	if (!dateStr) return "—";
	return new Intl.DateTimeFormat("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
	}).format(new Date(dateStr));
}

function StatusBadge({ thread }: { thread: PublicViewThread }) {
	if (thread.isArchived) {
		return (
			<span className="px-2 py-0.5 text-xs rounded-full bg-border/50 text-text-muted">
				Archived
			</span>
		);
	}
	if (thread.isQueued) {
		return (
			<span className="px-2 py-0.5 text-xs rounded-full bg-yellow-500/20 text-yellow-400">
				Queued
			</span>
		);
	}
	if (thread.isCallingCharactersTurn) {
		return (
			<span className="px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400">
				My Turn
			</span>
		);
	}
	return (
		<span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-400">
			Their Turn
		</span>
	);
}

const columnHelper = createColumnHelper<PublicViewThread>();

function buildColumns(enabledColumns: string[]): ColumnDef<PublicViewThread>[] {
	const cols: ColumnDef<PublicViewThread>[] = [];

	if (enabledColumns.includes("threadTitle")) {
		cols.push(
			columnHelper.accessor("userTitle", {
				id: "threadTitle",
				header: "Thread Title",
				cell: ({ row }) => (
					<div>
						<span className="font-medium">
							{row.original.userTitle || (
								<span className="text-text-muted italic">Untitled</span>
							)}
						</span>
						{row.original.lastPostUrl && (
							<a
								href={row.original.lastPostUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="ml-2 text-primary hover:text-primary-light"
								onClick={(e) => e.stopPropagation()}
							>
								<FontAwesomeIcon icon={faExternalLinkAlt} className="w-3 h-3" />
							</a>
						)}
					</div>
				),
				sortingFn: (a, b) =>
					(a.original.userTitle || "").localeCompare(
						b.original.userTitle || "",
					),
			}) as ColumnDef<PublicViewThread>,
		);
	}

	if (enabledColumns.includes("character")) {
		cols.push(
			columnHelper.accessor("characterName", {
				id: "character",
				header: "Character",
				cell: ({ row }) => (
					<span>
						{row.original.characterName || row.original.characterUrlIdentifier}
					</span>
				),
				sortingFn: (a, b) =>
					(
						a.original.characterName || a.original.characterUrlIdentifier
					).localeCompare(
						b.original.characterName || b.original.characterUrlIdentifier,
					),
			}) as ColumnDef<PublicViewThread>,
		);
	}

	if (enabledColumns.includes("partner")) {
		cols.push(
			columnHelper.accessor("partnerUrlIdentifier", {
				id: "partner",
				header: "Partner",
				cell: ({ row }) => (
					<span className="text-text-muted">
						{row.original.partnerUrlIdentifier || "—"}
					</span>
				),
				sortingFn: (a, b) =>
					(a.original.partnerUrlIdentifier || "").localeCompare(
						b.original.partnerUrlIdentifier || "",
					),
			}) as ColumnDef<PublicViewThread>,
		);
	}

	if (enabledColumns.includes("lastPostDate")) {
		cols.push(
			columnHelper.accessor("lastPostDate", {
				id: "lastPostDate",
				header: "Last Post Date",
				cell: ({ row }) => (
					<span className="text-text-muted whitespace-nowrap">
						{formatDate(row.original.lastPostDate)}
					</span>
				),
				sortingFn: (a, b) => {
					const dateA = a.original.lastPostDate
						? new Date(a.original.lastPostDate).getTime()
						: 0;
					const dateB = b.original.lastPostDate
						? new Date(b.original.lastPostDate).getTime()
						: 0;
					return dateA - dateB;
				},
			}) as ColumnDef<PublicViewThread>,
		);
	}

	if (enabledColumns.includes("status")) {
		cols.push(
			columnHelper.display({
				id: "status",
				header: "Status",
				cell: ({ row }) => <StatusBadge thread={row.original} />,
				enableSorting: false,
			}) as ColumnDef<PublicViewThread>,
		);
	}

	return cols;
}

export const PublicViewContent = ({
	view,
	threads,
}: PublicViewContentProps) => {
	const [enrichedThreads, setEnrichedThreads] = useState(threads);
	const [isLoading, setIsLoading] = useState(true);
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [sorting, setSorting] = useState<SortingState>([
		{ id: view.sortKey, desc: view.sortDescending },
	]);

	const fetchStatuses = useCallback(async () => {
		const requests: ThreadStatusRequest[] = threads
			.filter((t) => t.postId && t.characterUrlIdentifier)
			.map((t) => ({
				threadId: t.threadId,
				postId: t.postId,
				characterUrlIdentifier: t.characterUrlIdentifier,
				partnerUrlIdentifier: t.partnerUrlIdentifier || undefined,
				dateMarkedQueued: t.dateMarkedQueued || undefined,
			}));

		if (requests.length === 0) {
			setIsLoading(false);
			return;
		}

		try {
			const statuses = await fetchTumblrStatusesInChunks(requests);
			const statusMap = new Map(
				statuses.filter((s) => s.threadId).map((s) => [s.threadId!, s])
			);

			setEnrichedThreads(
				threads.map((t) => {
					const status = statusMap.get(t.threadId);
					if (!status) return t;
					return {
						...t,
						lastPostDate: status.lastPostDate ? String(status.lastPostDate) : null,
						lastPosterUrlIdentifier: status.lastPosterUrlIdentifier,
						lastPostUrl: status.lastPostUrl,
						isCallingCharactersTurn: status.isCallingCharactersTurn,
						isQueued: status.isQueued,
					};
				})
			);
		} catch {
			// On failure, keep the default thread data
		} finally {
			setIsLoading(false);
		}
	}, [threads]);

	useEffect(() => {
		fetchStatuses();
	}, [fetchStatuses]);

	// Build available filter options based on view config
	const filterOptions = useMemo(() => {
		const opts: { value: string; label: string }[] = [
			{ value: "all", label: "Show All" },
		];
		if (view.includeMyTurn)
			opts.push({ value: "myTurn", label: "Show Only My Turn" });
		if (view.includeTheirTurn)
			opts.push({ value: "theirTurn", label: "Show Only Partner's Turn" });
		if (view.includeQueued)
			opts.push({ value: "queued", label: "Show Only Queued" });
		if (view.includeArchived)
			opts.push({ value: "archived", label: "Show Only Archived" });
		return opts;
	}, [view]);

	// Pre-filter threads by status selection
	const filteredThreads = useMemo(() => {
		if (statusFilter === "all") return enrichedThreads;
		return enrichedThreads.filter((t) => getThreadStatus(t) === statusFilter);
	}, [enrichedThreads, statusFilter]);

	const columns = useMemo(() => buildColumns(view.columns), [view.columns]);

	const table = useReactTable({
		data: filteredThreads,
		columns,
		state: { sorting },
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getRowId: (row) => String(row.threadId),
		initialState: {
			pagination: { pageSize: 25 },
		},
	});

	return (
		<div className="space-y-4">
			{isLoading && (
				<div className="flex items-center gap-2 text-sm text-text-muted">
					<FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />
					Loading thread statuses…
				</div>
			)}

			{/* Status Filter Dropdown */}
			{filterOptions.length > 1 && (
				<div className="flex items-center gap-2">
					<select
						value={statusFilter}
						onChange={(e) => {
							setStatusFilter(e.target.value);
							table.setPageIndex(0);
						}}
						className="px-3 py-1.5 text-sm border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
					>
						{filterOptions.map((opt) => (
							<option key={opt.value} value={opt.value}>
								{opt.label}
							</option>
						))}
					</select>
				</div>
			)}

			{/* Table */}
			<div className="overflow-x-auto border border-border rounded-lg">
				<table className="min-w-full divide-y divide-border">
					<thead className="bg-surface">
						{table.getHeaderGroups().map((headerGroup) => (
							<tr key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									const sortDirection = header.column.getIsSorted();
									return (
										<th
											key={header.id}
											className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider relative"
											style={{
												width:
													header.getSize() !== 150
														? header.getSize()
														: undefined,
											}}
										>
											{sortDirection === "asc" && (
												<div className="absolute top-0 left-0 right-0 h-0.5 bg-primary" />
											)}
											{sortDirection === "desc" && (
												<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
											)}
											{header.isPlaceholder ? null : (
												<div
													className={
														header.column.getCanSort()
															? "cursor-pointer select-none"
															: ""
													}
													onClick={header.column.getToggleSortingHandler()}
												>
													{flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
												</div>
											)}
										</th>
									);
								})}
							</tr>
						))}
					</thead>
					<tbody className="bg-surface divide-y divide-border">
						{table.getRowModel().rows.map((row) => (
							<tr key={row.id} className="hover:bg-background/50">
								{row.getVisibleCells().map((cell) => (
									<td key={cell.id} className="px-4 py-3 text-sm text-text">
										{flexRender(
											cell.column.columnDef.cell,
											cell.getContext(),
										)}
									</td>
								))}
							</tr>
						))}
						{table.getRowModel().rows.length === 0 && (
							<tr>
								<td
									colSpan={columns.length}
									className="px-4 py-8 text-center text-text-muted"
								>
									No threads found
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>

			{/* Pagination */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<span className="text-sm text-text-muted">
						Page {table.getState().pagination.pageIndex + 1} of{" "}
						{table.getPageCount()}
					</span>
					<select
						value={table.getState().pagination.pageSize}
						onChange={(e) => table.setPageSize(Number(e.target.value))}
						className="px-2 py-1 text-sm border border-border rounded bg-surface text-text"
					>
						{[10, 25, 50, 100].map((pageSize) => (
							<option key={pageSize} value={pageSize}>
								Show {pageSize}
							</option>
						))}
					</select>
				</div>
				<div className="flex gap-2">
					<button
						onClick={() => table.previousPage()}
						disabled={!table.getCanPreviousPage()}
						className="px-3 py-1 text-sm border cursor-pointer border-border rounded bg-surface text-text disabled:opacity-50 disabled:cursor-not-allowed hover:bg-background"
					>
						Previous
					</button>
					<button
						onClick={() => table.nextPage()}
						disabled={!table.getCanNextPage()}
						className="px-3 py-1 text-sm border cursor-pointer border-border rounded bg-surface text-text disabled:opacity-50 disabled:cursor-not-allowed hover:bg-background"
					>
						Next
					</button>
				</div>
			</div>
		</div>
	);
};
