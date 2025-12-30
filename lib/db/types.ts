// Prisma generates types from the schema automatically
// Import them from @prisma/client if needed in other files
export type { AspNetUsers, Characters, Threads, ThreadTags, Platforms, ProfileSettings } from "@prisma/client";

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
