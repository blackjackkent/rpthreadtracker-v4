import type {
	AspNetUsers,
	Characters,
	Threads,
	ThreadTags,
	Platforms,
	ProfileSettings,
} from "@prisma/client";

// Re-export Prisma-generated types
export type {
	AspNetUsers,
	Characters,
	Threads,
	ThreadTags,
	Platforms,
	ProfileSettings,
};

// Thread data for status calculation with character details
export interface ThreadWithCharacter {
	ThreadId: number;
	PostId: string | null;
	UserTitle: string | null;
	PartnerUrlIdentifier: string | null;
	DateMarkedQueued: Date | null;
	IsArchived: boolean;
	Characters: {
		CharacterName: string | null;
		UrlIdentifier: string | null;
	};
}
