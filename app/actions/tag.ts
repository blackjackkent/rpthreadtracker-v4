"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/db";
import { revalidatePath } from "next/cache";

export interface TagWithCount {
	displayText: string;
	count: number;
}

export async function getAllTagsForUser(): Promise<TagWithCount[]> {
	const session = await auth();
	if (!session?.user?.id) throw new Error("Unauthorized");

	const tags = await prisma.threadTags.findMany({
		where: {
			Threads: {
				Characters: {
					UserId: session.user.id,
				},
			},
		},
		select: {
			TagText: true,
		},
	});

	// Case-insensitive dedup, preserving first-seen display text, with count
	const tagMap = new Map<string, TagWithCount>();
	for (const tag of tags) {
		const key = tag.TagText.toLowerCase();
		if (!tagMap.has(key)) {
			tagMap.set(key, { displayText: tag.TagText, count: 1 });
		} else {
			tagMap.get(key)!.count++;
		}
	}

	return Array.from(tagMap.values()).sort((a, b) =>
		a.displayText.localeCompare(b.displayText)
	);
}

export async function bulkRenameTag(
	currentTag: string,
	newTag: string
): Promise<void> {
	const session = await auth();
	if (!session?.user?.id) throw new Error("Unauthorized");

	await prisma.threadTags.updateMany({
		where: {
			TagText: currentTag,
			Threads: {
				Characters: {
					UserId: session.user.id,
				},
			},
		},
		data: {
			TagText: newTag.trim(),
		},
	});

	revalidatePath("/", "layout");
}

export async function bulkDeleteTag(tagText: string): Promise<void> {
	const session = await auth();
	if (!session?.user?.id) throw new Error("Unauthorized");

	await prisma.threadTags.deleteMany({
		where: {
			TagText: tagText,
			Threads: {
				Characters: {
					UserId: session.user.id,
				},
			},
		},
	});

	revalidatePath("/", "layout");
}
