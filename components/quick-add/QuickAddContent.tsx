"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { ThreadForm, type ThreadFormSubmitData, type ThreadFormCharacter } from "@/components/threads/ThreadForm";
import { createThread } from "@/app/actions/thread";

interface QuickAddContentProps {
	characters: ThreadFormCharacter[];
	blogShortname: string;
	postId: string;
}

export const QuickAddContent = ({
	characters,
	blogShortname,
	postId,
}: QuickAddContentProps) => {
	const [success, setSuccess] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	// Try to pre-select the character whose urlIdentifier matches the blog shortname
	const matchedCharacter = characters.find(
		(c) => c.urlIdentifier?.toLowerCase() === blogShortname.toLowerCase()
	);

	const handleSubmit = async (data: ThreadFormSubmitData) => {
		setIsLoading(true);
		try {
			await createThread(data);
			setSuccess(true);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-background text-text flex flex-col">
			{/* Mini header */}
			<div className="bg-surface border-b border-border px-5 py-3">
				<span className="text-primary font-bold text-sm">RPThreadTracker</span>
				<span className="text-text-muted text-sm"> — Quick Add</span>
			</div>

			<div className="flex-1 overflow-y-auto p-5">
				{success ? (
					<div className="flex flex-col items-center justify-center py-12 space-y-3 text-center">
						<div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
							<FontAwesomeIcon icon={faCheck} className="w-6 h-6 text-green-500" />
						</div>
						<h3 className="font-semibold text-lg">Thread tracked!</h3>
						<p className="text-text-muted text-sm">You can close this window.</p>
						<a
							href="/"
							target="_blank"
							rel="noopener noreferrer"
							className="text-primary hover:underline text-sm"
						>
							Open RPThreadTracker
						</a>
					</div>
				) : (
					<ThreadForm
						onSubmit={handleSubmit}
						characters={characters}
						defaultPostId={postId}
						defaultCharacterId={matchedCharacter?.id}
						isLoading={isLoading}
						submitLabel="Track Thread"
					/>
				)}
			</div>
		</div>
	);
};
