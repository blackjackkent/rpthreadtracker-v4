import { createColumnHelper } from "@tanstack/react-table";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faEdit,
	faTrash,
	faBoxArchive,
	faBoxOpen,
} from "@fortawesome/free-solid-svg-icons";

export interface Character {
	characterId: number;
	userId: string;
	characterName: string | null;
	urlIdentifier: string | null;
	isOnHiatus: boolean;
	platformId: number;
	platformName: string;
	threadCount: number;
}

interface ColumnActions {
	onEdit: (character: Character) => void;
	onToggleHiatus: (character: Character) => void;
	onDelete: (character: Character) => void;
}

const columnHelper = createColumnHelper<Character>();

export const createCharacterColumns = (actions: ColumnActions) => [
	columnHelper.accessor("characterName", {
		header: "Character Name",
		cell: (info) => {
			const character = info.row.original;
			const displayName = info.getValue() || "Unnamed Character";
			return (
				<span
					className={character.isOnHiatus ? "line-through text-text-muted" : ""}
				>
					{displayName}
				</span>
			);
		},
		sortingFn: (rowA, rowB) => {
			const a = (
				rowA.original.characterName || "Unnamed Character"
			).toLowerCase();
			const b = (
				rowB.original.characterName || "Unnamed Character"
			).toLowerCase();
			return a.localeCompare(b);
		},
	}),
	columnHelper.accessor("urlIdentifier", {
		header: "URL Identifier",
		cell: (info) => {
			const character = info.row.original;
			const url = info.getValue();
			if (!url) return "-";
			return (
				<a
					href={`https://${url}.tumblr.com`}
					target="_blank"
					rel="noopener noreferrer"
					className={`hover:underline ${
						character.isOnHiatus ? "text-text-muted" : "text-primary"
					}`}
				>
					{url}
				</a>
			);
		},
	}),
	columnHelper.accessor("platformName", {
		header: "Platform",
	}),
	columnHelper.accessor("isOnHiatus", {
		id: "status",
		header: "Status",
		cell: (info) => (info.getValue() ? "On Hiatus" : "Active"),
		sortingFn: (rowA, rowB) => {
			const a = rowA.original.isOnHiatus ? 1 : 0;
			const b = rowB.original.isOnHiatus ? 1 : 0;
			return a - b;
		},
	}),
	columnHelper.accessor("threadCount", {
		header: "Thread Count",
		cell: (info) => {
			const character = info.row.original;
			return character.isOnHiatus ? "-" : info.getValue();
		},
		sortingFn: (rowA, rowB) => {
			// Treat hiatus characters as having -1 thread count for sorting purposes
			const a = rowA.original.isOnHiatus ? -1 : rowA.original.threadCount;
			const b = rowB.original.isOnHiatus ? -1 : rowB.original.threadCount;
			return a - b;
		},
	}),
	columnHelper.display({
		id: "actions",
		header: () => <div className="text-right">Actions</div>,
		cell: (info) => {
			const character = info.row.original;
			return (
				<div className="flex items-center justify-end gap-2">
					<button
						onClick={() => actions.onEdit(character)}
						className="text-primary hover:text-primary-dark transition-colors p-1 cursor-pointer"
						title="Edit"
					>
						<FontAwesomeIcon icon={faEdit} className="w-4 h-4" />
					</button>
					<button
						onClick={() => actions.onToggleHiatus(character)}
						className="text-primary hover:text-primary-dark transition-colors p-1 cursor-pointer"
						title={character.isOnHiatus ? "Set Off Hiatus" : "Set On Hiatus"}
					>
						<FontAwesomeIcon
						icon={character.isOnHiatus ? faBoxOpen : faBoxArchive}
						className="w-4 h-4"
					/>
					</button>
					<button
						onClick={() => actions.onDelete(character)}
						className="text-red-500 hover:text-red-600 transition-colors p-1 cursor-pointer"
						title="Untrack"
					>
						<FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
					</button>
				</div>
			);
		},
	}),
];
