"use client";

import { useThreadStatus } from "@/components/providers/ThreadStatusProvider";
import { ThreadsContent } from "./ThreadsContent";
import {
	filterAll,
	filterYourTurn,
	filterTheirTurn,
	filterQueued,
	type ThreadFilterFunction,
} from "./filters";

type FilterType = "all" | "yourTurn" | "theirTurn" | "queued";

const FILTER_MAP: Record<FilterType, ThreadFilterFunction> = {
	all: filterAll,
	yourTurn: filterYourTurn,
	theirTurn: filterTheirTurn,
	queued: filterQueued,
};

interface ThreadsContentWrapperProps {
	pageTitle: string;
	pageDescription: string;
	filterType?: FilterType;
	showAddButton?: boolean;
	isArchived?: boolean;
}

export const ThreadsContentWrapper = ({
	pageTitle,
	pageDescription,
	filterType = "all",
	showAddButton = false,
	isArchived = false,
}: ThreadsContentWrapperProps) => {
	const { threadStatuses, isRefreshing } = useThreadStatus();

	// Convert Map to array
	const threadsArray = Array.from(threadStatuses.values());

	// Get filter function from map
	const filterFunction = FILTER_MAP[filterType];

	if (isRefreshing && threadsArray.length === 0) {
		return (
			<div className="space-y-6 p-6">
				<div>
					<h1 className="text-3xl font-semibold">{pageTitle}</h1>
					<p className="text-text-muted mt-1">{pageDescription}</p>
				</div>
				<div className="text-center py-12 text-text-muted">
					Loading thread data...
				</div>
			</div>
		);
	}

	return (
		<ThreadsContent
			threads={threadsArray}
			pageTitle={pageTitle}
			pageDescription={pageDescription}
			showAddButton={showAddButton}
			isArchived={isArchived}
			isAllThreadsPage={filterType === "all"}
			filterFunction={filterFunction}
		/>
	);
};
