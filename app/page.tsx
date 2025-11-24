import { auth } from "@/lib/auth";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { redirect } from "next/navigation";
import { AtAGlance } from "@/components/dashboard/at-a-glance/AtAGlance";
import { getDashboardStats } from "@/lib/thread-status-service";

// Force dynamic rendering to always fetch fresh data
export const dynamic = "force-dynamic";

export default async function Home() {
	const session = await auth();

	if (!session) {
		redirect("/login");
	}

	// Fetch dashboard stats (includes Tumblr API data for Your Turn/Their Turn/Queued)
	const stats = await getDashboardStats(session.user.id);

	return (
		<AuthenticatedLayout user={session.user}>
			<div className="space-y-6 p-6">
				<div>
					<h1 className="text-3xl font-semibold">Dashboard</h1>
					<p className="text-text-muted mt-1">
						Welcome back,{" "}
						<span className="font-semibold text-text">{session.user.name}</span>
					</p>
				</div>

				{/* At a Glance Section */}
				<AtAGlance
					activeThreadsCount={stats.activeThreadsCount}
					yourTurnCount={stats.yourTurnCount}
					theirTurnCount={stats.theirTurnCount}
					queuedCount={stats.queuedCount}
				/>
			</div>
		</AuthenticatedLayout>
	);
}
