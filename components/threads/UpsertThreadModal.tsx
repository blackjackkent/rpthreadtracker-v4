"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { ThreadForm, type ThreadFormSubmitData } from "./ThreadForm";
import type { ThreadStatusWithDetails } from "@/types/tumblr";

interface Character {
	id: number;
	name: string;
	urlIdentifier: string | null;
}

interface UpsertThreadModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (data: ThreadFormSubmitData) => Promise<void>;
	threadToEdit?: ThreadStatusWithDetails | null;
	characters: Character[];
	isLoading?: boolean;
}

export const UpsertThreadModal = ({
	isOpen,
	onClose,
	onSubmit,
	threadToEdit,
	characters,
	isLoading = false,
}: UpsertThreadModalProps) => {
	if (!isOpen) return null;

	const handleSubmit = async (data: ThreadFormSubmitData) => {
		await onSubmit(data);
		onClose();
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			{/* Backdrop */}
			<div className="absolute inset-0 bg-black/50" onClick={onClose} />

			{/* Modal */}
			<div className="relative bg-surface border border-border rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
				{/* Header */}
				<div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-surface z-10">
					<h2 className="text-xl font-semibold">
						{threadToEdit ? "Edit Thread" : "Track New Thread"}
					</h2>
					<button
						onClick={onClose}
						className="text-text-muted hover:text-text transition-colors"
					>
						<FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
					</button>
				</div>

				{/* Body */}
				<div className="px-6 py-4">
					<ThreadForm
						onSubmit={handleSubmit}
						onCancel={onClose}
						threadToEdit={threadToEdit}
						characters={characters}
						isLoading={isLoading}
						lockIdentifiers={!!threadToEdit}
					/>
				</div>
			</div>
		</div>
	);
};
