import type { Metadata } from "next";
import { auth } from "@/lib/auth";

export const metadata: Metadata = { title: "Manage Characters" };
import { getAllCharactersForManagement } from "@/lib/db/character";
import { CharactersContent } from "@/components/characters/CharactersContent";

export const dynamic = "force-dynamic";

export default async function ManageCharactersPage() {
	const session = await auth();

	// AuthenticatedLayout already ensures user is logged in, but TypeScript doesn't know that
	const userId = session?.user?.id ?? "";
	const characters = await getAllCharactersForManagement(userId);

	return <CharactersContent initialCharacters={characters} />;
}
