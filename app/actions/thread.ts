"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/db";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";

/**
 * Create a new thread
 */
export async function createThread(data: {
	characterId: number;
	postId: string;
	userTitle?: string;
	partnerUrlIdentifier?: string;
	description?: string;
	tags?: string[];
}) {
	const session = await auth();

	if (!session?.user?.id) {
		throw new Error("Unauthorized");
	}

	const {
		characterId,
		postId,
		userTitle,
		partnerUrlIdentifier,
		description,
		tags,
	} = data;

	// Validate required fields
	if (!characterId) {
		throw new Error("Character is required");
	}

	// Verify user owns this character
	const character = await prisma.characters.findUnique({
		where: { CharacterId: characterId },
	});

	if (!character || character.UserId !== session.user.id) {
		throw new Error("Character not found or unauthorized");
	}

	// Validate partner URL identifier if provided
	if (partnerUrlIdentifier && !/^[A-z\d-]+$/.test(partnerUrlIdentifier)) {
		throw new Error(
			"Partner URL Identifier must contain only letters, numbers, and hyphens"
		);
	}

	// Validate description length
	if (description && description.length > 250) {
		throw new Error("Description must be 250 characters or less");
	}

	// Create thread
	const newThread = await prisma.threads.create({
		data: {
			CharacterId: characterId,
			PostId: postId || null,
			UserTitle: userTitle || null,
			PartnerUrlIdentifier: partnerUrlIdentifier || null,
			Description: description || null,
			IsArchived: false,
			DateMarkedQueued: null,
		},
	});

	// Create tags if provided
	if (tags && tags.length > 0) {
		await prisma.threadTags.createMany({
			data: tags.map((tagText) => ({
				TagID: randomUUID(),
				TagText: tagText.substring(0, 140), // Max 140 chars per tag
				ThreadID: newThread.ThreadId,
			})),
		});
	}

	// Revalidate all pages (database data only, not Tumblr status)
	revalidatePath("/", "layout");

	return {
		threadId: newThread.ThreadId,
		characterId: newThread.CharacterId,
		postId: newThread.PostId,
		userTitle: newThread.UserTitle,
		partnerUrlIdentifier: newThread.PartnerUrlIdentifier,
		description: newThread.Description,
		isArchived: newThread.IsArchived,
		dateMarkedQueued: newThread.DateMarkedQueued,
	};
}

/**
 * Update an existing thread
 */
export async function updateThread(data: {
	threadId: number;
	userTitle?: string;
	partnerUrlIdentifier?: string;
	description?: string;
	tags?: string[];
}) {
	const session = await auth();

	if (!session?.user?.id) {
		throw new Error("Unauthorized");
	}

	const { threadId, userTitle, partnerUrlIdentifier, description, tags } = data;

	// Verify user owns this thread (via character)
	const existingThread = await prisma.threads.findUnique({
		where: { ThreadId: threadId },
		include: {
			Characters: true,
		},
	});

	if (!existingThread || existingThread.Characters.UserId !== session.user.id) {
		throw new Error("Thread not found or unauthorized");
	}

	// Validate partner URL identifier if provided
	if (partnerUrlIdentifier && !/^[A-z\d-]+$/.test(partnerUrlIdentifier)) {
		throw new Error(
			"Partner URL Identifier must contain only letters, numbers, and hyphens"
		);
	}

	// Validate description length
	if (description && description.length > 250) {
		throw new Error("Description must be 250 characters or less");
	}

	// Update thread
	const updatedThread = await prisma.threads.update({
		where: { ThreadId: threadId },
		data: {
			...(userTitle !== undefined && { UserTitle: userTitle || null }),
			...(partnerUrlIdentifier !== undefined && {
				PartnerUrlIdentifier: partnerUrlIdentifier || null,
			}),
			...(description !== undefined && { Description: description || null }),
		},
	});

	// Replace tags if provided
	if (tags !== undefined) {
		// Delete existing tags
		await prisma.threadTags.deleteMany({
			where: { ThreadID: threadId },
		});

		// Create new tags
		if (tags.length > 0) {
			await prisma.threadTags.createMany({
				data: tags.map((tagText) => ({
					TagID: randomUUID(),
					TagText: tagText.substring(0, 140),
					ThreadID: threadId,
				})),
			});
		}
	}

	// Revalidate all pages
	revalidatePath("/", "layout");

	return {
		threadId: updatedThread.ThreadId,
		characterId: updatedThread.CharacterId,
		postId: updatedThread.PostId,
		userTitle: updatedThread.UserTitle,
		partnerUrlIdentifier: updatedThread.PartnerUrlIdentifier,
		description: updatedThread.Description,
		isArchived: updatedThread.IsArchived,
		dateMarkedQueued: updatedThread.DateMarkedQueued,
	};
}

