import { prisma } from "./db";
import { ThreadWithCharacter } from "./types";

export interface PublicView {
	id: string;
	userId: string;
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

export function parsePublicView(row: {
	Id: string;
	UserId: string;
	Name: string;
	Slug: string;
	IncludeMyTurn: boolean;
	IncludeTheirTurn: boolean;
	IncludeQueued: boolean;
	IncludeArchived: boolean;
	Columns: string;
	SortKey: string;
	SortDescending: boolean;
	CharacterIds: string | null;
	Tags: string | null;
}): PublicView {
	return {
		id: row.Id,
		userId: row.UserId,
		name: row.Name,
		slug: row.Slug,
		includeMyTurn: row.IncludeMyTurn,
		includeTheirTurn: row.IncludeTheirTurn,
		includeQueued: row.IncludeQueued,
		includeArchived: row.IncludeArchived,
		columns: JSON.parse(row.Columns),
		sortKey: row.SortKey,
		sortDescending: row.SortDescending,
		characterIds: row.CharacterIds ? JSON.parse(row.CharacterIds) : null,
		tags: row.Tags ? JSON.parse(row.Tags) : null,
	};
}

export async function getPublicViewsForUser(
	userId: string
): Promise<PublicView[]> {
	const rows = await prisma.publicViews.findMany({
		where: { UserId: userId },
		orderBy: { Name: "asc" },
	});
	return rows.map(parsePublicView);
}

export async function getPublicViewByUsernameAndSlug(
	username: string,
	slug: string
): Promise<PublicView | null> {
	const user = await prisma.aspNetUsers.findFirst({
		where: { UserName: username },
		select: { Id: true },
	});
	if (!user) return null;

	const row = await prisma.publicViews.findFirst({
		where: {
			UserId: user.Id,
			Slug: slug,
		},
	});

	return row ? parsePublicView(row) : null;
}

export async function isSlugAvailableForUser(
	userId: string,
	slug: string,
	excludeId?: string
): Promise<boolean> {
	const existing = await prisma.publicViews.findFirst({
		where: {
			UserId: userId,
			Slug: slug,
			...(excludeId ? { Id: { not: excludeId } } : {}),
		},
		select: { Id: true },
	});
	return !existing;
}

export async function getThreadsForPublicView(
	userId: string,
	includeArchived: boolean,
	characterIds: number[] | null
): Promise<ThreadWithCharacter[]> {
	return prisma.threads.findMany({
		where: {
			Characters: {
				UserId: userId,
				IsOnHiatus: false,
				...(characterIds && characterIds.length > 0
					? { CharacterId: { in: characterIds } }
					: {}),
			},
			...(includeArchived ? {} : { IsArchived: false }),
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
