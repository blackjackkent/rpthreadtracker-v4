"use client";

import { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { useProfileSettings } from "@/components/providers/ProfileSettingsProvider";
import type { NewsPost } from "@/lib/tumblr-client";

interface NewsSidebarProps {
	isOpen: boolean;
	onClose: () => void;
	news: NewsPost[];
}

export const NewsSidebar = ({ isOpen, onClose, news }: NewsSidebarProps) => {
	const { settings, updateSettings } = useProfileSettings();

	// Mark all news as read when the sidebar opens
	useEffect(() => {
		if (isOpen && news.length > 0) {
			updateSettings({ lastNewsReadDate: new Date() });
		}
	}, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

	const lastRead = settings?.lastNewsReadDate
		? new Date(settings.lastNewsReadDate)
		: null;

	const isUnread = (post: NewsPost) =>
		!lastRead || new Date(post.postDate) > lastRead;

	return (
		<>
			{/* Backdrop */}
			{isOpen && (
				<div
					className="fixed inset-0 z-40 bg-black/30"
					onClick={onClose}
				/>
			)}

			{/* Panel */}
			<aside
				aria-label="News sidebar"
				className={`fixed top-0 right-0 z-50 h-full w-80 bg-surface border-l border-border shadow-xl flex flex-col transition-transform duration-300 ${
					isOpen ? "translate-x-0" : "translate-x-full"
				}`}
			>
				{/* Header */}
				<div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary text-white">
					<h2 className="font-semibold text-sm uppercase tracking-wide">
						RPThreadTracker News
					</h2>
					<button
						onClick={onClose}
						className="text-white/80 hover:text-white transition-colors cursor-pointer"
						aria-label="Close news"
					>
						<FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
					</button>
				</div>

				{/* News items */}
				<div className="flex-1 overflow-y-auto divide-y divide-border">
					{news.length === 0 ? (
						<div className="p-6 text-center text-text-muted text-sm">
							No news yet.
						</div>
					) : (
						news.map((post) => {
							const unread = isUnread(post);
							return (
								<div
									key={post.postId}
									className={`p-4 ${unread ? "bg-primary/5" : ""}`}
								>
									<div className="flex items-start justify-between gap-2">
										<a
											href={post.postUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="text-sm font-medium text-primary hover:underline leading-snug"
										>
											{post.postTitle}
										</a>
										{unread && (
											<span className="shrink-0 text-xs font-semibold bg-red-500 text-white rounded px-1.5 py-0.5">
												New
											</span>
										)}
									</div>
									<p className="mt-1 text-xs text-text-muted">
										{new Date(post.postDate).toLocaleDateString(undefined, {
											month: "short",
											day: "numeric",
											year: "numeric",
										})}
									</p>
								</div>
							);
						})
					)}
				</div>
			</aside>
		</>
	);
};
