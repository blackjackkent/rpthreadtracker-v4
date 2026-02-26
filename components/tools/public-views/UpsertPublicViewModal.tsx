"use client";

import { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faSpinner } from "@fortawesome/free-solid-svg-icons";
import {
	createPublicView,
	updatePublicView,
	checkSlugAvailability,
	getPublicViewFormData,
	type PublicViewFormData,
	type PublicView,
} from "@/app/actions/public-view";

const COLUMN_OPTIONS = [
	{ value: "threadTitle", label: "Thread Title" },
	{ value: "character", label: "Character" },
	{ value: "partner", label: "Partner" },
	{ value: "lastPostDate", label: "Last Post Date" },
	{ value: "status", label: "Status" },
];

const SORT_KEY_OPTIONS = [
	{ value: "lastPostDate", label: "Last Post Date" },
	{ value: "threadTitle", label: "Thread Title" },
	{ value: "partner", label: "Partner" },
];

const DEFAULT_FORM: PublicViewFormData = {
	name: "",
	slug: "",
	includeMyTurn: true,
	includeTheirTurn: true,
	includeQueued: false,
	includeArchived: false,
	columns: ["threadTitle", "partner", "lastPostDate", "status"],
	sortKey: "lastPostDate",
	sortDescending: true,
	characterIds: null,
	tags: null,
};

interface FormData extends PublicViewFormData {
	allCharacters: boolean;
	allTags: boolean;
}

interface UpsertPublicViewModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSaved: () => void;
	viewToEdit?: PublicView | null;
}

