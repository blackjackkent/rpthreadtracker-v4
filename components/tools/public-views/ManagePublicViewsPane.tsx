"use client";

import { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faPlus,
	faEdit,
	faTrash,
	faCopy,
	faExternalLinkAlt,
	faSpinner,
	faCheck,
	faGlobe,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import {
	getPublicViews,
	deletePublicView,
	type PublicView,
} from "@/app/actions/public-view";
import { UpsertPublicViewModal } from "./UpsertPublicViewModal";

export const ManagePublicViewsPane = () => {
	const [views, setViews] = useState<PublicView[]>([]);
	const [username, setUsername] = useState<string>("");
	const [isLoading, setIsLoading] = useState(true);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingView, setEditingView] = useState<PublicView | null>(null);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [copiedId, setCopiedId] = useState<string | null>(null);

	const loadViews = useCallback(async () => {
		try {
			const data = await getPublicViews();
			setViews(data.views);
			setUsername(data.username);
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to load public views"
			);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		loadViews();
	}, [loadViews]);

	const handleCopyUrl = async (view: PublicView) => {
		const url = `${window.location.origin}/public/${username}/${view.slug}`;
		try {
			await navigator.clipboard.writeText(url);
			setCopiedId(view.id);
			setTimeout(() => setCopiedId(null), 2000);
		} catch {
			toast.error("Failed to copy URL");
		}
	};

	const handleDelete = async (view: PublicView) => {
		try {
			await deletePublicView(view.id);
			toast.success(`Deleted "${view.name}"`);
			setDeletingId(null);
			await loadViews();
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to delete public view"
			);
		}
	};

	const handleOpenCreate = () => {
		setEditingView(null);
		setIsModalOpen(true);
	};

	const handleOpenEdit = (view: PublicView) => {
		setDeletingId(null);
		setEditingView(view);
		setIsModalOpen(true);
	};

	const handleSaved = async () => {
		toast.success(editingView ? "Public view updated!" : "Public view created!");
		await loadViews();
	};

	return (
		<>
			<div className="bg-surface border border-border rounded-lg shadow-sm">
				{/* Header */}
				<div className="px-6 py-4 border-b border-border flex items-center justify-between">
					<div>
						<h2 className="text-lg font-semibold">Manage Public Views</h2>
						<p className="text-sm text-text-muted mt-0.5">
							Create shareable links to your thread lists
						</p>
					</div>
					<button
						onClick={handleOpenCreate}
						className="flex items-center gap-2 px-3 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm transition-colors"
					>
						<FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
						New View
					</button>
				</div>

				<div className="p-6">
					{isLoading ? (
						<div className="flex justify-center py-8 text-text-muted">
							<FontAwesomeIcon
								icon={faSpinner}
								className="w-5 h-5 animate-spin"
							/>
						</div>
					) : views.length === 0 ? (
						<div className="text-center py-10 text-text-muted space-y-2">
							<FontAwesomeIcon icon={faGlobe} className="w-8 h-8 opacity-30" />
							<p className="text-sm">No public views yet.</p>
							<p className="text-xs">
								Create a public view to share your thread list with others.
							</p>
						</div>
					) : (
						<div className="space-y-3">
							{views.map((view) => (
								<ViewRow
									key={view.id}
									view={view}
									username={username}
									isDeletingConfirm={deletingId === view.id}
									isCopied={copiedId === view.id}
									onEdit={() => handleOpenEdit(view)}
									onDeleteRequest={() =>
										setDeletingId(deletingId === view.id ? null : view.id)
									}
									onDeleteConfirm={() => handleDelete(view)}
									onDeleteCancel={() => setDeletingId(null)}
									onCopy={() => handleCopyUrl(view)}
								/>
							))}
						</div>
					)}
				</div>
			</div>

			<UpsertPublicViewModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				onSaved={handleSaved}
				viewToEdit={editingView}
			/>
		</>
	);
};

