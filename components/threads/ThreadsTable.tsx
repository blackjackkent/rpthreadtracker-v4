"use client";

import { useState, Fragment } from "react";
import {
	useReactTable,
	getCoreRowModel,
	getSortedRowModel,
	getPaginationRowModel,
	getExpandedRowModel,
	getFilteredRowModel,
	SortingState,
	ColumnDef,
	ColumnFiltersState,
	flexRender,
	RowSelectionState,
	Table,
	Column,
} from "@tanstack/react-table";
import { ThreadStatusWithDetails } from "@/types/tumblr";
import { ThreadExpandedRow } from "./ThreadExpandedRow";

// Type for filter component props
interface FilterComponentProps {
	column: Column<ThreadStatusWithDetails>;
	table: Table<ThreadStatusWithDetails>;
}

// Extend ColumnMeta to include filterComponent
declare module "@tanstack/react-table" {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	interface ColumnMeta<TData, TValue> {
		filterComponent?: React.ComponentType<FilterComponentProps>;
	}
}

interface ThreadsTableProps {
	threads: ThreadStatusWithDetails[];
	columns: ColumnDef<ThreadStatusWithDetails>[];
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
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

	// TanStack Table v8 works with React 19 but isn't optimized by React Compiler yet
	// eslint-disable-next-line react-hooks/incompatible-library
	const table = useReactTable({
		data: threads,
		columns,
		state: {
			sorting,
			columnFilters,
			rowSelection,
		},
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
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
		getFilteredRowModel: getFilteredRowModel(),
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
							<Fragment key={headerGroup.id}>
								{/* Column Headers */}
								<tr>
									{headerGroup.headers.map((header) => {
										const sortDirection = header.column.getIsSorted();
										return (
											<th
												key={header.id}
												className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider relative"
												style={{
													width:
														header.getSize() !== 150 ? header.getSize() : undefined,
												}}
											>
												{/* Sorting indicator bar - top for asc, bottom for desc */}
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
															header.getContext()
														)}
													</div>
												)}
											</th>
										);
									})}
								</tr>

								{/* Filter Row */}
								<tr>
									{headerGroup.headers.map((header) => {
										const FilterComponent =
											header.column.columnDef.meta?.filterComponent;
										return (
											<th key={header.id} className="px-4 py-2">
												{header.column.getCanFilter() && FilterComponent ? (
													<FilterComponent column={header.column} table={table} />
												) : null}
											</th>
										);
									})}
								</tr>
							</Fragment>
						))}
					</thead>
					<tbody className="bg-surface divide-y divide-border">
						{table.getRowModel().rows.map((row) => (
							<Fragment key={row.id}>
								{/* Main row */}
								<tr className="hover:bg-background/50">
									{row.getVisibleCells().map((cell) => (
										<td key={cell.id} className="px-4 py-3 text-sm text-text">
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext()
											)}
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
