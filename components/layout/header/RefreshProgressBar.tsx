"use client";

import { useThreadStatus } from "@/components/providers/ThreadStatusProvider";

export const RefreshProgressBar = () => {
	const { isRefreshing, progress } = useThreadStatus();

	if (!isRefreshing || !progress) return null;

	const percent = Math.round((progress.current / progress.total) * 100);

	return (
		<div className="h-1 w-full bg-primary-dark">
			<div
				className="h-full bg-primary-light transition-all duration-300"
				style={{ width: `${percent}%` }}
			/>
		</div>
	);
};
