// Application types
export interface NavItem {
	name: string;
	url?: string;
	icon?: string;
	title?: boolean;
}

// Database types
export interface Thread {
	ThreadId: number;
	CharacterId: number;
	PostId: string;
	UserTitle: string;
	PartnerUrlIdentifier: string;
	IsArchived: boolean;
	DateMarkedQueued: Date | null;
	Description: string;
}

export interface Character {
	CharacterId: number;
	UserId: string;
	CharacterName: string;
	UrlIdentifier: string;
	IsOnHiatus: boolean;
	PlatformId: number;
}

export interface AspNetUser {
	Id: string;
	UserName: string;
	Email: string;
	NormalizedEmail: string;
	NormalizedUserName: string;
	PasswordHash: string;
	EmailConfirmed: boolean;
	LockoutEnabled: boolean;
	LockoutEnd: Date | null;
	AccessFailedCount: number;
	TwoFactorEnabled: boolean;
	SecurityStamp: string;
	ConcurrencyStamp: string;
	PhoneNumber: string | null;
	PhoneNumberConfirmed: boolean;
}
