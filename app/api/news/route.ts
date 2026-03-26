import { NextResponse } from "next/server";
import { getNewsPosts } from "@/lib/tumblr-client";

// Cache news for 5 minutes — it's public content that rarely changes
export const revalidate = 300;

export async function GET() {
	try {
		const posts = await getNewsPosts();
		return NextResponse.json(posts);
	} catch (error) {
		console.error("Error fetching news:", error);
		return NextResponse.json([], { status: 500 });
	}
}
