import { prisma } from "./db";

/**
 * Get all active characters for a user with their thread counts
 */
export async function getCharactersWithThreadCounts(userId: string) {
	const characters = await prisma.characters.findMany({
		where: {
			UserId: userId,
			IsOnHiatus: false,
		},
		select: {
			CharacterId: true,
			CharacterName: true,
			UrlIdentifier: true,
			_count: {
				select: {
					Threads: {
						where: {
							IsArchived: false,
						},
					},
				},
			},
		},
		orderBy: {
			CharacterName: "asc",
		},
	});

	// Transform to a more friendly format
	return characters.map((char) => ({
		characterId: char.CharacterId,
		characterName: char.CharacterName,
		urlIdentifier: char.UrlIdentifier,
		threadCount: char._count.Threads,
	}));
}

/**
 * Get all active characters for a user (simple list for dropdowns)
 */
export async function getActiveCharacters(userId: string) {
	const characters = await prisma.characters.findMany({
		where: {
			UserId: userId,
			IsOnHiatus: false,
		},
		select: {
			CharacterId: true,
			CharacterName: true,
			UrlIdentifier: true,
		},
		orderBy: {
			CharacterName: "asc",
		},
	});

	return characters.map((char) => ({
		id: char.CharacterId,
		name: char.CharacterName || "",
		urlIdentifier: char.UrlIdentifier,
	}));
}

/**
 * Get all characters for a user (including those on hiatus) for management page
 */
export async function getAllCharactersForManagement(userId: string) {
	const characters = await prisma.characters.findMany({
		where: {
			UserId: userId,
		},
		include: {
			Platforms: true,
			_count: {
				select: {
					Threads: {
						where: {
							IsArchived: false,
						},
					},
				},
			},
		},
		orderBy: [{ IsOnHiatus: "asc" }, { CharacterName: "asc" }],
	});

	// Transform to a cleaner format
	return characters.map((char) => ({
		characterId: char.CharacterId,
		userId: char.UserId,
		characterName: char.CharacterName,
		urlIdentifier: char.UrlIdentifier,
		isOnHiatus: char.IsOnHiatus,
		platformId: char.PlatformId,
		platformName: char.Platforms.PlatformName?.trim() || "Unknown",
		threadCount: char._count.Threads,
	}));
}
