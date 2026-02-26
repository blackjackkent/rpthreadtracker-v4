"use client";

import { AuthenticatedLayout } from "./AuthenticatedLayout";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

interface LayoutContentProps {
	children: React.ReactNode;
}

export const LayoutContent = ({ children }: LayoutContentProps) => {
	const { data: session, status } = useSession();
	const router = useRouter();
	const pathname = usePathname();

	const isLoginPage = pathname === "/login";
	const isPublicPage = pathname.startsWith("/public");

	useEffect(() => {
		if (status === "unauthenticated" && !isLoginPage && !isPublicPage) {
			router.push("/login");
		}
	}, [status, router, isLoginPage, isPublicPage]);

	if (status === "loading" && !isPublicPage) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-text-muted">Loading...</div>
			</div>
		);
	}

	// Login and public pages don't need the authenticated layout
	if (isLoginPage || isPublicPage) {
		return <>{children}</>;
	}

	// Authenticated pages get the layout wrapper
	if (!session) {
		return null; // Will redirect via useEffect
	}

	return <AuthenticatedLayout user={session.user}>{children}</AuthenticatedLayout>;
};