"use client";

import { useThreadStatus } from "@/components/providers/ThreadStatusProvider";
import { CharacterCard } from "./CharacterCard";
import { useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsers } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";

export function YourCharacters() {
	const { threadStatuses, characters: allCharacters } = useThreadStatus();

	// Count active threads per character
	const characters = useMemo(() => {
		const threadCountByCharId = new Map<number, number>();
		for (const thread of threadStatuses.values()) {
			if (!thread.isArchived) {
				const count = threadCountByCharId.get(thread.characterId) ?? 0;
				threadCountByCharId.set(thread.characterId, count + 1);
			}
		}

		// Use the full character list as source of truth so zero-thread characters appear
		return [...allCharacters]
			.map((char) => ({
				characterName: char.name,
				characterUrlIdentifier: char.urlIdentifier,
				threadCount: threadCountByCharId.get(char.id) ?? 0,
			}))
			.sort((a, b) =>
				(a.characterName || a.characterUrlIdentifier).localeCompare(
					b.characterName || b.characterUrlIdentifier
				)
			);
	}, [threadStatuses, allCharacters]);

	if (characters.length === 0) {
		return (
			<div className="bg-surface border border-border rounded-lg shadow-sm flex flex-col md:h-[400px]">
				<div className="px-4 py-3 border-b-2 border-primary bg-linear-to-r from-primary/5 to-transparent">
					<div className="flex items-center justify-between">
						<h2 className="text-lg font-semibold flex items-center gap-2">
							<FontAwesomeIcon icon={faUsers} className="w-4 h-4 text-primary" />
							<span>Your Characters</span>
						</h2>
						<Link
							href="/manage-characters"
							className="text-xs text-primary hover:underline"
						>
							Manage Characters
						</Link>
					</div>
				</div>
				<div className="p-4">
					<p className="text-text-muted text-sm">
						No active characters. Start tracking threads to see your characters
						here!
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="bg-surface border border-border rounded-lg shadow-sm flex flex-col md:h-[400px]">
			<div className="px-4 py-3 border-b-2 border-primary bg-linear-to-r from-primary/5 to-transparent">
				<div className="flex items-center justify-between">
					<h2 className="text-lg font-semibold flex items-center gap-2">
						<FontAwesomeIcon icon={faUsers} className="w-4 h-4 text-primary" />
						<span>Your Characters</span>
					</h2>
					<Link
						href="/manage-characters"
						className="text-xs text-primary hover:underline"
					>
						Manage Characters
					</Link>
				</div>
			</div>
			<div className="flex-1 overflow-y-auto p-4">
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
					{characters.map((character) => (
						<CharacterCard
							key={character.characterUrlIdentifier}
							character={character}
						/>
					))}
				</div>
			</div>
		</div>
	);
}