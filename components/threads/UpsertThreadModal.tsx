"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { MultipleValueTextInput } from "@/components/ui/MultipleValueTextInput";
import type { ThreadStatusWithDetails } from "@/types/tumblr";

const threadFormSchema = z.object({
	characterId: z.number().min(1, "Please select a character"),
	postId: z.string().optional().or(z.literal("")),
	userTitle: z.string().optional(),
	partnerUrlIdentifier: z
		.string()
		.regex(
			/^[A-Za-z\d-]*$/,
			"Partner URL must contain only letters, numbers, and hyphens"
		)
		.optional()
		.or(z.literal("")),
	description: z
		.string()
		.max(250, "Description must be 250 characters or less")
		.optional()
		.or(z.literal("")),
});

type ThreadFormData = z.infer<typeof threadFormSchema>;

interface Character {
	id: number;
	name: string;
	urlIdentifier: string;
}

interface UpsertThreadModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (data: {
		characterId: number;
		postId: string;
		userTitle?: string;
		partnerUrlIdentifier?: string;
		description?: string;
		tags?: string[];
	}) => Promise<void>;
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
	const [tags, setTags] = useState<string[]>([]);
	const [descriptionLength, setDescriptionLength] = useState(0);

	const {
		register,
		handleSubmit,
		formState: { errors },
		setError,
		reset,
		watch,
	} = useForm<ThreadFormData>({
		resolver: zodResolver(threadFormSchema),
		defaultValues: {
			characterId: threadToEdit?.characterId || undefined,
			postId: threadToEdit?.postId || "",
			userTitle: threadToEdit?.userTitle || "",
			partnerUrlIdentifier: threadToEdit?.partnerUrlIdentifier || "",
			description: threadToEdit?.description || "",
		},
	});

	const description = watch("description");

	// Update description length
	useEffect(() => {
		setDescriptionLength(description?.length || 0);
	}, [description]);

	// Reset form and tags when threadToEdit changes
	useEffect(() => {
		reset({
			characterId: threadToEdit?.characterId || undefined,
			postId: threadToEdit?.postId || "",
			userTitle: threadToEdit?.userTitle || "",
			partnerUrlIdentifier: threadToEdit?.partnerUrlIdentifier || "",
			description: threadToEdit?.description || "",
		});
		setTags(threadToEdit?.tags?.map((t) => t.tagText) || []);
	}, [threadToEdit, reset]);

	const handleTagAdded = (item: string, allItems: string[]) => {
		// Limit tag length to 140 chars
		if (item.length <= 140) {
			setTags(allItems);
		}
	};

	const handleTagDeleted = (item: string, allItems: string[]) => {
		setTags(allItems);
	};

	const onSubmitForm = async (data: ThreadFormData) => {
		try {
			await onSubmit({
				characterId: data.characterId,
				postId: data.postId?.trim() || "",
				userTitle: data.userTitle?.trim() || undefined,
				partnerUrlIdentifier: data.partnerUrlIdentifier?.trim() || undefined,
				description: data.description?.trim() || undefined,
				tags: tags.length > 0 ? tags : undefined,
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
				<form onSubmit={handleSubmit(onSubmitForm)}>
					<div className="px-6 py-4 space-y-4">
						{errors.root && (
							<div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded">
								{errors.root.message}
							</div>
						)}

						{/* Character */}
						<div>
							<label
								htmlFor="characterId"
								className="block text-sm font-medium mb-1"
							>
								Character <span className="text-red-500">*</span>
							</label>
							<select
								id="characterId"
								{...register("characterId", {
									setValueAs: (value) => {
										// Convert empty string to 0, otherwise parse as number
										const num = value === "" ? 0 : Number(value);
										// If it's NaN, return 0
										return isNaN(num) ? 0 : num;
									},
								})}
								className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
								disabled={isLoading || !!threadToEdit}
							>
								<option value="">Select a character</option>
								{characters.map((char) => (
									<option key={char.id} value={char.id}>
										{char.name || char.urlIdentifier}
									</option>
								))}
							</select>
							{errors.characterId && (
								<p className="mt-1 text-xs text-red-500">
									{errors.characterId.message}
								</p>
							)}
						</div>

						{/* Post ID */}
						<div>
							<label
								htmlFor="postId"
								className="block text-sm font-medium mb-1"
							>
								Post ID
							</label>
							<input
								type="text"
								id="postId"
								{...register("postId")}
								className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
								placeholder="123456789 (leave blank if you haven't started yet)"
								disabled={isLoading || !!threadToEdit}
							/>
							{errors.postId && (
								<p className="mt-1 text-xs text-red-500">
									{errors.postId.message}
								</p>
							)}
							<p className="mt-1 text-xs text-text-muted">
								<span>
									The post ID is the part of the URL after
									&quot;.tumblr.com/post/&quot;. For instance, if the post is at{" "}
									<strong>http://myawesomeblog.tumblr.com/post/12345</strong>,
									you would enter <strong>12345</strong>. Leave blank if you
									haven&apos;t started the thread yet (it will be marked as your
									turn).
								</span>
							</p>
						</div>

						{/* Thread Title */}
						<div>
							<label
								htmlFor="userTitle"
								className="block text-sm font-medium mb-1"
							>
								Thread Title
							</label>
							<input
								type="text"
								id="userTitle"
								{...register("userTitle")}
								className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
								placeholder="Optional thread title"
								disabled={isLoading}
							/>
							{errors.userTitle && (
								<p className="mt-1 text-xs text-red-500">
									{errors.userTitle.message}
								</p>
							)}
						</div>

						{/* Partner URL Identifier */}
						<div>
							<label
								htmlFor="partnerUrlIdentifier"
								className="block text-sm font-medium mb-1"
							>
								Partner URL Identifier
							</label>
							<input
								type="text"
								id="partnerUrlIdentifier"
								{...register("partnerUrlIdentifier")}
								className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
								placeholder="partnerblog"
								disabled={isLoading}
							/>
							{errors.partnerUrlIdentifier && (
								<p className="mt-1 text-xs text-red-500">
									{errors.partnerUrlIdentifier.message}
								</p>
							)}
							<p className="mt-1 text-xs text-text-muted">
								<span>
									For a Tumblr account, this will be the part of your thread
									partner&apos;s URL before &quot;.tumblr.com&quot;. For
									instance, if your URL is{" "}
									<strong>http://myawesomeblog.tumblr.com</strong>, you would
									enter <strong>myawesomeblog</strong> in this field.
								</span>
							</p>
						</div>

						{/* Description */}
						<div>
							<label
								htmlFor="description"
								className="block text-sm font-medium mb-1"
							>
								Description ({descriptionLength}/250)
							</label>
							<textarea
								id="description"
								{...register("description")}
								className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
								placeholder="Optional thread description"
								rows={3}
								disabled={isLoading}
							/>
							{errors.description && (
								<p className="mt-1 text-xs text-red-500">
									{errors.description.message}
								</p>
							)}
						</div>

						{/* Tags */}
						<div>
							<MultipleValueTextInput
								onItemAdded={handleTagAdded}
								onItemDeleted={handleTagDeleted}
								label="Tags"
								name="thread-tags"
								placeholder="Add tags (max 140 chars each, separate with COMMA or ENTER)"
								values={tags}
								className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
								labelClassName="block text-sm font-medium mb-1"
								itemClassName="inline-flex items-center gap-1 px-2 py-1 my-2 bg-primary/20 text-primary border border-primary/30 rounded text-sm"
								deleteButton={
									<span className="text-text-muted hover:text-text">
										<FontAwesomeIcon icon={faTimes} className="w-3 h-3" />
									</span>
								}
							/>
							<p className="mt-1 text-xs text-text-muted">
								Tags help you organize and filter your threads
							</p>
						</div>
					</div>

					{/* Footer */}
					<div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border sticky bottom-0 bg-surface">
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
							{isLoading
								? "Saving..."
								: threadToEdit
								? "Update Thread"
								: "Track Thread"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};
