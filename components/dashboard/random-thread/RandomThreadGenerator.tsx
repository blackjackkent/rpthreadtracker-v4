"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDice, faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";
import { useThreadStatus } from "@/components/providers/ThreadStatusProvider";
import type { ThreadStatusWithDetails } from "@/types/tumblr";

export const RandomThreadGenerator = () => {
	const { threadStatuses } = useThreadStatus();
	const [selectedThread, setSelectedThread] =
		useState<ThreadStatusWithDetails | null>(null);

	const handleGenerateRandom = () => {
		// Convert Map to array and filter to only "Your Turn" threads with valid last post URLs
		const allThreads = Array.from(threadStatuses.values());
		const yourTurnThreads = allThreads.filter(
			(thread) =>
				thread.isCallingCharactersTurn && !thread.isQueued && thread.lastPostUrl
		);

		if (yourTurnThreads.length === 0) {
			setSelectedThread(null);
			return;
		}

		// Select a random thread
		const randomIndex = Math.floor(Math.random() * yourTurnThreads.length);
		setSelectedThread(yourTurnThreads[randomIndex]);
	};

	return (
		<div className="bg-surface border border-border rounded-lg shadow-sm h-[230px] flex flex-col">
			{/* Header */}
			<div className="px-4 py-3 border-b-2 border-primary bg-linear-to-r from-primary/5 to-transparent">
				<h2 className="text-lg font-semibold flex items-center gap-2">
					<FontAwesomeIcon icon={faDice} className="w-4 h-4 text-primary" />
					<span>Random Thread Generator</span>
				</h2>
			</div>

			{/* Body */}
			<div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
				{!selectedThread ? (
					<p className="text-text-muted">Pick a random thread to respond to!</p>
				) : (
					<div className="bg-background rounded-lg p-4 w-full space-y-2">
						{selectedThread.lastPostUrl ? (
							<>
								<a
									href={selectedThread.lastPostUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="text-primary hover:text-primary-dark font-medium flex items-center justify-center gap-2"
								>
									{selectedThread.userTitle || selectedThread.postId}
									<FontAwesomeIcon
										icon={faExternalLinkAlt}
										className="w-3 h-3"
									/>
								</a>
								{selectedThread.lastPosterUrlIdentifier && (
									<p className="text-text-muted text-sm">
										Last poster: {selectedThread.lastPosterUrlIdentifier}
									</p>
								)}
							</>
						) : (
							<>
								<p className="font-medium">
									{selectedThread.userTitle || selectedThread.postId}
								</p>
								<p className="text-text-muted text-sm">Awaiting Starter</p>
							</>
						)}
					</div>
				)}

				<button
					onClick={handleGenerateRandom}
					className="mt-4 px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
					disabled={threadStatuses.size === 0}
				>
					Generate
				</button>
			</div>
		</div>
	);
};
