interface CharacterCardProps {
	character: {
		characterName: string;
		characterUrlIdentifier: string;
		threadCount: number;
	};
}

export function CharacterCard({ character }: CharacterCardProps) {
	const displayName = character.characterName || character.characterUrlIdentifier;

	return (
		<div className="bg-background border border-border rounded-lg p-4 hover:border-primary transition-colors">
			<div className="flex items-start justify-between gap-2">
				<div className="flex-1 min-w-0">
					<h3 className="font-medium text-sm truncate">{displayName}</h3>
					{character.characterName && (
						<p className="text-xs text-text-muted truncate">
							{character.characterUrlIdentifier}
						</p>
					)}
				</div>
				<div className="flex-shrink-0">
					<span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary-light text-xs font-semibold">
						{character.threadCount}
					</span>
				</div>
			</div>
		</div>
	);
}