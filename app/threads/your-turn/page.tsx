import type { Metadata } from "next";
import { ThreadsContentWrapper } from "@/components/threads/ThreadsContentWrapper";

export const metadata: Metadata = { title: "Your Turn" };
export const dynamic = "force-dynamic";

export default function YourTurnPage() {
	return (
		<ThreadsContentWrapper
			pageTitle="Your Turn"
			pageDescription="Threads awaiting your response"
			filterType="yourTurn"
			showAddButton={false}
		/>
	);
}
