"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSync } from "@fortawesome/free-solid-svg-icons";
import { useThreadStatus } from "@/components/providers/ThreadStatusProvider";

export function RefreshButton() {
	const { refreshThreadStatuses, isRefreshing, progress } = useThreadStatus();

	return (
		<button
			onClick={refreshThreadStatuses}
			disabled={isRefreshing}
			className="flex items-center gap-2 px-3 py-2 text-text hover:bg-surface rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
			title="Refresh Tumblr data"
			data-testid="refresh-tumblr-button"
		>
			<FontAwesomeIcon
				icon={faSync}
				className={isRefreshing ? "animate-spin" : ""}
			/>
			<span className="hidden sm:inline" data-testid="refresh-progress">
				{isRefreshing
					? progress
						? `Refreshing... ${progress.current}/${progress.total}`
						: "Refreshing..."
					: "Refresh Tumblr Data"}
			</span>
		</button>
	);
}
