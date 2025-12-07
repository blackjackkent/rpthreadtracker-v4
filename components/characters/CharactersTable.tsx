"use client";

import { useMemo, useState } from "react";
import {
	useReactTable,
	getCoreRowModel,
	getSortedRowModel,
	flexRender,
	type SortingState,
} from "@tanstack/react-table";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSort, faSortUp, faSortDown } from "@fortawesome/free-solid-svg-icons";
import { createCharacterColumns, type Character } from "./columns";

interface CharactersTableProps {
	characters: Character[];
	onEdit: (character: Character) => void;
	onToggleHiatus: (character: Character) => Promise<void>;
	onDelete: (character: Character) => Promise<void>;
}

export const CharactersTable = ({
	characters,
	onEdit,
	onToggleHiatus,
	onDelete,
}: CharactersTableProps) => {
	const [sorting, setSorting] = useState<SortingState>([
		{ id: "status", desc: false },
	]);

	const columns = useMemo(
		() =>
			createCharacterColumns({
				onEdit,
				onToggleHiatus,
				onDelete,
			}),
		[onEdit, onToggleHiatus, onDelete]
	);

	const table = useReactTable({
		data: characters,
		columns,
		state: {
			sorting,
		},
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
	});

	if (characters.length === 0) {
		return (
			<div className="bg-surface border border-border rounded-lg p-8 text-center">
				<p className="text-text-muted">
					No characters found. Click "Add Character" to get started!
				</p>
			</div>
		);
	}

	return (
		<div className="bg-surface border border-border rounded-lg overflow-hidden">
			<div className="overflow-x-auto">
				<table className="w-full">
					<thead className="bg-background border-b border-border">
						{table.getHeaderGroups().map((headerGroup) => (
							<tr key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<th key={header.id} className="px-4 py-3 text-left">
										{header.isPlaceholder ? null : (
											<div
												className={
													header.column.getCanSort()
														? "flex items-center gap-2 cursor-pointer hover:text-primary transition-colors select-none"
														: ""
												}
												onClick={header.column.getToggleSortingHandler()}
											>
												{flexRender(
													header.column.columnDef.header,
													header.getContext()
												)}
												{header.column.getCanSort() && (
													<FontAwesomeIcon
														icon={
															header.column.getIsSorted() === "asc"
																? faSortUp
																: header.column.getIsSorted() === "desc"
																	? faSortDown
																	: faSort
														}
														className="w-3 h-3 text-text-muted"
													/>
												)}
											</div>
										)}
									</th>
								))}
							</tr>
						))}
					</thead>
					<tbody className="divide-y divide-border">
						{table.getRowModel().rows.map((row) => (
							<tr
								key={row.id}
								className="hover:bg-background transition-colors"
							>
								{row.getVisibleCells().map((cell) => (
									<td key={cell.id} className="px-4 py-3">
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
};