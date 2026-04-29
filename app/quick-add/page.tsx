import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export const metadata: Metadata = { title: "Quick Add" };
import { getActiveCharacters } from "@/lib/db/character";
import { QuickAddContent } from "@/components/quick-add/QuickAddContent";

export const dynamic = "force-dynamic";

interface QuickAddPageProps {
	searchParams: Promise<{ blogShortname?: string; postId?: string }>;
}

export default async function QuickAddPage({ searchParams }: QuickAddPageProps) {
	const { blogShortname = "", postId = "" } = await searchParams;
	const session = await auth();

	if (!session?.user?.id) {
		const callbackUrl = `/quick-add?blogShortname=${encodeURIComponent(blogShortname)}&postId=${encodeURIComponent(postId)}`;
		redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
	}

	const characters = await getActiveCharacters(session.user.id);

	return (
		<QuickAddContent
			characters={characters}
			blogShortname={blogShortname}
			postId={postId}
		/>
	);
}