interface ViewRowProps {
	view: PublicView;
	username: string;
	isDeletingConfirm: boolean;
	isCopied: boolean;
	onEdit: () => void;
	onDeleteRequest: () => void;
	onDeleteConfirm: () => void;
	onDeleteCancel: () => void;
	onCopy: () => void;
}

const ViewRow = ({
	view,
	username,
	isDeletingConfirm,
	isCopied,
	onEdit,
	onDeleteRequest,
	onDeleteConfirm,
	onDeleteCancel,
	onCopy,
}: ViewRowProps) => {
	const [isDeleting, setIsDeleting] = useState(false);
	const publicPath = `/public/${username}/${view.slug}`;

	const handleConfirmDelete = async () => {
		setIsDeleting(true);
		try {
			await onDeleteConfirm();
		} finally {
			setIsDeleting(false);
		}
	};

	const statusLabels: string[] = [];
	if (view.includeMyTurn) statusLabels.push("My Turn");
	if (view.includeTheirTurn) statusLabels.push("Their Turn");
	if (view.includeQueued) statusLabels.push("Queued");
	if (view.includeArchived) statusLabels.push("Archived");

	if (isDeletingConfirm) {
		return (
			<div className="border border-red-500/50 bg-red-500/5 rounded-lg p-4 space-y-2">
				<p className="text-sm text-text">
					Delete <strong>&quot;{view.name}&quot;</strong>? This cannot be
					undone.
				</p>
				<div className="flex items-center gap-2">
					<button
						onClick={handleConfirmDelete}
						disabled={isDeleting}
						className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isDeleting ? (
							<FontAwesomeIcon
								icon={faSpinner}
								className="w-3.5 h-3.5 animate-spin"
							/>
						) : (
							"Delete"
						)}
					</button>
					<button
						onClick={onDeleteCancel}
						disabled={isDeleting}
						className="px-3 py-1.5 text-text-muted hover:text-text text-sm transition-colors"
					>
						Cancel
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="border border-border rounded-lg p-4 space-y-2 hover:border-border/80 transition-colors">
			<div className="flex items-start justify-between gap-2">
				<div className="min-w-0">
					<div className="font-medium text-text">{view.name}</div>
					<div className="text-xs text-text-muted mt-0.5">
						{statusLabels.join(", ")}
						{view.characterIds
							? ` · ${view.characterIds.length} character${view.characterIds.length !== 1 ? "s" : ""}`
							: " · All characters"}
						{view.tags
							? ` · ${view.tags.length} tag filter${view.tags.length !== 1 ? "s" : ""}`
							: ""}
					</div>
				</div>
				<div className="flex items-center gap-1 shrink-0">
					<button
						onClick={onEdit}
						title="Edit"
						className="p-1.5 text-text-muted hover:text-primary transition-colors"
					>
						<FontAwesomeIcon icon={faEdit} className="w-3.5 h-3.5" />
					</button>
					<button
						onClick={onDeleteRequest}
						title="Delete"
						className="p-1.5 text-text-muted hover:text-red-500 transition-colors"
					>
						<FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" />
					</button>
				</div>
			</div>

			{/* URL row */}
			<div className="flex items-center gap-2 text-xs">
				<span className="text-text-muted font-mono truncate min-w-0">
					{publicPath}
				</span>
				<button
					onClick={onCopy}
					title="Copy URL"
					className={`shrink-0 p-1 rounded transition-colors ${
						isCopied ? "text-green-400" : "text-text-muted hover:text-primary"
					}`}
				>
					<FontAwesomeIcon
						icon={isCopied ? faCheck : faCopy}
						className="w-3.5 h-3.5"
					/>
				</button>
				<a
					href={publicPath}
					target="_blank"
					rel="noopener noreferrer"
					title="Open view"
					className="shrink-0 p-1 text-text-muted hover:text-primary transition-colors"
				>
					<FontAwesomeIcon icon={faExternalLinkAlt} className="w-3.5 h-3.5" />
				</a>
			</div>
		</div>
	);
};
