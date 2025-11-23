import { auth } from "@/lib/auth";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
import { redirect } from "next/navigation";
import { AtAGlance } from "@/components/dashboard/AtAGlance";
import { getActiveThreadsCount, getQueuedThreadsCount } from "@/lib/db";

export default async function Home() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // Fetch real data from database
  const [activeThreadsCount, queuedCount] = await Promise.all([
    getActiveThreadsCount(session.user.id),
    getQueuedThreadsCount(session.user.id),
  ]);

  // TODO: Replace with real data from TumblrClient API (Phase 3)
  // Your Turn and Their Turn require Tumblr API integration
  const mockStats = {
    activeThreadsCount,
    yourTurnCount: 0, // Will be calculated via Tumblr API
    theirTurnCount: 0, // Will be calculated via Tumblr API
    queuedCount,
  };

  return (
    <AuthenticatedLayout user={session.user}>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="text-text-muted mt-1">
            Welcome back, <span className="font-semibold text-text">{session.user.name}</span>
          </p>
        </div>

        {/* At a Glance Section */}
        <AtAGlance
          activeThreadsCount={mockStats.activeThreadsCount}
          yourTurnCount={mockStats.yourTurnCount}
          theirTurnCount={mockStats.theirTurnCount}
          queuedCount={mockStats.queuedCount}
        />
      </div>
    </AuthenticatedLayout>
  );
}
