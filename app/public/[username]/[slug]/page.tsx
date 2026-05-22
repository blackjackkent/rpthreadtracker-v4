import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
	getPublicViewByUsernameAndSlug,
	getThreadsForPublicView,
} from "@/lib/db/public-view";
import type { ThreadStatusRequest, ThreadStatusResponse } from "@/types/tumblr";
import type { ThreadWithCharacter } from "@/lib/db/types";
import { batchCalculateThreadStatuses } from "@/lib/thread-status-calculator";
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

const CHUNK_SIZE = 10;

async function fetchStatusesInChunks(
	threads: ThreadWithCharacter[]
): Promise<Map<number, ThreadStatusResponse>> {
	const threadsWithPostId = threads.filter(
		(t) => t.PostId && t.Characters.UrlIdentifier
	);

	if (threadsWithPostId.length === 0) return new Map();

	const chunks: ThreadWithCharacter[][] = [];
	for (let i = 0; i < threadsWithPostId.length; i += CHUNK_SIZE) {
		chunks.push(threadsWithPostId.slice(i, i + CHUNK_SIZE));
	}

	const chunkResults = await Promise.all(
		chunks.map((chunk) => {
			const requests: ThreadStatusRequest[] = chunk.map((t) => ({
				threadId: t.ThreadId,
				postId: t.PostId!,
				characterUrlIdentifier: t.Characters.UrlIdentifier!,
				partnerUrlIdentifier: t.PartnerUrlIdentifier || undefined,
				dateMarkedQueued: t.DateMarkedQueued || undefined,
			}));
			return batchCalculateThreadStatuses(requests);
		})
	);

	const results = chunkResults.flat();
	const map = new Map<number, ThreadStatusResponse>();
	for (const status of results) {
		if (status.threadId) map.set(status.threadId, status);
	}
	return map;
}

function sortThreads(
	threads: PublicViewThread[],
	sortKey: string,
	sortDescending: boolean
): PublicViewThread[] {
	return [...threads].sort((a, b) => {
		let cmp = 0;
		switch (sortKey) {
			case "lastPostDate": {
				const da = a.lastPostDate ? new Date(a.lastPostDate).getTime() : 0;
				const db = b.lastPostDate ? new Date(b.lastPostDate).getTime() : 0;
				cmp = da - db;
				break;
			}
			case "threadTitle":
				cmp = (a.userTitle || "").localeCompare(b.userTitle || "");
				break;
			case "partner":
				cmp = (a.partnerUrlIdentifier || "").localeCompare(
					b.partnerUrlIdentifier || ""
				);
				break;
		}
		return sortDescending ? -cmp : cmp;
	});
}

export default async function PublicViewPage({ params }: PublicPageProps) {
	const { username, slug } = await params;

	const view = await getPublicViewByUsernameAndSlug(username, slug);
	if (!view) notFound();

	// Fetch threads for the view's user (DB-level filtering by characterIds + includeArchived)
	const dbThreads = await getThreadsForPublicView(
		view.userId,
		view.includeArchived,
		view.characterIds
	);

	// Fetch Tumblr statuses in chunks
	const statusMap = await fetchStatusesInChunks(dbThreads);

	// Merge DB threads with Tumblr statuses into rich PublicViewThread objects
	const mergedThreads: PublicViewThread[] = dbThreads.map((thread) => {
		const status = statusMap.get(thread.ThreadId);
		return {
			threadId: thread.ThreadId,
			postId: thread.PostId || "",
			lastPostDate: status?.lastPostDate
				? new Date(status.lastPostDate).toISOString()
				: null,
			lastPosterUrlIdentifier: status?.lastPosterUrlIdentifier ?? "",
			lastPostUrl: status?.lastPostUrl ?? "",
			isCallingCharactersTurn: status?.isCallingCharactersTurn ?? true,
			isQueued: status?.isQueued ?? false,
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
		};
	});

	// Apply tag filter (if view restricts to specific tags)
	let filtered = mergedThreads;
	if (view.tags && view.tags.length > 0) {
		const allowedTags = new Set(view.tags.map((t) => t.toLowerCase()));
		filtered = filtered.filter((thread) =>
			thread.tags.some((tag) => allowedTags.has(tag.tagText.toLowerCase()))
		);
	}

	// Apply status filter based on view config
	filtered = filtered.filter((thread) => {
		if (thread.isArchived) return view.includeArchived;
		if (thread.isQueued) return view.includeQueued;
		if (thread.isCallingCharactersTurn) return view.includeMyTurn;
		return view.includeTheirTurn;
	});

	// Sort server-side (initial sort — client can re-sort via TanStack)
	const sorted = sortThreads(filtered, view.sortKey, view.sortDescending);

	return (
		<div className="min-h-screen bg-background text-text">
			{/* Minimal header */}
			<header className="bg-surface border-b border-border px-6 py-4">
				<div className="max-w-6xl mx-auto flex items-center justify-between">
					<div>
						<div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-0.5">
							RPThreadTracker
						</div>
						<h1 className="text-xl font-bold text-text">{view.name}</h1>
					</div>
					<div className="text-sm text-text-muted">
						{sorted.length} thread{sorted.length !== 1 ? "s" : ""}
					</div>
				</div>
			</header>

			{/* Main content */}
			<main className="max-w-6xl mx-auto px-6 py-6">
				<PublicViewContent view={view} threads={sorted} />
			</main>

			{/* Footer */}
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
