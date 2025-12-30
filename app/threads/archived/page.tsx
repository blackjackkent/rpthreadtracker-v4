import { auth } from "@/lib/auth";
import { getArchivedThreadsForUser } from "@/lib/db/thread";
import { ThreadsContent } from "@/components/threads/ThreadsContent";
import { ThreadStatusWithDetails } from "@/types/tumblr";

export const dynamic = "force-dynamic";

export default async function ArchivedPage() {
	const session = await auth();

	// Fetch archived threads from database
	const archivedThreadsRaw = await getArchivedThreadsForUser(session!.user!.id);

	// Transform database result to ThreadStatusWithDetails format
	const archivedThreads: ThreadStatusWithDetails[] = archivedThreadsRaw.map(
		(thread) => ({
			// Database fields
			threadId: thread.ThreadId,
			postId: thread.PostId || "",
			userTitle: thread.UserTitle,
			partnerUrlIdentifier: thread.PartnerUrlIdentifier,
			dateMarkedQueued: thread.DateMarkedQueued,
			isArchived: thread.IsArchived,
			description: thread.Description || null,
			characterId: thread.Characters.CharacterId,
			characterName: thread.Characters.CharacterName || "",
			characterUrlIdentifier: thread.Characters.UrlIdentifier || "",

			// Tumblr status fields (not available for archived threads)
			lastPostDate: null,
			lastPosterUrlIdentifier: "",
			lastPostUrl: "",
			isCallingCharactersTurn: false, // Archived threads don't have turn status
			isQueued: thread.DateMarkedQueued !== null,

			// Tags
			tags: thread.ThreadTags?.map((tag) => ({
				tagId: tag.TagID,
				tagText: tag.TagText,
				threadId: tag.ThreadID || 0,
			})),
		})
	);

	return (
		<ThreadsContent
			threads={archivedThreads}
			pageTitle="Archived Threads"
			pageDescription="View archived threads"
			showAddButton={false}
			isArchived={true}
		/>
	);
}
