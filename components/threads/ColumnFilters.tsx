import { Column } from "@tanstack/react-table";
import { ThreadStatusWithDetails } from "@/types/tumblr";
import { useMemo } from "react";

// Text filter for thread title
export const TextFilter = ({
	column,
}: {
	column: Column<ThreadStatusWithDetails>;
}) => {
	const columnFilterValue = column.getFilterValue() as string;

	return (
		<input
			type="text"
			value={columnFilterValue ?? ""}
			onChange={(e) => column.setFilterValue(e.target.value || undefined)}
			placeholder="Search..."
			className="w-full px-2 py-1 text-sm border border-border rounded bg-background text-text focus:outline-none focus:ring-1 focus:ring-primary"
		/>
	);
};

// Dropdown filter for character
export const CharacterFilter = ({
	column,
	table,
}: {
	column: Column<ThreadStatusWithDetails>;
	table: any;
}) => {
	const columnFilterValue = column.getFilterValue() as number | undefined;

	// Extract unique characters from the filtered data
	const uniqueCharacters = useMemo(() => {
		const characterMap = new Map<
			number,
			{ id: number; name: string; urlIdentifier: string }
		>();

		table.getPreFilteredRowModel().rows.forEach((row: any) => {
			const thread = row.original as ThreadStatusWithDetails;
			if (thread.characterId && !thread.characterIsOnHiatus) {
				characterMap.set(thread.characterId, {
					id: thread.characterId,
					name: thread.characterName,
					urlIdentifier: thread.characterUrlIdentifier,
				});
			}
		});

		return Array.from(characterMap.values()).sort((a, b) =>
			(a.name || a.urlIdentifier).localeCompare(b.name || b.urlIdentifier)
		);
	}, [table]);

	return (
		<select
			value={columnFilterValue ?? ""}
			onChange={(e) =>
				column.setFilterValue(
					e.target.value ? Number(e.target.value) : undefined
				)
			}
			className="w-full px-2 py-1 text-sm border border-border rounded bg-background text-text focus:outline-none focus:ring-1 focus:ring-primary"
		>
			<option value="">All</option>
			{uniqueCharacters.map((char) => (
				<option key={char.id} value={char.id}>
					{char.name || char.urlIdentifier}
				</option>
			))}
		</select>
	);
};

// Dropdown filter for last poster
export const LastPosterFilter = ({
	column,
	table,
}: {
	column: Column<ThreadStatusWithDetails>;
	table: any;
}) => {
	const columnFilterValue = column.getFilterValue() as string | undefined;

	// Extract unique last posters from the filtered data
	const uniquePosters = useMemo(() => {
		const posterSet = new Set<string>();

		table.getPreFilteredRowModel().rows.forEach((row: any) => {
			const thread = row.original as ThreadStatusWithDetails;
			if (thread.lastPosterUrlIdentifier) {
				posterSet.add(thread.lastPosterUrlIdentifier);
			}
		});

		return Array.from(posterSet).sort();
	}, [table]);

	return (
		<select
			value={columnFilterValue ?? ""}
			onChange={(e) => column.setFilterValue(e.target.value || undefined)}
			className="w-full px-2 py-1 text-sm border border-border rounded bg-background text-text focus:outline-none focus:ring-1 focus:ring-primary"
		>
			<option value="">All</option>
			{uniquePosters.map((poster) => (
				<option key={poster} value={poster}>
					{poster}
				</option>
			))}
		</select>
	);
};

// Dropdown filter for tracked partner
export const PartnerFilter = ({
	column,
	table,
}: {
	column: Column<ThreadStatusWithDetails>;
	table: any;
}) => {
	const columnFilterValue = column.getFilterValue() as string | undefined;

	// Extract unique partners from the filtered data
	const uniquePartners = useMemo(() => {
		const partnerSet = new Set<string>();

		table.getPreFilteredRowModel().rows.forEach((row: any) => {
			const thread = row.original as ThreadStatusWithDetails;
			if (thread.partnerUrlIdentifier) {
				partnerSet.add(thread.partnerUrlIdentifier);
			}
		});

		return Array.from(partnerSet).sort();
	}, [table]);

	return (
		<select
			value={columnFilterValue ?? ""}
			onChange={(e) => column.setFilterValue(e.target.value || undefined)}
			className="w-full px-2 py-1 text-sm border border-border rounded bg-background text-text focus:outline-none focus:ring-1 focus:ring-primary"
		>
			<option value="">All</option>
			{uniquePartners.map((partner) => (
				<option key={partner} value={partner}>
					{partner}
				</option>
			))}
		</select>
	);
};
