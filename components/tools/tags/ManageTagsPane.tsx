"use client";

import {
	bulkDeleteTag,
	bulkRenameTag,
	getAllTagsForUser,
	TagWithCount,
} from "@/app/actions/tag";
import {
	faCheck,
	faPencil,
	faSearch,
	faSpinner,
	faTimes,
	faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

export const ManageTagsPane = () => {
	const [tags, setTags] = useState<TagWithCount[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [editingTag, setEditingTag] = useState<string | null>(null);
	const [newTagText, setNewTagText] = useState("");
	const [confirmingDeleteTag, setConfirmingDeleteTag] = useState<string | null>(
		null
	);
	const [isSaving, setIsSaving] = useState(false);
	const renameInputRef = useRef<HTMLInputElement>(null);

	const fetchTags = async () => {
		const result = await getAllTagsForUser();
		setTags(result);
	};

	useEffect(() => {
		fetchTags().finally(() => setIsLoading(false));
	}, []);

	useEffect(() => {
		if (editingTag !== null) {
			renameInputRef.current?.focus();
			renameInputRef.current?.select();
		}
	}, [editingTag]);

	const filteredTags = tags.filter((t) =>
		t.displayText.toLowerCase().includes(searchQuery.toLowerCase())
	);

	const handleEditClick = (tag: TagWithCount) => {
		setConfirmingDeleteTag(null);
		setEditingTag(tag.displayText);
		setNewTagText(tag.displayText);
	};

	const handleDeleteClick = (tag: TagWithCount) => {
		setEditingTag(null);
		setConfirmingDeleteTag(tag.displayText);
	};

	const handleCancelEdit = () => {
		setEditingTag(null);
		setNewTagText("");
	};

	const handleCancelDelete = () => {
		setConfirmingDeleteTag(null);
	};

	const handleSaveRename = async (currentTag: string) => {
		const trimmed = newTagText.trim();
		if (!trimmed || trimmed === currentTag) {
			handleCancelEdit();
			return;
		}
		setIsSaving(true);
		try {
			await bulkRenameTag(currentTag, trimmed);
			await fetchTags();
			setEditingTag(null);
			setNewTagText("");
			toast.success(`"${currentTag}" renamed to "${trimmed}"`);
		} catch {
			toast.error("Failed to rename tag. Please try again.");
		} finally {
			setIsSaving(false);
		}
	};

	const handleConfirmDelete = async (tagText: string) => {
		setIsSaving(true);
		try {
			await bulkDeleteTag(tagText);
			await fetchTags();
			setConfirmingDeleteTag(null);
			toast.success(`"${tagText}" removed from all threads`);
		} catch {
			toast.error("Failed to delete tag. Please try again.");
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="bg-surface border border-border rounded-lg shadow-sm">
			<div className="px-6 py-4 border-b border-border">
				<h2 className="text-lg font-semibold">Manage Tags</h2>
				<p className="text-sm text-text-muted mt-1">
					Rename or delete tags across all your threads at once
				</p>
			</div>

			<div className="p-6 space-y-4">
				{/* Search input */}
				<div className="relative">
					<FontAwesomeIcon
						icon={faSearch}
						className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm"
					/>
					<input
						type="text"
						placeholder="Search tags…"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
					/>
				</div>

				{/* Tag list */}
				{isLoading ? (
					<div className="flex items-center justify-center py-8 text-text-muted">
						<FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
						Loading tags…
					</div>
				) : filteredTags.length === 0 ? (
					<div className="py-8 text-center text-text-muted text-sm">
						{tags.length === 0
							? "No tags found. Add tags to your threads to manage them here."
							: "No tags match your search."}
					</div>
				) : (
					<div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
						{filteredTags.map((tag) => {
							const isEditing = editingTag === tag.displayText;
							const isConfirmingDelete =
								confirmingDeleteTag === tag.displayText;

							if (isEditing) {
								return (
									<div
										key={tag.displayText}
										className="flex items-center gap-3 px-4 py-3 bg-primary/5"
									>
										<span className="text-text-muted text-sm shrink-0">
											Rename:
										</span>
										<span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-primary/20 text-tag-text border border-primary/30 shrink-0">
											#{tag.displayText}
										</span>
										<span className="text-text-muted shrink-0">→</span>
										<input
											ref={renameInputRef}
											type="text"
											value={newTagText}
											onChange={(e) => setNewTagText(e.target.value)}
											onKeyDown={(e) => {
												if (e.key === "Enter")
													handleSaveRename(tag.displayText);
												if (e.key === "Escape") handleCancelEdit();
											}}
											maxLength={140}
											className="flex-1 min-w-0 px-3 py-1 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
										/>
										<button
											onClick={() => handleSaveRename(tag.displayText)}
											disabled={isSaving || !newTagText.trim()}
											className="p-1.5 text-green-500 hover:text-green-400 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
											title="Save"
										>
											<FontAwesomeIcon
												icon={isSaving ? faSpinner : faCheck}
												className={isSaving ? "animate-spin" : ""}
											/>
										</button>
										<button
											onClick={handleCancelEdit}
											disabled={isSaving}
											className="p-1.5 text-text-muted hover:text-text disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
											title="Cancel"
										>
											<FontAwesomeIcon icon={faTimes} />
										</button>
									</div>
								);
							}

							if (isConfirmingDelete) {
								return (
									<div
										key={tag.displayText}
										className="flex items-center gap-3 px-4 py-3 bg-red-500/5"
									>
										<span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-primary/20 text-tag-text border border-primary/30 shrink-0">
											#{tag.displayText}
										</span>
										<span className="text-sm text-text-muted flex-1">
											Remove from{" "}
											<span className="font-medium text-text">
												{tag.count} {tag.count === 1 ? "thread" : "threads"}
											</span>
											?
										</span>
										<button
											onClick={() => handleConfirmDelete(tag.displayText)}
											disabled={isSaving}
											className="p-1.5 text-red-500 hover:text-red-400 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
											title="Confirm delete"
										>
											<FontAwesomeIcon
												icon={isSaving ? faSpinner : faCheck}
												className={isSaving ? "animate-spin" : ""}
											/>
										</button>
										<button
											onClick={handleCancelDelete}
											disabled={isSaving}
											className="p-1.5 text-text-muted hover:text-text disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
											title="Cancel"
										>
											<FontAwesomeIcon icon={faTimes} />
										</button>
									</div>
								);
							}

							return (
								<div
									key={tag.displayText}
									className="flex items-center gap-3 px-4 py-3 hover:bg-background/50"
								>
									<span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-primary/20 text-tag-text border border-primary/30">
										#{tag.displayText}
									</span>
									<span className="text-sm text-text-muted flex-1">
										{tag.count} {tag.count === 1 ? "thread" : "threads"}
									</span>
									<button
										onClick={() => handleEditClick(tag)}
										className="p-1.5 text-text-muted hover:text-primary transition-colors cursor-pointer"
										title="Rename tag"
									>
										<FontAwesomeIcon icon={faPencil} className="text-sm" />
									</button>
									<button
										onClick={() => handleDeleteClick(tag)}
										className="p-1.5 text-text-muted hover:text-red-500 transition-colors cursor-pointer"
										title="Delete tag"
									>
										<FontAwesomeIcon icon={faTrash} className="text-sm" />
									</button>
								</div>
							);
						})}
					</div>
				)}

				{!isLoading && tags.length > 0 && (
					<p className="text-xs text-text-muted">
						{tags.length} {tags.length === 1 ? "tag" : "tags"} total
						{filteredTags.length !== tags.length &&
							` · ${filteredTags.length} shown`}
					</p>
				)}
			</div>
		</div>
	);
};