/**
 * Archive a thread
 */
export async function archiveThread(threadId: number) {
	const session = await auth();

	if (!session?.user?.id) {
		throw new Error("Unauthorized");
	}

	// Verify user owns this thread
	const existingThread = await prisma.threads.findUnique({
		where: { ThreadId: threadId },
		include: {
			Characters: true,
		},
	});

	if (!existingThread || existingThread.Characters.UserId !== session.user.id) {
		throw new Error("Thread not found or unauthorized");
	}

	// Archive thread
	await prisma.threads.update({
		where: { ThreadId: threadId },
		data: {
			IsArchived: true,
		},
	});

	// Revalidate all pages
	revalidatePath("/", "layout");

	return { success: true };
}

/**
 * Unarchive a thread
 */
export async function unarchiveThread(threadId: number) {
	const session = await auth();

	if (!session?.user?.id) {
		throw new Error("Unauthorized");
	}

	// Verify user owns this thread
	const existingThread = await prisma.threads.findUnique({
		where: { ThreadId: threadId },
		include: {
			Characters: true,
		},
	});

	if (!existingThread || existingThread.Characters.UserId !== session.user.id) {
		throw new Error("Thread not found or unauthorized");
	}

	// Unarchive thread
	await prisma.threads.update({
		where: { ThreadId: threadId },
		data: {
			IsArchived: false,
		},
	});

	// Revalidate all pages
	revalidatePath("/", "layout");

	return { success: true };
}

/**
 * Toggle a thread's queued status
 */
export async function toggleThreadQueued(threadId: number) {
	const session = await auth();

	if (!session?.user?.id) {
		throw new Error("Unauthorized");
	}

	// Verify user owns this thread
	const existingThread = await prisma.threads.findUnique({
		where: { ThreadId: threadId },
		include: {
			Characters: true,
		},
	});

	if (!existingThread || existingThread.Characters.UserId !== session.user.id) {
		throw new Error("Thread not found or unauthorized");
	}

	// Toggle queued status
	const newValue = existingThread.DateMarkedQueued ? null : new Date();

	await prisma.threads.update({
		where: { ThreadId: threadId },
		data: {
			DateMarkedQueued: newValue,
		},
	});

	// Revalidate all pages
	revalidatePath("/", "layout");

	return { success: true };
}

/**
 * Delete a thread (untrack)
 */
export async function deleteThread(threadId: number) {
	const session = await auth();

	if (!session?.user?.id) {
		throw new Error("Unauthorized");
	}

	// Verify user owns this thread
	const existingThread = await prisma.threads.findUnique({
		where: { ThreadId: threadId },
		include: {
			Characters: true,
		},
	});

	if (!existingThread || existingThread.Characters.UserId !== session.user.id) {
		throw new Error("Thread not found or unauthorized");
	}

	// Delete thread (cascade will delete tags)
	await prisma.threads.delete({
		where: { ThreadId: threadId },
	});

	// Revalidate all pages
	revalidatePath("/", "layout");

	return { success: true };
}

/**
 * Bulk archive threads
 */
