import { ThreadTag } from "@/types/tumblr";

interface ThreadExpandedRowProps {
	description: string | null;
	tags?: ThreadTag[];
}

export const ThreadExpandedRow = ({
	description,
	tags,
}: ThreadExpandedRowProps) => {
	return (
		<div className="px-6 py-4 bg-background border-t border-border">
			{/* Description section */}
			{description && (
				<div className="mb-3">
					<p className="text-text">{description}</p>
					<hr className="mt-2 border-border" />
				</div>
			)}

			{/* Tags section */}
			<div className="flex flex-wrap gap-2">
				{tags && tags.length > 0 ? (
					tags.map((tag) => (
						<span
							key={tag.tagId}
							className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-primary/20 text-tag-text border border-primary/30"
						>
							#{tag.tagText}
						</span>
					))
				) : (
					<span className="text-text-muted text-sm">
						There are no tags assigned to this thread.
					</span>
				)}
			</div>
		</div>
	);
};
