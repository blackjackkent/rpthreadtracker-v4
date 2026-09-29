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
	const { threadStatuses, isRefreshing, progress } = useThreadStatus();

	// Convert Map to array
	const threadsArray = Array.from(threadStatuses.values());

	// Get filter function from map
	const filterFunction = FILTER_MAP[filterType];

	return (
		<ThreadsContent
			threads={threadsArray}
			pageTitle={pageTitle}
			pageDescription={pageDescription}
			showAddButton={showAddButton}
			isArchived={isArchived}
			isAllThreadsPage={filterType === "all"}
			filterFunction={filterFunction}
			isLoadingStatuses={isRefreshing}
			loadingProgress={progress}
		/>
	);
};
