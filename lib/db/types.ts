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

// Thread data for status calculation
export interface ThreadWithCharacter {
	ThreadId: number;
	PostId: string | null;
	PartnerUrlIdentifier: string | null;
	DateMarkedQueued: Date | null;
	IsArchived: boolean;
	Characters: {
		UrlIdentifier: string | null;
	};
}
