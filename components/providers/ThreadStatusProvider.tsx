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
	refreshSingleThreadStatus,
	calculateStats,
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
	refreshSingleThread: (threadId: number) => Promise<void>;
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
		} catch (error) {
			console.error("Error refreshing thread statuses:", error);
			toast.error("Failed to refresh thread data. Please try again.");
		} finally {
			setIsRefreshing(false);
			setProgress(null);
		}
	}, [userId]);

	const refreshSingleThread = useCallback(async (threadId: number) => {
		try {
			const updatedThread = await refreshSingleThreadStatus(threadId);

			if (updatedThread) {
				// Update or add the thread in the map
				setThreadStatuses((prev) => {
					const newMap = new Map(prev);
					newMap.set(threadId, updatedThread);
					return newMap;
				});

				// Recalculate dashboard stats from updated thread map
				setDashboardStats(() => {
					const updatedMap = new Map(threadStatuses);
					updatedMap.set(threadId, updatedThread);

					// Convert map values to array for calculateStats
					const allStatuses = Array.from(updatedMap.values());

					return calculateStats(allStatuses, updatedMap.size);
				});
			}
		} catch (error) {
			console.error("Error refreshing single thread:", error);
			toast.error("Failed to refresh thread data.");
		}
	}, [threadStatuses]);

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
		refreshSingleThread,
		getThreadStatus,
	};

	return (
		<ThreadStatusContext.Provider value={value}>
			{children}
		</ThreadStatusContext.Provider>
	);
}
