"use client";

import { useState, Fragment } from "react";
import {
	useReactTable,
	getCoreRowModel,
	getSortedRowModel,
	getPaginationRowModel,
	getExpandedRowModel,
	SortingState,
	ColumnDef,
	flexRender,
	RowSelectionState,
} from "@tanstack/react-table";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSort, faSortUp, faSortDown } from "@fortawesome/free-solid-svg-icons";
import { ThreadStatusWithDetails } from "@/types/tumblr";
import { ThreadExpandedRow } from "./ThreadExpandedRow";

interface ThreadsTableProps {
	threads: ThreadStatusWithDetails[];
	columns: ColumnDef<ThreadStatusWithDetails, any>[];
	onRowSelectionChange?: (selectedThreadIds: number[]) => void;
	initialPageSize?: number; // User's saved preference from ProfileSettings
}

export const ThreadsTable = ({
	threads,
	columns,
	onRowSelectionChange,
	initialPageSize = 10,
}: ThreadsTableProps) => {
	const [sorting, setSorting] = useState<SortingState>([
		{ id: "lastPostDate", desc: true },
	]);
	const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

	// TanStack Table v8 works with React 19 but isn't optimized by React Compiler yet
	// eslint-disable-next-line react-hooks/incompatible-library
	const table = useReactTable({
		data: threads,
		columns,
		state: {
			sorting,
			rowSelection,
		},
		onSortingChange: setSorting,
		onRowSelectionChange: (updater) => {
			setRowSelection(updater);
			// Notify parent of selection changes
			if (onRowSelectionChange) {
				const newSelection =
					typeof updater === "function" ? updater(rowSelection) : updater;
				const selectedIds = Object.keys(newSelection)
					.map(Number)
					.filter((id) => !isNaN(id));
				onRowSelectionChange(selectedIds);
			}
		},
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getExpandedRowModel: getExpandedRowModel(),
		enableRowSelection: true,
		getRowId: (row) => String(row.threadId),
		getRowCanExpand: () => true,
		initialState: {
			pagination: {
				pageSize: initialPageSize,
			},
		},
	});

	return (
		<div className="space-y-4">
			{/* Table */}
			<div className="overflow-x-auto border border-border rounded-lg">
				<table className="min-w-full divide-y divide-border">
					<thead className="bg-surface">
						{table.getHeaderGroups().map((headerGroup) => (
							<tr key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<th
										key={header.id}
										className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider"
										style={{
											width: header.getSize() !== 150 ? header.getSize() : undefined,
										}}
									>
										{header.isPlaceholder ? null : (
											<div
												className={
													header.column.getCanSort()
														? "flex items-center gap-2 cursor-pointer select-none"
														: ""
												}
												onClick={header.column.getToggleSortingHandler()}
											>
												{flexRender(
													header.column.columnDef.header,
													header.getContext()
												)}
												{header.column.getCanSort() && (
													<span className="text-text-muted">
														{header.column.getIsSorted() === "desc" ? (
															<FontAwesomeIcon
																icon={faSortDown}
																className="w-3 h-3"
															/>
														) : header.column.getIsSorted() === "asc" ? (
															<FontAwesomeIcon
																icon={faSortUp}
																className="w-3 h-3"
															/>
														) : (
															<FontAwesomeIcon icon={faSort} className="w-3 h-3" />
														)}
													</span>
												)}
											</div>
										)}
									</th>
								))}
							</tr>
						))}
					</thead>
					<tbody className="bg-surface divide-y divide-border">
						{table.getRowModel().rows.map((row) => (
							<Fragment key={row.id}>
								{/* Main row */}
								<tr className="hover:bg-background/50">
									{row.getVisibleCells().map((cell) => (
										<td key={cell.id} className="px-4 py-3 text-sm text-text">
											{flexRender(cell.column.columnDef.cell, cell.getContext())}
										</td>
									))}
								</tr>

								{/* Expanded row for description/tags */}
								{row.getIsExpanded() && (
									<tr>
										<td colSpan={row.getVisibleCells().length}>
											<ThreadExpandedRow
												description={row.original.description}
												tags={row.original.tags}
											/>
										</td>
									</tr>
								)}
							</Fragment>
						))}

						{/* Empty state */}
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
						className="px-3 py-1 text-sm border border-border rounded bg-surface text-text disabled:opacity-50 disabled:cursor-not-allowed hover:bg-background"
					>
						Previous
					</button>
					<button
						onClick={() => table.nextPage()}
						disabled={!table.getCanNextPage()}
						className="px-3 py-1 text-sm border border-border rounded bg-surface text-text disabled:opacity-50 disabled:cursor-not-allowed hover:bg-background"
					>
						Next
					</button>
				</div>
			</div>
		</div>
	);
};
