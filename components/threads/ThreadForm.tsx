"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { MultipleValueTextInput } from "@/components/ui/MultipleValueTextInput";
import type { ThreadStatusWithDetails } from "@/types/tumblr";

export const threadFormSchema = z.object({
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

export type ThreadFormData = z.infer<typeof threadFormSchema>;

export interface ThreadFormCharacter {
	id: number;
	name: string;
	urlIdentifier: string | null;
}

export interface ThreadFormSubmitData {
	characterId: number;
	postId: string;
	userTitle?: string;
	partnerUrlIdentifier?: string;
	description?: string;
	tags?: string[];
}

interface ThreadFormProps {
	onSubmit: (data: ThreadFormSubmitData) => Promise<void>;
	onCancel?: () => void;
	cancelLabel?: string;
	submitLabel?: string;
	threadToEdit?: ThreadStatusWithDetails | null;
	characters: ThreadFormCharacter[];
	isLoading?: boolean;
	defaultPostId?: string;
	defaultCharacterId?: number;
	/** When true, character and postId fields are locked (editing mode) */
	lockIdentifiers?: boolean;
}

export const ThreadForm = ({
	onSubmit,
	onCancel,
	cancelLabel = "Cancel",
	submitLabel,
	threadToEdit,
	characters,
	isLoading = false,
	defaultPostId = "",
	defaultCharacterId,
	lockIdentifiers = false,
}: ThreadFormProps) => {
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
			characterId: threadToEdit?.characterId ?? defaultCharacterId ?? undefined,
			postId: threadToEdit?.postId ?? defaultPostId,
			userTitle: threadToEdit?.userTitle ?? "",
			partnerUrlIdentifier: threadToEdit?.partnerUrlIdentifier ?? "",
			description: threadToEdit?.description ?? "",
		},
	});

	// eslint-disable-next-line react-hooks/incompatible-library
	const description = watch("description");

	useEffect(() => {
		setDescriptionLength(description?.length || 0);
	}, [description]);

	useEffect(() => {
		reset({
			characterId: threadToEdit?.characterId ?? defaultCharacterId ?? undefined,
			postId: threadToEdit?.postId ?? defaultPostId,
			userTitle: threadToEdit?.userTitle ?? "",
			partnerUrlIdentifier: threadToEdit?.partnerUrlIdentifier ?? "",
			description: threadToEdit?.description ?? "",
		});
		setTags(threadToEdit?.tags?.map((t) => t.tagText) ?? []);
	}, [threadToEdit, defaultCharacterId, defaultPostId, reset]);

	const resolvedSubmitLabel =
		submitLabel ?? (threadToEdit ? "Update Thread" : "Track Thread");

	const onSubmitForm = async (data: ThreadFormData) => {
		try {
			await onSubmit({
				characterId: data.characterId,
				postId: data.postId?.trim() ?? "",
				userTitle: data.userTitle?.trim() || undefined,
				partnerUrlIdentifier: data.partnerUrlIdentifier?.trim() || undefined,
				description: data.description?.trim() || undefined,
				tags: tags.length > 0 ? tags : undefined,
			});
		} catch (err) {
			setError("root", {
				message: err instanceof Error ? err.message : "An error occurred",
			});
		}
	};

	return (
		<form onSubmit={handleSubmit(onSubmitForm)}>
			<div className="space-y-4">
				{errors.root && (
					<div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded">
						{errors.root.message}
					</div>
				)}

				{/* Character */}
				<div>
					<label htmlFor="characterId" className="block text-sm font-medium mb-1">
						Character <span className="text-red-500">*</span>
					</label>
					<select
						id="characterId"
						{...register("characterId", {
							setValueAs: (value) => {
								const num = value === "" ? 0 : Number(value);
								return isNaN(num) ? 0 : num;
							},
						})}
						className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
						disabled={isLoading || lockIdentifiers}
					>
						<option value="">Select a character</option>
						{characters.map((char) => (
							<option key={char.id} value={char.id}>
								{char.name || char.urlIdentifier}
							</option>
						))}
					</select>
					{errors.characterId && (
						<p className="mt-1 text-xs text-red-500">{errors.characterId.message}</p>
					)}
				</div>

				{/* Post ID */}
				<div>
					<label htmlFor="postId" className="block text-sm font-medium mb-1">
						Post ID
					</label>
					<input
						type="text"
						id="postId"
						{...register("postId")}
						className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
						placeholder="123456789 (leave blank if you haven't started yet)"
						disabled={isLoading || lockIdentifiers}
					/>
					{errors.postId && (
						<p className="mt-1 text-xs text-red-500">{errors.postId.message}</p>
					)}
					<p className="mt-1 text-xs text-text-muted">
						The post ID is the part of the URL after &quot;.tumblr.com/post/&quot;.
						Leave blank if you haven&apos;t started the thread yet.
					</p>
				</div>

				{/* Thread Title */}
				<div>
					<label htmlFor="userTitle" className="block text-sm font-medium mb-1">
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
				</div>

				{/* Partner URL Identifier */}
				<div>
					<label htmlFor="partnerUrlIdentifier" className="block text-sm font-medium mb-1">
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
						The part of your partner&apos;s Tumblr URL before &quot;.tumblr.com&quot;.
					</p>
				</div>

				{/* Description */}
				<div>
					<label htmlFor="description" className="block text-sm font-medium mb-1">
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
						<p className="mt-1 text-xs text-red-500">{errors.description.message}</p>
					)}
				</div>

				{/* Tags */}
				<div>
					<MultipleValueTextInput
						onItemAdded={(item, all) => {
							if (item.length <= 140) setTags(all);
						}}
						onItemDeleted={(_, all) => setTags(all)}
						label="Tags"
						name="thread-tags"
						placeholder="Add tags (max 140 chars each, separate with COMMA or ENTER)"
						values={tags}
						className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
						labelClassName="block text-sm font-medium mb-1"
						itemClassName="inline-flex items-center gap-1 px-2 py-1 my-2 bg-primary/20 text-tag-text border border-primary/30 rounded text-sm"
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
			<div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-border">
				{onCancel && (
					<button
						type="button"
						onClick={onCancel}
						className="px-4 py-2 text-text-muted hover:text-text transition-colors"
						disabled={isLoading}
					>
						{cancelLabel}
					</button>
				)}
				<button
					type="submit"
					className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					disabled={isLoading}
				>
					{isLoading ? "Saving..." : resolvedSubmitLabel}
				</button>
			</div>
		</form>
	);
};
