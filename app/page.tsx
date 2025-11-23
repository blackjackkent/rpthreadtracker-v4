import { auth, signOut } from "@/lib/auth";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <div className="bg-surface p-6 rounded-lg border border-border">
          <p className="text-lg mb-4">
            Welcome back, <span className="font-semibold text-primary">{session.user.name}</span>!
          </p>
          <p className="text-text-muted mb-4">Email: {session.user.email}</p>
          <form
            action={async () => {
              "use server";
              await signOut();
            }}
          >
            <button
              type="submit"
              className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
