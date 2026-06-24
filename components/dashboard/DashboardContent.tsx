"use client";

import { AtAGlance } from "./at-a-glance/AtAGlance";
import { RecentActivity } from "./recent-activity/RecentActivity";
import { YourCharacters } from "./your-characters/YourCharacters";
import { RandomThreadGenerator } from "./random-thread/RandomThreadGenerator";
import { SupportTracker } from "./support/SupportTracker";
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
			<AtAGlance
				activeThreadsCount={dashboardStats?.activeThreadsCount}
				yourTurnCount={dashboardStats?.yourTurnCount}
				theirTurnCount={dashboardStats?.theirTurnCount}
				queuedCount={dashboardStats?.queuedCount}
				isLoading={!dashboardStats && isRefreshing}
			/>

			{/* Two Column Layout for Recent Activity and Your Characters */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<RecentActivity />
				<YourCharacters />
			</div>

			{/* Two Column Layout for Random Thread Generator and Support */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<RandomThreadGenerator />
				<SupportTracker />
			</div>
		</div>
	);
}
