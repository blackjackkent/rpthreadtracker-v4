import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getActiveCharacters } from "@/lib/db/character";

export async function GET() {
	const session = await auth();

	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const characters = await getActiveCharacters(session.user.id);
		return NextResponse.json(characters);
	} catch (error) {
		console.error("Error fetching characters:", error);
		return NextResponse.json(
			{ error: "Failed to fetch characters" },
			{ status: 500 }
		);
	}
}
