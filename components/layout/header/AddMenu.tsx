"use client";

import { faCirclePlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";

export const AddMenu = () => {
	const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
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
						onClick={() => setIsAddMenuOpen(false)}
						className="w-full text-left px-4 py-2 hover:bg-background transition-colors"
					>
						Track New Thread
					</button>
					<button
						onClick={() => setIsAddMenuOpen(false)}
						className="w-full text-left px-4 py-2 hover:bg-background transition-colors"
					>
						Add Character
					</button>
				</div>
			)}
		</div>
	);
};
