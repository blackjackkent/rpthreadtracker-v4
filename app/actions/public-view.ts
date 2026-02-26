"use server";

import { auth } from "@/lib/auth";
import {
	getPublicViewsForUser,
	isSlugAvailableForUser,
	parsePublicView,
	PublicView,
} from "@/lib/db/public-view";
import { getActiveCharacters } from "@/lib/db/character";
import { prisma } from "@/lib/db/db";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";

export type { PublicView };

export interface PublicViewFormData {
	name: string;
	slug: string;
	includeMyTurn: boolean;
	includeTheirTurn: boolean;
	includeQueued: boolean;
	includeArchived: boolean;
	columns: string[];
	sortKey: string;
	sortDescending: boolean;
	characterIds: number[] | null;
	tags: string[] | null;
}

export interface PublicViewFormLoadData {
	characters: { id: number; name: string; urlIdentifier: string | null }[];
	tags: string[];
}

export async function getPublicViews(): Promise<{
	views: PublicView[];
	username: string;
}> {
	const session = await auth();
	if (!session?.user?.id) throw new Error("Unauthorized");

	const views = await getPublicViewsForUser(session.user.id);
	return { views, username: session.user.name || "" };
}

export async function getPublicViewFormData(): Promise<PublicViewFormLoadData> {
	const session = await auth();
	if (!session?.user?.id) throw new Error("Unauthorized");

	const characters = await getActiveCharacters(session.user.id);

	const tagRows = await prisma.threadTags.findMany({
		where: {
			Threads: {
				Characters: { UserId: session.user.id },
			},
		},
		select: { TagText: true },
		distinct: ["TagText"],
		orderBy: { TagText: "asc" },
	});

	return {
		characters,
		tags: tagRows.map((t) => t.TagText),
	};
}

export async function checkSlugAvailability(
	slug: string,
	excludeId?: string
): Promise<boolean> {
	const session = await auth();
	if (!session?.user?.id) throw new Error("Unauthorized");
	return isSlugAvailableForUser(session.user.id, slug, excludeId);
}

export async function createPublicView(
	data: PublicViewFormData
): Promise<PublicView> {
	const session = await auth();
	if (!session?.user?.id) throw new Error("Unauthorized");

	if (!data.name?.trim()) throw new Error("Name is required");
	if (!data.slug?.trim()) throw new Error("Slug is required");
	if (!/^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/.test(data.slug)) {
		throw new Error(
			"Slug must contain only letters, numbers, and hyphens (no leading/trailing hyphens)"
		);
	}
	if (data.columns.length === 0)
		throw new Error("At least one column is required");
	if (
		!data.includeMyTurn &&
		!data.includeTheirTurn &&
		!data.includeQueued &&
		!data.includeArchived
	) {
		throw new Error("At least one status filter must be selected");
	}

	const available = await isSlugAvailableForUser(session.user.id, data.slug);
	if (!available)
		throw new Error("A public view with this slug already exists");

	const row = await prisma.publicViews.create({
		data: {
			Id: randomUUID(),
			UserId: session.user.id,
			Name: data.name.trim(),
			Slug: data.slug.trim(),
			IncludeMyTurn: data.includeMyTurn,
			IncludeTheirTurn: data.includeTheirTurn,
			IncludeQueued: data.includeQueued,
			IncludeArchived: data.includeArchived,
			Columns: JSON.stringify(data.columns),
			SortKey: data.sortKey,
			SortDescending: data.sortDescending,
			CharacterIds: data.characterIds
				? JSON.stringify(data.characterIds)
				: null,
			Tags: data.tags ? JSON.stringify(data.tags) : null,
		},
	});

	revalidatePath("/", "layout");
	return parsePublicView(row);
}

export async function updatePublicView(
	id: string,
	data: PublicViewFormData
): Promise<PublicView> {
	const session = await auth();
	if (!session?.user?.id) throw new Error("Unauthorized");

	const existing = await prisma.publicViews.findUnique({
		where: { Id: id },
		select: { UserId: true },
	});
	if (!existing || existing.UserId !== session.user.id) {
		throw new Error("Public view not found or unauthorized");
	}

	if (!data.name?.trim()) throw new Error("Name is required");
	if (!data.slug?.trim()) throw new Error("Slug is required");
	if (!/^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/.test(data.slug)) {
		throw new Error(
			"Slug must contain only letters, numbers, and hyphens (no leading/trailing hyphens)"
		);
	}
	if (data.columns.length === 0)
		throw new Error("At least one column is required");
	if (
		!data.includeMyTurn &&
		!data.includeTheirTurn &&
		!data.includeQueued &&
		!data.includeArchived
	) {
		throw new Error("At least one status filter must be selected");
	}

	const available = await isSlugAvailableForUser(session.user.id, data.slug, id);
	if (!available)
		throw new Error("A public view with this slug already exists");

	const row = await prisma.publicViews.update({
		where: { Id: id },
		data: {
			Name: data.name.trim(),
			Slug: data.slug.trim(),
			IncludeMyTurn: data.includeMyTurn,
			IncludeTheirTurn: data.includeTheirTurn,
			IncludeQueued: data.includeQueued,
			IncludeArchived: data.includeArchived,
			Columns: JSON.stringify(data.columns),
			SortKey: data.sortKey,
			SortDescending: data.sortDescending,
			CharacterIds: data.characterIds
				? JSON.stringify(data.characterIds)
				: null,
			Tags: data.tags ? JSON.stringify(data.tags) : null,
		},
	});

	revalidatePath("/", "layout");
	return parsePublicView(row);
}

export async function deletePublicView(id: string): Promise<void> {
	const session = await auth();
	if (!session?.user?.id) throw new Error("Unauthorized");

	const existing = await prisma.publicViews.findUnique({
		where: { Id: id },
		select: { UserId: true },
	});
	if (!existing || existing.UserId !== session.user.id) {
		throw new Error("Public view not found or unauthorized");
	}

	await prisma.publicViews.delete({ where: { Id: id } });
	revalidatePath("/", "layout");
}
