"use client";

import { AtAGlance } from "./at-a-glance/AtAGlance";
import { useThreadStatus } from "@/components/providers/ThreadStatusProvider";

interface DashboardContentProps {
	userName: string;
}

export function DashboardContent({ userName }: DashboardContentProps) {
	const { dashboardStats, isRefreshing } = useThreadStatus();

	return (
		<div className="space-y-6 p-6">
			<div>
				<h1 className="text-3xl font-semibold">Dashboard</h1>
				<p className="text-text-muted mt-1">
					Welcome back,{" "}
					<span className="font-semibold text-text">{userName}</span>
				</p>
			</div>

			{/* At a Glance Section */}
			{dashboardStats ? (
				<AtAGlance
					activeThreadsCount={dashboardStats.activeThreadsCount}
					yourTurnCount={dashboardStats.yourTurnCount}
					theirTurnCount={dashboardStats.theirTurnCount}
					queuedCount={dashboardStats.queuedCount}
				/>
			) : (
				<div className="text-text-muted">
					{isRefreshing ? "Loading thread data..." : "No thread data available"}
				</div>
			)}
		</div>
	);
}
