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
			Characters: {
				select: {
					CharacterName: true,
					UrlIdentifier: true,
				},
			},
		},
	});
}

/**
 * Get recent threads with full details for dashboard
 * Returns threads ordered by most recent activity (DateModified)
 */
export async function getRecentThreads(userId: string, limit = 10) {
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
			DateModified: true,
			DateMarkedQueued: true,
			Characters: {
				select: {
					CharacterName: true,
					UrlIdentifier: true,
				},
			},
		},
		orderBy: {
			DateModified: "desc",
		},
		take: limit,
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
