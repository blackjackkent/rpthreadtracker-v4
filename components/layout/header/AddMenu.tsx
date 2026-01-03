"use client";

import { faCirclePlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";

interface AddMenuProps {
	onAddCharacter: () => void;
	onAddThread: () => void;
}

export const AddMenu = ({ onAddCharacter, onAddThread }: AddMenuProps) => {
	const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

	const handleAddCharacter = () => {
		setIsAddMenuOpen(false);
		onAddCharacter();
	};

	const handleAddThread = () => {
		setIsAddMenuOpen(false);
		onAddThread();
	};

	return (
		<div className="relative">
			<button
				onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
				className="p-1.5 hover:bg-primary-dark rounded transition-colors"
				aria-label="Add menu"
			>
				<FontAwesomeIcon icon={faCirclePlus} className="w-4 h-4" />
			</button>
			{isAddMenuOpen && (
				<div className="absolute right-0 mt-2 w-48 bg-surface border border-border rounded shadow-lg">
					<button
						onClick={handleAddThread}
						className="w-full text-left px-4 py-2 text-text hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
					>
						Track New Thread
					</button>
					<button
						onClick={handleAddCharacter}
						className="w-full text-left px-4 py-2 text-text hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
					>
						Add Character
					</button>
				</div>
			)}
		</div>
	);
};
