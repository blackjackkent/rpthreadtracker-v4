import { prisma } from "./db";
import { ThreadWithCharacter } from "./types";

export async function getActiveThreadsCount(userId: string): Promise<number> {
	return prisma.threads.count({
		where: {
			Characters: {
				UserId: userId,
			},
			IsArchived: false,
		},
	});
}

export async function getActiveThreadsForUser(
	userId: string
): Promise<ThreadWithCharacter[]> {
	return prisma.threads.findMany({
		where: {
			Characters: {
				UserId: userId,
			},
			IsArchived: false,
		},
		select: {
			ThreadId: true,
			PostId: true,
			UserTitle: true,
			PartnerUrlIdentifier: true,
			DateMarkedQueued: true,
			IsArchived: true,
			Description: true,
			Characters: {
				select: {
					CharacterId: true,
					CharacterName: true,
					UrlIdentifier: true,
					IsOnHiatus: true,
				},
			},
			ThreadTags: {
				select: {
					TagID: true,
					TagText: true,
					ThreadID: true,
				},
			},
		},
	});
}

/**
 * Get queued threads count for a user
 */
export async function getQueuedThreadsCount(userId: string): Promise<number> {
	return prisma.threads.count({
		where: {
			Characters: {
				UserId: userId,
			},
			IsArchived: false,
			DateMarkedQueued: {
				not: null,
			},
		},
	});
}

/**
 * Get archived threads for a user with character details
 */
export async function getArchivedThreadsForUser(
	userId: string
): Promise<ThreadWithCharacter[]> {
	return prisma.threads.findMany({
		where: {
			Characters: {
				UserId: userId,
			},
			IsArchived: true,
		},
		select: {
			ThreadId: true,
			PostId: true,
			UserTitle: true,
			PartnerUrlIdentifier: true,
			DateMarkedQueued: true,
			IsArchived: true,
			Description: true,
			Characters: {
				select: {
					CharacterId: true,
					CharacterName: true,
					UrlIdentifier: true,
					IsOnHiatus: true,
				},
			},
			ThreadTags: {
				select: {
					TagID: true,
					TagText: true,
					ThreadID: true,
				},
			},
		},
		orderBy: {
			UserTitle: "asc",
		},
	});
}

/**
 * Get a single thread by ID (for editing)
 */
export async function getThreadById(threadId: number) {
	return prisma.threads.findUnique({
		where: {
			ThreadId: threadId,
		},
		select: {
			ThreadId: true,
			PostId: true,
			UserTitle: true,
			PartnerUrlIdentifier: true,
			DateMarkedQueued: true,
			IsArchived: true,
			Description: true,
			Characters: {
				select: {
					CharacterId: true,
					CharacterName: true,
					UrlIdentifier: true,
					UserId: true,
				},
			},
			ThreadTags: {
				select: {
					TagID: true,
					TagText: true,
					ThreadID: true,
				},
			},
		},
	});
}
