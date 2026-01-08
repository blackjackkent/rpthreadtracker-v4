"use client";

import { useState } from "react";
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

interface ThreadCardProps {
	thread: ThreadStatusWithDetails;
	isSelected: boolean;
	onSelect: (threadId: number) => void;
	onEdit: (thread: ThreadStatusWithDetails) => void;
	onArchive: (threadId: number) => void;
	onUnarchive: (threadId: number) => void;
	onToggleQueue: (threadId: number) => void;
	onUntrack: (threadId: number) => void;
	isArchivedPage: boolean;
	showToggleQueue: boolean;
}

export const ThreadCard = ({
	thread,
	isSelected,
	onSelect,
	onEdit,
	onArchive,
	onUnarchive,
	onToggleQueue,
	onUntrack,
	isArchivedPage,
	showToggleQueue,
}: ThreadCardProps) => {
	const [isExpanded, setIsExpanded] = useState(false);

	const title = thread.userTitle || thread.postId || "Untitled Thread";
	const characterName = thread.characterName || thread.characterUrlIdentifier;
	const lastPoster = thread.lastPosterUrlIdentifier;
	const partner = thread.partnerUrlIdentifier;

	const formatDate = (date: Date | null) => {
		if (!date) return null;
		return new Intl.DateTimeFormat("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "numeric",
			minute: "2-digit",
			hour12: true,
		}).format(new Date(date));
	};

	return (
		<div className="border border-border rounded-lg bg-surface p-4 space-y-3">
			{/* Header Row */}
			<div className="flex items-start gap-3">
				{/* Checkbox */}
				<input
					type="checkbox"
					checked={isSelected}
					onChange={() => thread.threadId && onSelect(thread.threadId)}
					className="cursor-pointer mt-1"
				/>

				{/* Expander */}
				<button
					type="button"
					onClick={() => setIsExpanded(!isExpanded)}
					className="cursor-pointer text-text-muted hover:text-text mt-1"
				>
					{isExpanded ? (
						<FontAwesomeIcon icon={faChevronDown} className="w-3 h-3" />
					) : (
						<FontAwesomeIcon icon={faChevronRight} className="w-3 h-3" />
					)}
				</button>

				{/* Main Content */}
				<div className="flex-1 min-w-0">
					{/* Thread Title */}
					<h3 className="font-medium text-base truncate">{title}</h3>

					{/* Character and Status */}
					<div className="flex items-center gap-2 mt-1 flex-wrap">
						<span className="text-sm text-text-muted">{characterName}</span>
						<span className="text-text-muted">•</span>
						<ThreadStatusBadge
							isArchived={thread.isArchived}
							isQueued={thread.isQueued}
							isCallingCharactersTurn={thread.isCallingCharactersTurn}
						/>
					</div>

					{/* Last Poster and Date */}
					<div className="text-sm text-text-muted mt-1">
						{lastPoster && (
							<>
								Last posted by:{" "}
								{thread.lastPostUrl ? (
									<a
										href={thread.lastPostUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="text-primary hover:text-primary-dark hover:underline"
									>
										{lastPoster}
									</a>
								) : (
									<span>{lastPoster}</span>
								)}
							</>
						)}
						{lastPoster && thread.lastPostDate && <span> • </span>}
						{thread.lastPostDate && <span>{formatDate(thread.lastPostDate)}</span>}
					</div>

					{/* Partner (if set) */}
					{partner && (
						<div className="text-sm text-text-muted mt-1">
							Partner: <span className="text-text">{partner}</span>
						</div>
					)}
				</div>

				{/* Action Buttons */}
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={() => onEdit(thread)}
						className="text-primary hover:text-primary-dark cursor-pointer"
						title="Edit thread"
					>
						<FontAwesomeIcon icon={faEdit} className="w-4 h-4" />
					</button>

					{isArchivedPage ? (
						<button
							type="button"
							onClick={() => thread.threadId && onUnarchive(thread.threadId)}
							className="text-primary hover:text-primary-dark cursor-pointer"
							title="Unarchive thread"
						>
							<FontAwesomeIcon icon={faBoxOpen} className="w-4 h-4" />
						</button>
					) : (
						<button
							type="button"
							onClick={() => thread.threadId && onArchive(thread.threadId)}
							className="text-primary hover:text-primary-dark cursor-pointer"
							title="Archive thread"
						>
							<FontAwesomeIcon icon={faBoxArchive} className="w-4 h-4" />
						</button>
					)}

					{!isArchivedPage && showToggleQueue && (
						<button
							type="button"
							onClick={() => thread.threadId && onToggleQueue(thread.threadId)}
							disabled={!thread.lastPostDate}
							className={
								!thread.lastPostDate
									? "text-text-muted cursor-not-allowed opacity-50"
									: "text-primary hover:text-primary-dark cursor-pointer"
							}
							title={
								!thread.lastPostDate
									? "Cannot queue - post not found on Tumblr"
									: thread.isQueued
										? "Unqueue thread"
										: "Queue thread"
							}
						>
							<FontAwesomeIcon icon={faClock} className="w-4 h-4" />
						</button>
					)}

					<button
						type="button"
						onClick={() => thread.threadId && onUntrack(thread.threadId)}
						className="text-red-500 hover:text-red-600 cursor-pointer"
						title="Untrack thread"
					>
						<FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
					</button>
				</div>
			</div>

			{/* Expanded Content (Description and Tags) */}
			{isExpanded && (
				<div className="pt-3 border-t border-border space-y-2">
					{/* Description section */}
					{thread.description && (
						<div>
							<p className="text-sm text-text">{thread.description}</p>
							<hr className="mt-2 border-border" />
						</div>
					)}

					{/* Tags section */}
					<div className="flex flex-wrap gap-2">
						{thread.tags && thread.tags.length > 0 ? (
							thread.tags.map((tag) => (
								<span
									key={tag.tagId}
									className="inline-block px-2 py-1 text-xs bg-primary/20 text-primary border border-primary/30 rounded"
								>
									#{tag.tagText}
								</span>
							))
						) : (
							<span className="text-text-muted text-sm">
								There are no tags assigned to this thread.
							</span>
						)}
					</div>
				</div>
			)}
		</div>
	);
};
