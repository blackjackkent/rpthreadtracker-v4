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
	lastPostDate: Date;
	lastPosterUrlIdentifier: string;
	lastPostUrl: string;
	isCallingCharactersTurn: boolean;
	isQueued: boolean;
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
