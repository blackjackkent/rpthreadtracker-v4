import type { ThreadStatusWithDetails } from "@/types/tumblr";

interface RecentThreadItemProps {
	thread: ThreadStatusWithDetails;
}

export function RecentThreadItem({ thread }: RecentThreadItemProps) {
	// Display character name or fallback to URL identifier
	const characterDisplay = thread.characterName || thread.characterUrlIdentifier;

	// Build the subtitle: "Character" or "Character × Partner"
	const subtitle = thread.lastPosterUrlIdentifier
		? `${characterDisplay} × ${thread.lastPosterUrlIdentifier}`
		: characterDisplay;

	return (
		<div className="border-b border-border pb-3 last:border-b-0 last:pb-0">
			<div className="flex justify-between items-start gap-4">
				<div className="flex-1 min-w-0">
					<h3 className="font-medium text-sm truncate">
						{thread.userTitle || "Untitled Thread"}
					</h3>
					<p className="text-xs text-text-muted">{subtitle}</p>
				</div>
				<div className="flex items-center gap-2 flex-shrink-0">
					<span
						className={`text-xs px-2 py-1 rounded ${
							thread.isQueued
								? "bg-purple-500/20 text-purple-300"
								: thread.isCallingCharactersTurn
									? "bg-primary/20 text-primary-light"
									: "bg-text-muted/20 text-text-muted"
						}`}
					>
						{thread.isQueued
							? "Queued"
							: thread.isCallingCharactersTurn
								? "Your Turn"
								: "Their Turn"}
					</span>
				</div>
			</div>
		</div>
	);
}
