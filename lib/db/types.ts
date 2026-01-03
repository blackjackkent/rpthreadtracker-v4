// Prisma generates types from the schema automatically
// Import them from @prisma/client if needed in other files
export type { AspNetUsers, Characters, Threads, ThreadTags, Platforms, ProfileSettings } from "@prisma/client";

// Thread tag data
export interface ThreadTagData {
	TagID: string;
	TagText: string;
	ThreadID: number | null;
}

// Thread data for status calculation with character details
export interface ThreadWithCharacter {
	ThreadId: number;
	PostId: string | null;
	UserTitle: string | null;
	PartnerUrlIdentifier: string | null;
	DateMarkedQueued: Date | null;
	IsArchived: boolean;
	Description: string | null;
	Characters: {
		CharacterId: number;
		CharacterName: string | null;
		UrlIdentifier: string | null;
		IsOnHiatus: boolean;
	};
	ThreadTags: ThreadTagData[];
}
