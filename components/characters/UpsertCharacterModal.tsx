"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import type { Character } from "./columns";

const characterFormSchema = z.object({
	characterName: z.string().optional(),
	urlIdentifier: z
		.string()
		.min(1, "URL Identifier is required")
		.regex(
			/^[A-Za-z\d-]+$/,
			"URL Identifier must contain only letters, numbers, and hyphens"
		),
});

type CharacterFormData = z.infer<typeof characterFormSchema>;

interface UpsertCharacterModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (data: {
		characterName?: string;
		urlIdentifier: string;
		platformId?: number;
	}) => Promise<void>;
	characterToEdit?: Character | null;
	isLoading?: boolean;
}

export const UpsertCharacterModal = ({
	isOpen,
	onClose,
	onSubmit,
	characterToEdit,
	isLoading = false,
}: UpsertCharacterModalProps) => {
	const {
		register,
		handleSubmit,
		formState: { errors },
		setError,
		reset,
	} = useForm<CharacterFormData>({
		resolver: zodResolver(characterFormSchema),
		defaultValues: {
			characterName: characterToEdit?.characterName || "",
			urlIdentifier: characterToEdit?.urlIdentifier || "",
		},
	});

	// Reset form when characterToEdit changes
	useEffect(() => {
		reset({
			characterName: characterToEdit?.characterName || "",
			urlIdentifier: characterToEdit?.urlIdentifier || "",
		});
	}, [characterToEdit, reset]);

	const onSubmitForm = async (data: CharacterFormData) => {
		try {
			await onSubmit({
				characterName: data.characterName?.trim() || undefined,
				urlIdentifier: data.urlIdentifier.trim(),
				platformId: 1, // Always Tumblr
			});
			onClose();
		} catch (err) {
			setError("root", {
				message: err instanceof Error ? err.message : "An error occurred",
			});
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			{/* Backdrop */}
			<div className="absolute inset-0 bg-black/50" onClick={onClose}></div>

			{/* Modal */}
			<div className="relative bg-surface border border-border rounded-lg shadow-xl w-full max-w-md mx-4">
				{/* Header */}
				<div className="flex items-center justify-between px-6 py-4 border-b border-border">
					<h2 className="text-xl font-semibold">
						{characterToEdit ? "Edit Character" : "Add Character"}
					</h2>
					<button
						onClick={onClose}
						className="text-text-muted hover:text-text transition-colors"
					>
						<FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
					</button>
				</div>

				{/* Body */}
				<form onSubmit={handleSubmit(onSubmitForm)}>
					<div className="px-6 py-4 space-y-4">
						{errors.root && (
							<div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded">
								{errors.root.message}
							</div>
						)}

						{/* Character Name */}
						<div>
							<label
								htmlFor="characterName"
								className="block text-sm font-medium mb-1"
							>
								Character Name
							</label>
							<input
								type="text"
								id="characterName"
								{...register("characterName")}
								className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
								placeholder="Character Name (optional)"
								disabled={isLoading}
							/>
							{errors.characterName && (
								<p className="mt-1 text-xs text-red-500">
									{errors.characterName.message}
								</p>
							)}
						</div>

						{/* Platform (disabled, always Tumblr) */}
						<div>
							<label
								htmlFor="platform"
								className="block text-sm font-medium mb-1"
							>
								Platform
							</label>
							<select
								id="platform"
								disabled
								className="w-full px-3 py-2 bg-background border border-border rounded-lg opacity-60 cursor-not-allowed"
							>
								<option value="1">Tumblr</option>
							</select>
						</div>

						{/* URL Identifier */}
						<div>
							<label
								htmlFor="urlIdentifier"
								className="block text-sm font-medium mb-1"
							>
								Character URL Identifier <span className="text-red-500">*</span>
							</label>
							<input
								type="text"
								id="urlIdentifier"
								{...register("urlIdentifier")}
								className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
								placeholder="myawesomeblog"
								disabled={isLoading}
							/>
							{errors.urlIdentifier && (
								<p className="mt-1 text-xs text-red-500">
									{errors.urlIdentifier.message}
								</p>
							)}
							<p className="mt-1 text-xs text-text-muted">
								For a Tumblr account, this will be the part of your URL before
								&quot;.tumblr.com&quot;. For instance, if your URL is{" "}
								<strong>http://myawesomeblog.tumblr.com</strong>, you would
								enter <strong>myawesomeblog</strong> in this field. (You can
								track more than one character with the same URL, if your blog is
								multi-muse.)
							</p>
						</div>
					</div>

					{/* Footer */}
					<div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 text-text-muted hover:text-text transition-colors"
							disabled={isLoading}
						>
							Cancel
						</button>
						<button
							type="submit"
							className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							disabled={isLoading}
						>
							{isLoading ? "Saving..." : "Submit Character"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};
