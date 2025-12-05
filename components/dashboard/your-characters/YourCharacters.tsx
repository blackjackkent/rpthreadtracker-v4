"use client";

import { useThreadStatus } from "@/components/providers/ThreadStatusProvider";
import { CharacterCard } from "./CharacterCard";
import { useMemo } from "react";

export function YourCharacters() {
	const { threadStatuses } = useThreadStatus();

	// Group threads by character and count them
	const characters = useMemo(() => {
		const characterMap = new Map<
			string,
			{
				characterName: string;
				characterUrlIdentifier: string;
				threadCount: number;
			}
		>();

		for (const thread of threadStatuses.values()) {
			const key = thread.characterUrlIdentifier;
			if (key) {
				const existing = characterMap.get(key);
				if (existing) {
					existing.threadCount++;
				} else {
					characterMap.set(key, {
						characterName: thread.characterName,
						characterUrlIdentifier: thread.characterUrlIdentifier,
						threadCount: 1,
					});
				}
			}
		}

		// Convert to array and sort by name
		return Array.from(characterMap.values()).sort((a, b) =>
			(a.characterName || a.characterUrlIdentifier).localeCompare(
				b.characterName || b.characterUrlIdentifier
			)
		);
	}, [threadStatuses]);

	if (characters.length === 0) {
		return (
			<div className="bg-surface border border-border rounded-lg p-6">
				<h2 className="text-xl font-semibold mb-4">Your Characters</h2>
				<p className="text-text-muted text-sm">
					No active characters. Start tracking threads to see your characters
					here!
				</p>
			</div>
		);
	}

	return (
		<div className="bg-surface border border-border rounded-lg p-6">
			<h2 className="text-xl font-semibold mb-4">Your Characters</h2>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{characters.map((character) => (
					<CharacterCard
						key={character.characterUrlIdentifier}
						character={character}
					/>
				))}
			</div>
		</div>
	);
}