"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { CharactersTable } from "./CharactersTable";
import { UpsertCharacterModal } from "./UpsertCharacterModal";
import type { Character } from "./columns";
import {
	createCharacter,
	updateCharacter,
	toggleCharacterHiatus,
	deleteCharacter,
} from "@/app/actions/character";

interface CharactersContentProps {
	initialCharacters: Character[];
}

export const CharactersContent = ({
	initialCharacters,
}: CharactersContentProps) => {
	const router = useRouter();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [characterToEdit, setCharacterToEdit] = useState<Character | null>(
		null
	);
	const [isLoading, setIsLoading] = useState(false);

	const handleOpenAddModal = () => {
		setCharacterToEdit(null);
		setIsModalOpen(true);
	};

	const handleOpenEditModal = (character: Character) => {
		setCharacterToEdit(character);
		setIsModalOpen(true);
	};

	const handleCloseModal = () => {
		setIsModalOpen(false);
		setCharacterToEdit(null);
	};

	const handleSubmit = async (data: {
		characterName?: string;
		urlIdentifier: string;
		platformId?: number;
	}) => {
		setIsLoading(true);
		try {
			if (characterToEdit) {
				// Update existing character
				await updateCharacter({
					characterId: characterToEdit.characterId,
					...data,
				});
				toast.success("Character updated!");
			} else {
				// Create new character
				await createCharacter(data);
				toast.success("Character created!");
			}
			router.refresh();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "An error occurred");
			throw error; // Re-throw so modal can handle it
		} finally {
			setIsLoading(false);
		}
	};

	const handleToggleHiatus = async (character: Character) => {
		try {
			await toggleCharacterHiatus(character.characterId);
			toast.success(
				character.isOnHiatus
					? "Character set off hiatus!"
					: "Character set on hiatus!"
			);
			router.refresh();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "An error occurred");
		}
	};

	const handleDelete = async (character: Character) => {
		if (
			!confirm(
				`Are you sure you want to untrack ${character.characterName || character.urlIdentifier}? This will also untrack all associated threads.`
			)
		) {
			return;
		}

		try {
			await deleteCharacter(character.characterId);
			toast.success("Character untracked!");
			router.refresh();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "An error occurred");
		}
	};

	return (
		<div className="space-y-6 p-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-semibold">Manage Characters</h1>
					<p className="text-text-muted mt-1">
						View and manage your roleplaying characters
					</p>
				</div>
				<button
					onClick={handleOpenAddModal}
					className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg transition-colors"
				>
					Add Character
				</button>
			</div>

			<CharactersTable
				characters={initialCharacters}
				onEdit={handleOpenEditModal}
				onToggleHiatus={handleToggleHiatus}
				onDelete={handleDelete}
			/>

			<UpsertCharacterModal
				key={characterToEdit?.characterId || (isModalOpen ? "new" : "closed")}
				isOpen={isModalOpen}
				onClose={handleCloseModal}
				onSubmit={handleSubmit}
				characterToEdit={characterToEdit}
				isLoading={isLoading}
			/>
		</div>
	);
};