export const UpsertPublicViewModal = ({
	isOpen,
	onClose,
	onSaved,
	viewToEdit,
}: UpsertPublicViewModalProps) => {
	const [form, setForm] = useState<FormData>({
		...DEFAULT_FORM,
		allCharacters: true,
		allTags: true,
	});
	const [characters, setCharacters] = useState<
		{ id: number; name: string; urlIdentifier: string | null }[]
	>([]);
	const [allTagOptions, setAllTagOptions] = useState<string[]>([]);
	const [isLoadingFormData, setIsLoadingFormData] = useState(false);
	const [slugError, setSlugError] = useState<string>("");
	const [slugChecking, setSlugChecking] = useState(false);
	const [rootError, setRootError] = useState<string>("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Load characters + tags when modal opens
	useEffect(() => {
		if (!isOpen) return;
		setIsLoadingFormData(true);
		getPublicViewFormData()
			.then((data) => {
				setCharacters(data.characters);
				setAllTagOptions(data.tags);
			})
			.catch(console.error)
			.finally(() => setIsLoadingFormData(false));
	}, [isOpen]);

	// Reset form when modal opens/viewToEdit changes
	useEffect(() => {
		if (!isOpen) return;
		if (viewToEdit) {
			setForm({
				name: viewToEdit.name,
				slug: viewToEdit.slug,
				includeMyTurn: viewToEdit.includeMyTurn,
				includeTheirTurn: viewToEdit.includeTheirTurn,
				includeQueued: viewToEdit.includeQueued,
				includeArchived: viewToEdit.includeArchived,
				columns: viewToEdit.columns,
				sortKey: viewToEdit.sortKey,
				sortDescending: viewToEdit.sortDescending,
				characterIds: viewToEdit.characterIds,
				tags: viewToEdit.tags,
				allCharacters: !viewToEdit.characterIds,
				allTags: !viewToEdit.tags,
			});
		} else {
			setForm({ ...DEFAULT_FORM, allCharacters: true, allTags: true });
		}
		setSlugError("");
		setRootError("");
	}, [isOpen, viewToEdit]);

	const handleSlugBlur = useCallback(async () => {
		const slug = form.slug.trim();
		if (!slug) return;
		if (!/^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/.test(slug)) {
			setSlugError(
				"Only letters, numbers, and hyphens (no leading/trailing hyphens)"
			);
			return;
		}
		setSlugChecking(true);
		setSlugError("");
		try {
			const available = await checkSlugAvailability(
				slug,
				viewToEdit?.id
			);
			if (!available) setSlugError("This slug is already taken");
		} catch {
			// ignore
		} finally {
			setSlugChecking(false);
		}
	}, [form.slug, viewToEdit?.id]);

	const toggleColumn = (col: string) => {
		setForm((prev) => ({
			...prev,
			columns: prev.columns.includes(col)
				? prev.columns.filter((c) => c !== col)
				: [...prev.columns, col],
		}));
	};

	const toggleCharacter = (id: number) => {
		setForm((prev) => {
			const current = prev.characterIds ?? [];
			const next = current.includes(id)
				? current.filter((c) => c !== id)
				: [...current, id];
			return { ...prev, characterIds: next.length > 0 ? next : [] };
		});
	};

	const toggleTag = (tag: string) => {
		setForm((prev) => {
			const current = prev.tags ?? [];
			const next = current.includes(tag)
				? current.filter((t) => t !== tag)
				: [...current, tag];
			return { ...prev, tags: next.length > 0 ? next : [] };
		});
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setRootError("");

		const payload: PublicViewFormData = {
			name: form.name,
			slug: form.slug,
			includeMyTurn: form.includeMyTurn,
			includeTheirTurn: form.includeTheirTurn,
			includeQueued: form.includeQueued,
			includeArchived: form.includeArchived,
			columns: form.columns,
			sortKey: form.sortKey,
			sortDescending: form.sortDescending,
			characterIds: form.allCharacters ? null : form.characterIds,
			tags: form.allTags ? null : form.tags,
		};

		setIsSubmitting(true);
		try {
			if (viewToEdit) {
				await updatePublicView(viewToEdit.id, payload);
			} else {
				await createPublicView(payload);
			}
			onSaved();
			onClose();
		} catch (err) {
			setRootError(
				err instanceof Error ? err.message : "An error occurred"
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			{/* Backdrop */}
			<div className="absolute inset-0 bg-black/50" onClick={onClose} />

			{/* Modal */}
			<div className="relative bg-surface border border-border rounded-lg shadow-xl w-full max-w-xl mx-4 max-h-[90vh] flex flex-col">
				{/* Header */}
				<div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
					<h2 className="text-xl font-semibold">
						{viewToEdit ? "Edit Public View" : "Create Public View"}
					</h2>
					<button
						onClick={onClose}
						className="text-text-muted hover:text-text transition-colors"
					>
						<FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
					</button>
				</div>

				{/* Body — scrollable */}
				<form
					onSubmit={handleSubmit}
					className="flex flex-col overflow-hidden flex-1"
				>
					<div className="px-6 py-4 space-y-5 overflow-y-auto flex-1">
						{rootError && (
							<div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded text-sm">
								{rootError}
							</div>
						)}

						{/* Name */}
						<div>
							<label className="block text-sm font-medium mb-1">
								View Name <span className="text-red-500">*</span>
							</label>
							<input
								type="text"
								value={form.name}
								onChange={(e) =>
									setForm((p) => ({ ...p, name: e.target.value }))
								}
								className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
								placeholder="My Thread List"
								disabled={isSubmitting}
							/>
						</div>

						{/* Slug */}
						<div>
							<label className="block text-sm font-medium mb-1">
								URL Slug <span className="text-red-500">*</span>
							</label>
							<div className="relative">
								<input
									type="text"
									value={form.slug}
									onChange={(e) => {
										setSlugError("");
										setForm((p) => ({
											...p,
											slug: e.target.value.toLowerCase().replace(/\s+/g, "-"),
										}));
									}}
									onBlur={handleSlugBlur}
									className={`w-full px-3 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm ${
										slugError ? "border-red-500" : "border-border"
									}`}
									placeholder="my-thread-list"
									disabled={isSubmitting}
								/>
								{slugChecking && (
									<span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
										<FontAwesomeIcon
											icon={faSpinner}
											className="w-3.5 h-3.5 animate-spin"
										/>
									</span>
								)}
							</div>
							{slugError && (
								<p className="mt-1 text-xs text-red-500">{slugError}</p>
							)}
							<p className="mt-1 text-xs text-text-muted">
								Shareable URL will be:{" "}
								<span className="font-mono">/public/[username]/</span>
								<span className="font-mono text-primary">
									{form.slug || "slug"}
								</span>
							</p>
						</div>

						{/* Status Filters */}
						<div>
							<label className="block text-sm font-medium mb-2">
								Include Threads <span className="text-red-500">*</span>
							</label>
							<div className="grid grid-cols-2 gap-2">
								{[
									{ key: "includeMyTurn", label: "My Turn" },
									{ key: "includeTheirTurn", label: "Their Turn" },
									{ key: "includeQueued", label: "Queued" },
									{ key: "includeArchived", label: "Archived" },
								].map(({ key, label }) => (
									<label
										key={key}
										className="flex items-center gap-2 cursor-pointer"
									>
										<input
											type="checkbox"
											checked={
												form[key as keyof PublicViewFormData] as boolean
											}
											onChange={(e) =>
												setForm((p) => ({
													...p,
													[key]: e.target.checked,
												}))
											}
											className="rounded"
											disabled={isSubmitting}
										/>
										<span className="text-sm">{label}</span>
									</label>
								))}
							</div>
						</div>

						{/* Columns */}
						<div>
							<label className="block text-sm font-medium mb-2">
								Columns <span className="text-red-500">*</span>
							</label>
							<div className="grid grid-cols-2 gap-2">
								{COLUMN_OPTIONS.map(({ value, label }) => (
									<label
										key={value}
										className="flex items-center gap-2 cursor-pointer"
									>
										<input
											type="checkbox"
											checked={form.columns.includes(value)}
											onChange={() => toggleColumn(value)}
											className="rounded"
											disabled={isSubmitting}
										/>
										<span className="text-sm">{label}</span>
									</label>
								))}
							</div>
						</div>

						{/* Sort */}
						<div className="grid grid-cols-2 gap-3">
							<div>
								<label className="block text-sm font-medium mb-1">Sort By</label>
								<select
									value={form.sortKey}
									onChange={(e) =>
										setForm((p) => ({ ...p, sortKey: e.target.value }))
									}
									className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
									disabled={isSubmitting}
								>
									{SORT_KEY_OPTIONS.map(({ value, label }) => (
										<option key={value} value={value}>
											{label}
										</option>
									))}
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">
									Direction
								</label>
								<select
									value={form.sortDescending ? "desc" : "asc"}
									onChange={(e) =>
										setForm((p) => ({
											...p,
											sortDescending: e.target.value === "desc",
										}))
									}
									className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
									disabled={isSubmitting}
								>
									<option value="desc">Descending</option>
									<option value="asc">Ascending</option>
								</select>
							</div>
						</div>

						{/* Character Filter */}
						{!isLoadingFormData && characters.length > 0 && (
							<div>
								<label className="block text-sm font-medium mb-2">
									Characters
								</label>
								<label className="flex items-center gap-2 cursor-pointer mb-2">
									<input
										type="checkbox"
										checked={form.allCharacters}
										onChange={(e) =>
											setForm((p) => ({
												...p,
												allCharacters: e.target.checked,
												characterIds: e.target.checked ? null : [],
											}))
										}
										className="rounded"
										disabled={isSubmitting}
									/>
									<span className="text-sm font-medium">All Characters</span>
								</label>
								{!form.allCharacters && (
									<div className="max-h-36 overflow-y-auto border border-border rounded-lg p-2 space-y-1 bg-background">
										{characters.map((char) => (
											<label
												key={char.id}
												className="flex items-center gap-2 cursor-pointer py-0.5"
											>
												<input
													type="checkbox"
													checked={(form.characterIds ?? []).includes(char.id)}
													onChange={() => toggleCharacter(char.id)}
													className="rounded shrink-0"
													disabled={isSubmitting}
												/>
												<span className="text-sm truncate">
													{char.name || char.urlIdentifier}
												</span>
											</label>
										))}
									</div>
								)}
							</div>
						)}

						{/* Tag Filter */}
						{!isLoadingFormData && allTagOptions.length > 0 && (
							<div>
								<label className="block text-sm font-medium mb-2">
									Tag Filter
								</label>
								<label className="flex items-center gap-2 cursor-pointer mb-2">
									<input
										type="checkbox"
										checked={form.allTags}
										onChange={(e) =>
											setForm((p) => ({
												...p,
												allTags: e.target.checked,
												tags: e.target.checked ? null : [],
											}))
										}
										className="rounded"
										disabled={isSubmitting}
									/>
									<span className="text-sm font-medium">
										All Tags (no filter)
									</span>
								</label>
								{!form.allTags && (
									<div className="max-h-36 overflow-y-auto border border-border rounded-lg p-2 space-y-1 bg-background">
										{allTagOptions.map((tag) => (
											<label
												key={tag}
												className="flex items-center gap-2 cursor-pointer py-0.5"
											>
												<input
													type="checkbox"
													checked={(form.tags ?? []).includes(tag)}
													onChange={() => toggleTag(tag)}
													className="rounded shrink-0"
													disabled={isSubmitting}
												/>
												<span className="text-sm truncate">{tag}</span>
											</label>
										))}
									</div>
								)}
							</div>
						)}
					</div>

					{/* Footer */}
					<div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border shrink-0">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 text-text-muted hover:text-text transition-colors text-sm"
							disabled={isSubmitting}
						>
							Cancel
						</button>
						<button
							type="submit"
							className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
							disabled={isSubmitting || !!slugError || slugChecking}
						>
							{isSubmitting ? (
								<>
									<FontAwesomeIcon
										icon={faSpinner}
										className="w-3.5 h-3.5 animate-spin mr-1.5"
									/>
									Saving...
								</>
							) : viewToEdit ? (
								"Save Changes"
							) : (
								"Create View"
							)}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};
