import tumblr from "tumblr.js";
import type { TumblrPost, TumblrBlogPostsResponse } from "@/types/tumblr";

let _client: ReturnType<typeof tumblr.createClient> | null = null;

function getClient() {
	if (!_client) {
		const requiredEnvVars = [
			"TUMBLR_CONSUMER_KEY",
			"TUMBLR_CONSUMER_SECRET",
			"TUMBLR_OAUTH_TOKEN",
			"TUMBLR_OAUTH_SECRET",
		];
		for (const envVar of requiredEnvVars) {
			if (!process.env[envVar]) {
				throw new Error(`Missing required environment variable: ${envVar}`);
			}
		}
		_client = tumblr.createClient({
			consumer_key: process.env.TUMBLR_CONSUMER_KEY!,
			consumer_secret: process.env.TUMBLR_CONSUMER_SECRET!,
			token: process.env.TUMBLR_OAUTH_TOKEN!,
			token_secret: process.env.TUMBLR_OAUTH_SECRET!,
		});
	}
	return _client;
}

/**
 * Fetch a post from Tumblr with reblog notes
 * @param blogIdentifier - The blog shortname (e.g., "cmdr-blackjack-shepard")
 * @param postId - The Tumblr post ID
 * @returns The post with notes, or null if not found
 */
export async function getTumblrPost(
	blogIdentifier: string,
	postId: string
): Promise<TumblrPost | null> {
	try {
		// Normalize blog identifier to lowercase (Tumblr URLs are case-insensitive)
		const normalizedBlogIdentifier = blogIdentifier.toLowerCase();

		const response = (await getClient().blogPosts(normalizedBlogIdentifier, {
			id: postId,
			notes_info: true, // Critical: include reblog notes
			// Note: Not filtering by type - posts can be text, photo, link, etc.
		})) as TumblrBlogPostsResponse;

		if (!response || !response.posts || response.posts.length === 0) {
			console.warn(
				`Post not found: blog=${normalizedBlogIdentifier}, postId=${postId}`
			);
			return null;
		}

		return response.posts[0];
	} catch (error) {
		console.error(
			`Error fetching Tumblr post: blog=${blogIdentifier}, postId=${postId}`,
			error
		);
		return null;
	}
}

export interface NewsPost {
	postId: string;
	postTitle: string;
	postUrl: string;
	postDate: Date;
}

/**
 * Fetch the 5 most recent news posts from the tracker news blog
 */
export async function getNewsPosts(): Promise<NewsPost[]> {
	try {
		const response = (await getClient().blogPosts("tblrthreadtracker", {
			tag: "news",
			limit: 5,
			type: "text",
		})) as TumblrBlogPostsResponse;

		if (!response?.posts) return [];

		return response.posts.map((post) => ({
			postId: String(post.id),
			postTitle: post.title || post.summary || "RPThreadTracker News",
			postUrl: post.post_url,
			postDate: new Date(post.timestamp * 1000),
		}));
	} catch (error) {
		console.error("Error fetching news posts:", error);
		return [];
	}
}

/**
 * Retry logic with exponential backoff
 * Handles rate limiting (429 errors)
 */
export async function getTumblrPostWithRetry(
	blogIdentifier: string,
	postId: string,
	maxRetries = 5
): Promise<TumblrPost | null> {
	for (let attempt = 0; attempt < maxRetries; attempt++) {
		try {
			const post = await getTumblrPost(blogIdentifier, postId);
			return post;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (error: any) {
			// Check if it's a rate limit error (429)
			if (error?.status === 429 && attempt < maxRetries - 1) {
				// Exponential backoff with jitter
				const baseDelay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s, 8s, 16s
				const jitter = Math.random() * 1000; // 0-1000ms random jitter
				const delay = baseDelay + jitter;

				console.warn(
					`Rate limited (429). Retrying in ${Math.round(delay)}ms... (attempt ${
						attempt + 1
					}/${maxRetries})`
				);
				await new Promise((resolve) => setTimeout(resolve, delay));
				continue;
			}

			// Check if it's a 404 error - try refreshing Tumblr's cache
			if (error?.status === 404 && attempt === 0) {
				console.warn(`Post not found (404). Attempting cache refresh...`);
				try {
					// Make a request to the post URL to refresh Tumblr's cache
					const postUrl = `https://${blogIdentifier}.tumblr.com/post/${postId}`;
					await fetch(postUrl, { method: "HEAD" });
					// Wait a moment, then retry
					await new Promise((resolve) => setTimeout(resolve, 1000));
					continue;
				} catch {
					// Ignore cache refresh errors, will retry normally
				}
			}

			// For other errors or final retry, return null
			console.error(
				`Failed to fetch post after ${attempt + 1} attempts`,
				error
			);
			if (attempt === maxRetries - 1) {
				return null;
			}
		}
	}

	return null;
}