export async function bulkArchiveThreads(threadIds: number[]) {
	const session = await auth();

	if (!session?.user?.id) {
		throw new Error("Unauthorized");
	}

	if (!threadIds || threadIds.length === 0) {
		throw new Error("No threads selected");
	}

	// Verify user owns all threads
	const threads = await prisma.threads.findMany({
		where: {
			ThreadId: { in: threadIds },
		},
		include: {
			Characters: true,
		},
	});

	const unauthorizedThreads = threads.filter(
		(thread) => thread.Characters.UserId !== session.user.id
	);

	if (unauthorizedThreads.length > 0) {
		throw new Error("Unauthorized to modify some threads");
	}

	// Archive all threads
	await prisma.threads.updateMany({
		where: {
			ThreadId: { in: threadIds },
		},
		data: {
			IsArchived: true,
		},
	});

	// Revalidate all pages
	revalidatePath("/", "layout");

	return { success: true, count: threadIds.length };
}

/**
 * Bulk unarchive threads
 */
export async function bulkUnarchiveThreads(threadIds: number[]) {
	const session = await auth();

	if (!session?.user?.id) {
		throw new Error("Unauthorized");
	}

	if (!threadIds || threadIds.length === 0) {
		throw new Error("No threads selected");
	}

	// Verify user owns all threads
	const threads = await prisma.threads.findMany({
		where: {
			ThreadId: { in: threadIds },
		},
		include: {
			Characters: true,
		},
	});

	const unauthorizedThreads = threads.filter(
		(thread) => thread.Characters.UserId !== session.user.id
	);

	if (unauthorizedThreads.length > 0) {
		throw new Error("Unauthorized to modify some threads");
	}

	// Unarchive all threads
	await prisma.threads.updateMany({
		where: {
			ThreadId: { in: threadIds },
		},
		data: {
			IsArchived: false,
		},
	});

	// Revalidate all pages
	revalidatePath("/", "layout");

	return { success: true, count: threadIds.length };
}

/**
 * Bulk toggle threads queued status
 */
export async function bulkToggleThreadsQueued(threadIds: number[]) {
	const session = await auth();

	if (!session?.user?.id) {
		throw new Error("Unauthorized");
	}

	if (!threadIds || threadIds.length === 0) {
		throw new Error("No threads selected");
	}

	// Verify user owns all threads
	const threads = await prisma.threads.findMany({
		where: {
			ThreadId: { in: threadIds },
		},
		include: {
			Characters: true,
		},
	});

	const unauthorizedThreads = threads.filter(
		(thread) => thread.Characters.UserId !== session.user.id
	);

	if (unauthorizedThreads.length > 0) {
		throw new Error("Unauthorized to modify some threads");
	}

	// Toggle each thread individually (since we need to check current state)
	const now = new Date();
	for (const thread of threads) {
		await prisma.threads.update({
			where: { ThreadId: thread.ThreadId },
			data: {
				DateMarkedQueued: thread.DateMarkedQueued ? null : now,
			},
		});
	}

	// Revalidate all pages
	revalidatePath("/", "layout");

	return { success: true, count: threadIds.length };
}

/**
 * Bulk delete threads (untrack)
 */
export async function bulkDeleteThreads(threadIds: number[]) {
	const session = await auth();

	if (!session?.user?.id) {
		throw new Error("Unauthorized");
	}

	if (!threadIds || threadIds.length === 0) {
		throw new Error("No threads selected");
	}

	// Verify user owns all threads
	const threads = await prisma.threads.findMany({
		where: {
			ThreadId: { in: threadIds },
		},
		include: {
			Characters: true,
		},
	});

	const unauthorizedThreads = threads.filter(
		(thread) => thread.Characters.UserId !== session.user.id
	);

	if (unauthorizedThreads.length > 0) {
		throw new Error("Unauthorized to delete some threads");
	}

	// Delete all threads (cascade will delete tags)
	await prisma.threads.deleteMany({
		where: {
			ThreadId: { in: threadIds },
		},
	});

	// Revalidate all pages
	revalidatePath("/", "layout");

	return { success: true, count: threadIds.length };
}
