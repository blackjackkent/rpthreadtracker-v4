// Tumblr API types and Thread Status types

// Thread Status Request (for API endpoint)
export interface ThreadStatusRequest {
	threadId?: number;
	postId: string;
	characterUrlIdentifier: string;
	partnerUrlIdentifier?: string;
	dateMarkedQueued?: Date | string;
}

// Thread Status Response (from API endpoint)
export interface ThreadStatusResponse {
	threadId?: number;
	postId: string;
	lastPostDate: Date | null; // null if post not found
	lastPosterUrlIdentifier: string;
	lastPostUrl: string;
	isCallingCharactersTurn: boolean;
	isQueued: boolean;
}

// Thread details from database
export interface ThreadDetails {
	threadId: number;
	postId: string;
	userTitle: string | null;
	partnerUrlIdentifier: string | null;
	dateMarkedQueued: Date | null;
	characterName: string;
	characterUrlIdentifier: string;
}

// Thread tag from database
export interface ThreadTag {
	tagId: string; // TagID (PK, UUID)
	tagText: string; // TagText (max 140 chars)
	threadId: number; // ThreadID (FK)
}

// Combined thread status with details (used in context and thread tables)
export interface ThreadStatusWithDetails extends ThreadStatusResponse {
	// Fields from ThreadDetails
	userTitle: string | null;
	characterName: string;
	characterUrlIdentifier: string;

	// Additional database fields needed for thread management
	partnerUrlIdentifier: string | null;
	dateMarkedQueued: Date | null;
	isArchived: boolean;
	description: string | null;
	characterId: number;
	characterIsOnHiatus: boolean;

	// Tags from ThreadTags table
	tags?: ThreadTag[];
}

// Thread form data for create/update operations
export interface ThreadFormData {
	threadId?: number; // undefined for create
	userTitle?: string;
	characterId: number;
	partnerUrlIdentifier?: string;
	postId: string;
	description?: string;
	tags?: string[]; // array of tag text strings (not full tag objects)
}

// Tumblr API Note types
export interface TumblrNote {
	type: string; // "reblog" | "like" | "reply"
	timestamp: number; // Unix timestamp
	blog_name: string;
	blog_url: string;
	post_id?: string;
	reblog_parent_blog_name?: string;
}

// Tumblr API Post types
export interface TumblrPost {
	id: number;
	id_string: string;
	post_url: string;
	blog_name: string;
	timestamp: number; // Unix timestamp
	date: string; // ISO 8601 date string
	format: string;
	reblog_key: string;
	tags: string[];
	note_count: number;
	notes?: TumblrNote[];
	// Text post specific fields
	title?: string;
	body?: string;
}

// Tumblr API Response
export interface TumblrBlogPostsResponse {
	posts: TumblrPost[];
	total_posts: number;
}
