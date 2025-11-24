"use client";

import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
	const { data: session, status } = useSession();
	const router = useRouter();

	useEffect(() => {
		if (status === "unauthenticated") {
			router.push("/login");
		}
	}, [status, router]);

	if (status === "loading") {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-text-muted">Loading...</div>
			</div>
		);
	}

	if (!session) {
		return null; // Will redirect via useEffect
	}

	return (
		<AuthenticatedLayout user={session.user}>
			<DashboardContent userName={session.user.name || "User"} />
		</AuthenticatedLayout>
	);
}
