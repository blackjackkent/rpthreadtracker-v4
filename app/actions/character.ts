"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/db";
import { revalidatePath } from "next/cache";

/**
 * Create a new character
 */
export async function createCharacter(data: {
	characterName?: string;
	urlIdentifier: string;
	platformId?: number;
}) {
	const session = await auth();

	if (!session?.user?.id) {
		throw new Error("Unauthorized");
	}

	const { characterName, urlIdentifier, platformId } = data;

	// Validate required fields
	if (!urlIdentifier) {
		throw new Error("URL Identifier is required");
	}

	// Validate URL identifier pattern (alphanumeric and hyphens only)
	if (!/^[A-z\d-]+$/.test(urlIdentifier)) {
		throw new Error(
			"URL Identifier must contain only letters, numbers, and hyphens"
		);
	}

	// Create character
	const newCharacter = await prisma.characters.create({
		data: {
			UserId: session.user.id,
			CharacterName: characterName || null,
			UrlIdentifier: urlIdentifier,
			PlatformId: platformId || 1, // Default to Tumblr
			IsOnHiatus: false,
		},
		include: {
			Platforms: true,
		},
	});

	// Revalidate all pages (but not client components like ThreadStatusProvider)
	revalidatePath("/", "layout");

	// Transform to consistent format
	return {
		characterId: newCharacter.CharacterId,
		userId: newCharacter.UserId,
		characterName: newCharacter.CharacterName,
		urlIdentifier: newCharacter.UrlIdentifier,
		isOnHiatus: newCharacter.IsOnHiatus,
		platformId: newCharacter.PlatformId,
		platformName: newCharacter.Platforms.PlatformName?.trim() || "Unknown",
		threadCount: 0, // New character has no threads
	};
}

/**
 * Update an existing character
 */
export async function updateCharacter(data: {
	characterId: number;
	characterName?: string;
	urlIdentifier?: string;
	isOnHiatus?: boolean;
	platformId?: number;
}) {
	const session = await auth();

	if (!session?.user?.id) {
		throw new Error("Unauthorized");
	}

	const { characterId, characterName, urlIdentifier, isOnHiatus, platformId } =
		data;

	// Verify user owns this character
	const existingCharacter = await prisma.characters.findUnique({
		where: { CharacterId: characterId },
	});

	if (!existingCharacter || existingCharacter.UserId !== session.user.id) {
		throw new Error("Character not found or unauthorized");
	}

	// Validate URL identifier if provided
	if (urlIdentifier && !/^[A-z\d-]+$/.test(urlIdentifier)) {
		throw new Error(
			"URL Identifier must contain only letters, numbers, and hyphens"
		);
	}

	// Update character
	const updatedCharacter = await prisma.characters.update({
		where: { CharacterId: characterId },
		data: {
			...(characterName !== undefined && { CharacterName: characterName }),
			...(urlIdentifier !== undefined && { UrlIdentifier: urlIdentifier }),
			...(isOnHiatus !== undefined && { IsOnHiatus: isOnHiatus }),
			...(platformId !== undefined && { PlatformId: platformId }),
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
	});

	// Revalidate all pages
	revalidatePath("/", "layout");

	// Transform to consistent format
	return {
		characterId: updatedCharacter.CharacterId,
		userId: updatedCharacter.UserId,
		characterName: updatedCharacter.CharacterName,
		urlIdentifier: updatedCharacter.UrlIdentifier,
		isOnHiatus: updatedCharacter.IsOnHiatus,
		platformId: updatedCharacter.PlatformId,
		platformName: updatedCharacter.Platforms.PlatformName?.trim() || "Unknown",
		threadCount: updatedCharacter._count.Threads,
	};
}

/**
 * Toggle a character's hiatus status
 */
export async function toggleCharacterHiatus(characterId: number) {
	const session = await auth();

	if (!session?.user?.id) {
		throw new Error("Unauthorized");
	}

	// Verify user owns this character
	const existingCharacter = await prisma.characters.findUnique({
		where: { CharacterId: characterId },
	});

	if (!existingCharacter || existingCharacter.UserId !== session.user.id) {
		throw new Error("Character not found or unauthorized");
	}

	// Toggle hiatus status
	const updatedCharacter = await prisma.characters.update({
		where: { CharacterId: characterId },
		data: {
			IsOnHiatus: !existingCharacter.IsOnHiatus,
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
	});

	// Revalidate all pages
	revalidatePath("/", "layout");

	// Transform to consistent format
	return {
		characterId: updatedCharacter.CharacterId,
		userId: updatedCharacter.UserId,
		characterName: updatedCharacter.CharacterName,
		urlIdentifier: updatedCharacter.UrlIdentifier,
		isOnHiatus: updatedCharacter.IsOnHiatus,
		platformId: updatedCharacter.PlatformId,
		platformName: updatedCharacter.Platforms.PlatformName?.trim() || "Unknown",
		threadCount: updatedCharacter._count.Threads,
	};
}

/**
 * Delete a character (and all associated threads)
 */
export async function deleteCharacter(characterId: number) {
	const session = await auth();

	if (!session?.user?.id) {
		throw new Error("Unauthorized");
	}

	// Verify user owns this character
	const existingCharacter = await prisma.characters.findUnique({
		where: { CharacterId: characterId },
	});

	if (!existingCharacter || existingCharacter.UserId !== session.user.id) {
		throw new Error("Character not found or unauthorized");
	}

	// Delete character (cascade will delete associated threads)
	await prisma.characters.delete({
		where: { CharacterId: characterId },
	});

	// Revalidate all pages
	revalidatePath("/", "layout");

	return { success: true };
}
