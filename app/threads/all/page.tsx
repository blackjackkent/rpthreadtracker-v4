import type { Metadata } from "next";
import { ThreadsContentWrapper } from "@/components/threads/ThreadsContentWrapper";

export const metadata: Metadata = { title: "All Threads" };
export const dynamic = "force-dynamic";

export default function AllThreadsPage() {
	return (
		<ThreadsContentWrapper
			pageTitle="All Threads"
			pageDescription="View and manage all active threads"
			filterType="all"
			showAddButton={true}
		/>
	);
}
