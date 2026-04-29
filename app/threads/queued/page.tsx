import type { Metadata } from "next";
import { ThreadsContentWrapper } from "@/components/threads/ThreadsContentWrapper";

export const metadata: Metadata = { title: "Queued" };
export const dynamic = "force-dynamic";

export default function QueuedPage() {
	return (
		<ThreadsContentWrapper
			pageTitle="Queued Threads"
			pageDescription="Threads marked as queued"
			filterType="queued"
			showAddButton={false}
		/>
	);
}
