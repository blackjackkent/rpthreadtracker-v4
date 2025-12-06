"use client";

import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { useSession } from "next-auth/react";

export default function Home() {
	const { data: session } = useSession();

	// Auth logic is now handled in root layout
	if (!session) {
		return null;
	}

	return <DashboardContent userName={session.user.name || "User"} />;
}
