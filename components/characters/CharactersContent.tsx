"use client";

import { useState } from "react";
import { CharactersTable } from "./CharactersTable";

interface Character {
	characterId: number;
	userId: string;
	characterName: string | null;
	urlIdentifier: string | null;
	isOnHiatus: boolean;
	platformId: number;
	platformName: string;
	threadCount: number;
}

interface CharactersContentProps {
	initialCharacters: Character[];
}

export const CharactersContent = ({
	initialCharacters,
}: CharactersContentProps) => {
	const [characters, setCharacters] = useState<Character[]>(initialCharacters);

	return (
		<div className="space-y-6 p-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-semibold">Manage Characters</h1>
					<p className="text-text-muted mt-1">
						View and manage your roleplaying characters
					</p>
				</div>
				<button className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg transition-colors">
					Add Character
				</button>
			</div>

			<CharactersTable
				characters={characters}
				onCharactersChange={setCharacters}
			/>
		</div>
	);
};