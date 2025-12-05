"use client";

import React, {
	createContext,
	useContext,
	useState,
	useCallback,
	useEffect,
} from "react";
import type { ThreadStatusWithDetails } from "@/types/tumblr";
import {
	refreshThreadStatusesInChunks,
	type DashboardStats,
	type RefreshProgress,
} from "@/lib/thread-status-service";
import { toast } from "react-toastify";

interface ThreadStatusContextValue {
	// Thread status data
	threadStatuses: Map<number, ThreadStatusWithDetails>;
	dashboardStats: DashboardStats | null;

	// Refresh state
	isRefreshing: boolean;
	progress: RefreshProgress | null;
	lastRefreshed: Date | null;

	// Methods
	refreshThreadStatuses: () => Promise<void>;
	getThreadStatus: (threadId: number) => ThreadStatusWithDetails | null;
}

const ThreadStatusContext = createContext<ThreadStatusContextValue | null>(
	null
);

export function useThreadStatus() {
	const context = useContext(ThreadStatusContext);
	if (!context) {
		throw new Error("useThreadStatus must be used within ThreadStatusProvider");
	}
	return context;
}

interface ThreadStatusProviderProps {
	children: React.ReactNode;
	userId: string;
}

export function ThreadStatusProvider({
	children,
	userId,
}: ThreadStatusProviderProps) {
	const [threadStatuses, setThreadStatuses] = useState<
		Map<number, ThreadStatusWithDetails>
	>(new Map());
	const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(
		null
	);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [progress, setProgress] = useState<RefreshProgress | null>(null);
	const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

	const refreshThreadStatuses = useCallback(async () => {
		setIsRefreshing(true);
		setProgress(null);

		try {
			const result = await refreshThreadStatusesInChunks(
				userId,
				(progressUpdate) => {
					setProgress(progressUpdate);
				}
			);

			setThreadStatuses(result.threadStatuses);
			setDashboardStats(result.dashboardStats);
			setLastRefreshed(new Date());
			toast.success("Thread data refreshed successfully");
		} catch (error) {
			console.error("Error refreshing thread statuses:", error);
			toast.error("Failed to refresh thread data. Please try again.");
		} finally {
			setIsRefreshing(false);
			setProgress(null);
		}
	}, [userId]);

	const getThreadStatus = useCallback(
		(threadId: number): ThreadStatusWithDetails | null => {
			return threadStatuses.get(threadId) || null;
		},
		[threadStatuses]
	);

	// Auto-fetch on initial mount
	useEffect(() => {
		if (!lastRefreshed && !isRefreshing) {
			refreshThreadStatuses();
		}
	}, [lastRefreshed, isRefreshing, refreshThreadStatuses]);

	const value: ThreadStatusContextValue = {
		threadStatuses,
		dashboardStats,
		isRefreshing,
		progress,
		lastRefreshed,
		refreshThreadStatuses,
		getThreadStatus,
	};

	return (
		<ThreadStatusContext.Provider value={value}>
			{children}
		</ThreadStatusContext.Provider>
	);
}
