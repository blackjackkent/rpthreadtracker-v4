"use client";

import { useThreadStatus } from "@/components/providers/ThreadStatusProvider";

export const RefreshProgressBar = () => {
	const { isRefreshing, progress } = useThreadStatus();

	if (!isRefreshing) return null;

	const hasProgress = progress && progress.total > 0;
	const percent = hasProgress
		? Math.round((progress.current / progress.total) * 100)
		: 0;

	return (
		<div className="h-1.5 w-full bg-primary-dark">
			{hasProgress ? (
				<div
					className="h-full bg-primary-light transition-all duration-300"
					style={{ width: `${percent}%` }}
				/>
			) : (
				<div className="h-full bg-primary-light animate-indeterminate" />
			)}
		</div>
	);
};
