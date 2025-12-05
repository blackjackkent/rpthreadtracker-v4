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
