import type { Metadata } from "next";
import { ThreadsContentWrapper } from "@/components/threads/ThreadsContentWrapper";

export const metadata: Metadata = { title: "Their Turn" };
export const dynamic = "force-dynamic";

export default function TheirTurnPage() {
	return (
		<ThreadsContentWrapper
			pageTitle="Their Turn"
			pageDescription="Threads awaiting partner response"
			filterType="theirTurn"
			showAddButton={false}
		/>
	);
}
