"use client";

import React, {
	createContext,
	useContext,
	useState,
	useCallback,
	useEffect,
	useMemo,
	useRef,
} from "react";
import { HttpError } from "@/lib/http-error";
import type { ThreadStatusWithDetails } from "@/types/tumblr";
import {
	refreshThreadStatusesInChunks,
	refreshSingleThreadStatus,
	refreshThreadMetadata as fetchThreadMetadata,
	calculateStats,
	type DashboardStats,
	type RefreshProgress,
} from "@/lib/thread-status-service";
import { toast } from "react-toastify";

interface Character {
	id: number;
	name: string;
	urlIdentifier: string;
}

interface ThreadStatusContextValue {
	// Thread status data
	threadStatuses: Map<number, ThreadStatusWithDetails>;
	dashboardStats: DashboardStats | null;
	characters: Character[];

	// Refresh state
	isRefreshing: boolean;
	progress: RefreshProgress | null;
	lastRefreshed: Date | null;

	// Methods
	refreshThreadStatuses: () => Promise<void>;
	refreshSingleThread: (threadId: number) => Promise<void>;
	removeThread: (threadId: number) => void;
	refreshThreadMetadata: () => Promise<void>;
	refreshCharacters: () => Promise<void>;
	getThreadStatus: (threadId: number) => ThreadStatusWithDetails | null;
}

const ThreadStatusContext = createContext<ThreadStatusContextValue | null>(
	null
);

const REFRESH_RETRY_DELAYS_MS = [5_000, 15_000, 45_000];

const isRetryableRefreshError = (error: unknown) =>
	!(error instanceof HttpError && (error.status === 401 || error.status === 403));

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
	const [characters, setCharacters] = useState<Character[]>([]);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [progress, setProgress] = useState<RefreshProgress | null>(null);
	const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

	const dashboardStats = useMemo<DashboardStats | null>(() => {
		if (threadStatuses.size === 0 && !lastRefreshed) return null;
		return calculateStats(Array.from(threadStatuses.values()));
	}, [threadStatuses, lastRefreshed]);

	const isMountedRef = useRef(true);
	useEffect(() => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
		};
	}, []);

	const refreshThreadStatuses = useCallback(async () => {
		setIsRefreshing(true);
		setProgress(null);

		try {
			for (let attempt = 0; ; attempt++) {
				try {
					const result = await refreshThreadStatusesInChunks(
						userId,
						(progressUpdate) => {
							setProgress(progressUpdate);
						},
						(chunkStatuses) => {
							setThreadStatuses((prev) => {
								const merged = new Map(prev);
								for (const [id, status] of chunkStatuses) {
									const existing = prev.get(id);
									// On a manual refresh, keep showing the previous result until the new one arrives
									if (status.isStatusPending && existing && !existing.isStatusPending) {
										continue;
									}
									merged.set(id, status);
								}
								return merged;
							});
						}
					);

					if (!isMountedRef.current) return;
					setThreadStatuses(result.threadStatuses);
					setLastRefreshed(new Date());
					return;
				} catch (error) {
					const delay = REFRESH_RETRY_DELAYS_MS[attempt];
					if (
						delay === undefined ||
						!isRetryableRefreshError(error) ||
						!isMountedRef.current
					) {
						throw error;
					}
					console.warn(
						`Thread refresh failed (attempt ${attempt + 1}); retrying in ${delay / 1000}s`,
						error
					);
					setProgress(null);
					await sleep(delay);
					// Provider unmounted (e.g. logged out) while waiting
					if (!isMountedRef.current) return;
				}
			}
		} catch (error) {
			console.error("Error refreshing thread statuses:", error);
			toast.error("Failed to refresh thread data. Please try again.");
		} finally {
			setIsRefreshing(false);
			setProgress(null);
		}
	}, [userId]);

	const refreshSingleThread = useCallback(
		async (threadId: number) => {
			try {
				const updatedThread = await refreshSingleThreadStatus(threadId);

				if (updatedThread) {
					setThreadStatuses((prev) => {
						const newMap = new Map(prev);
						newMap.set(threadId, updatedThread);
						return newMap;
					});
				}
			} catch (error) {
				console.error("Error refreshing single thread:", error);
				toast.error("Failed to refresh thread data.");
			}
		},
		[]
	);

	const removeThread = useCallback((threadId: number) => {
		setThreadStatuses((prev) => {
			const newMap = new Map(prev);
			newMap.delete(threadId);
			return newMap;
		});
	}, []);

	const refreshThreadMetadata = useCallback(async () => {
		try {
			const updated = await fetchThreadMetadata(threadStatuses);
			setThreadStatuses(updated);
		} catch (error) {
			console.error("Error refreshing thread metadata:", error);
		}
	}, [threadStatuses]);

	const getThreadStatus = useCallback(
		(threadId: number): ThreadStatusWithDetails | null => {
			return threadStatuses.get(threadId) || null;
		},
		[threadStatuses]
	);

	const refreshCharacters = useCallback(async () => {
		try {
			const response = await fetch("/api/characters");
			if (!response.ok) {
				throw new Error("Failed to fetch characters");
			}
			const data = await response.json();
			setCharacters(data);
		} catch (error) {
			console.error("Error fetching characters:", error);
			toast.error("Failed to load characters");
		}
	}, []);

	// Auto-fetch once on initial mount; failures are retried inside refreshThreadStatuses
	const hasStartedInitialFetchRef = useRef(false);
	useEffect(() => {
		if (hasStartedInitialFetchRef.current) return;
		hasStartedInitialFetchRef.current = true;
		refreshThreadStatuses();
	}, [refreshThreadStatuses]);

	// Fetch characters on initial mount
	useEffect(() => {
		refreshCharacters();
	}, [refreshCharacters]);

	const value: ThreadStatusContextValue = {
		threadStatuses,
		dashboardStats,
		characters,
		isRefreshing,
		progress,
		lastRefreshed,
		refreshThreadStatuses,
		refreshSingleThread,
		removeThread,
		refreshThreadMetadata,
		refreshCharacters,
		getThreadStatus,
	};

	return (
		<ThreadStatusContext.Provider value={value}>
			{children}
		</ThreadStatusContext.Provider>
	);
}
