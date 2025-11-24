import { PrismaClient } from "@prisma/client";
import type {
	AspNetUsers,
	Characters,
	Threads,
	ThreadTags,
	Platforms,
	ProfileSettings,
} from "@prisma/client";

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined;
};

export const prisma =
	globalForPrisma.prisma ??
	new PrismaClient({
		log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
	});

if (process.env.NODE_ENV !== "production") {
	globalForPrisma.prisma = prisma;
}

// Re-export Prisma-generated types
export type {
	AspNetUsers,
	Characters,
	Threads,
	ThreadTags,
	Platforms,
	ProfileSettings,
};

// User queries
export async function getUserByEmail(email: string) {
	return prisma.aspNetUsers.findFirst({
		where: {
			NormalizedEmail: email.toUpperCase(),
		},
	});
}

export async function getUserByUsername(username: string) {
	return prisma.aspNetUsers.findFirst({
		where: {
			NormalizedUserName: username.toUpperCase(),
		},
	});
}

export async function updateUserPassword(
	userId: string,
	newPasswordHash: string
): Promise<void> {
	await prisma.aspNetUsers.update({
		where: { Id: userId },
		data: { PasswordHash: newPasswordHash },
	});
}

// Thread queries
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

export async function getQueuedThreadsCount(userId: string): Promise<number> {
	return prisma.threads.count({
		where: {
			Characters: {
				UserId: userId,
			},
			DateMarkedQueued: {
				not: null,
			},
		},
	});
}
