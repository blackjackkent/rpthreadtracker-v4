import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
	getPublicViewByUsernameAndSlug,
	getThreadsForPublicView,
} from "@/lib/db/public-view";
import {
	PublicViewContent,
	type PublicViewThread,
} from "@/components/public-views/PublicViewContent";

export const dynamic = "force-dynamic";

interface PublicPageProps {
	params: Promise<{ username: string; slug: string }>;
}

export async function generateMetadata({
	params,
}: PublicPageProps): Promise<Metadata> {
	const { username, slug } = await params;
	const view = await getPublicViewByUsernameAndSlug(username, slug);
	if (!view) return { title: "Public View | RPThreadTracker" };
	return {
		title: `${view.name} | RPThreadTracker`,
		description: `Thread tracker public view for ${username}`,
	};
}

export default async function PublicViewPage({ params }: PublicPageProps) {
	const { username, slug } = await params;

	const view = await getPublicViewByUsernameAndSlug(username, slug);
	if (!view) notFound();

	const dbThreads = await getThreadsForPublicView(
		view.userId,
		view.includeArchived,
		view.characterIds
	);

	// Serialize DB threads for the client component (Dates → strings)
	const threads: PublicViewThread[] = dbThreads.map((thread) => ({
		threadId: thread.ThreadId,
		postId: thread.PostId || "",
		userTitle: thread.UserTitle,
		characterName: thread.Characters.CharacterName || "",
		characterUrlIdentifier: thread.Characters.UrlIdentifier || "",
		partnerUrlIdentifier: thread.PartnerUrlIdentifier,
		dateMarkedQueued: thread.DateMarkedQueued
			? thread.DateMarkedQueued.toISOString()
			: null,
		isArchived: thread.IsArchived,
		description: thread.Description,
		characterId: thread.Characters.CharacterId,
		characterIsOnHiatus: thread.Characters.IsOnHiatus,
		tags: (thread.ThreadTags ?? []).map((tag) => ({
			tagId: tag.TagID,
			tagText: tag.TagText,
			threadId: tag.ThreadID || 0,
		})),
		// Tumblr status defaults — client will fetch and merge real values
		lastPostDate: null,
		lastPosterUrlIdentifier: "",
		lastPostUrl: "",
		isCallingCharactersTurn: true,
		isQueued: false,
	}));

	return (
		<div className="min-h-screen bg-background text-text">
			<header className="bg-surface border-b border-border px-6 py-4">
				<div className="max-w-6xl mx-auto flex items-center justify-between">
					<div>
						<div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-0.5">
							RPThreadTracker
						</div>
						<h1 className="text-xl font-bold text-text">{view.name}</h1>
					</div>
				</div>
			</header>

			<main className="max-w-6xl mx-auto px-6 py-6">
				<PublicViewContent view={view} threads={threads} />
			</main>

			<footer className="border-t border-border px-6 py-4 mt-8">
				<div className="max-w-6xl mx-auto text-center text-xs text-text-muted">
					Powered by{" "}
					<a
						href="https://rpthreadtracker.com"
						className="text-primary hover:underline"
					>
						RPThreadTracker
					</a>
				</div>
			</footer>
		</div>
	);
}
