"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { verifyEmailChange } from "@/app/actions/settings";

interface VerifyEmailPageProps {
	params: Promise<{ token: string }>;
}

export default function VerifyEmailPage({ params }: VerifyEmailPageProps) {
	const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
	const [newEmail, setNewEmail] = useState("");
	const [error, setError] = useState("");
	const hasVerified = useRef(false);

	useEffect(() => {
		if (hasVerified.current) return;
		hasVerified.current = true;

		params.then(({ token }) =>
			verifyEmailChange(token)
				.then(({ newEmail }) => {
					setNewEmail(newEmail);
					setStatus("success");
				})
				.catch((err) => {
					setError(err instanceof Error ? err.message : "Something went wrong.");
					setStatus("error");
				})
		);
	}, [params]);

	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="w-full max-w-md space-y-6 p-8 text-center">
				{status === "loading" && (
					<p className="text-text-muted">Verifying your email address...</p>
				)}

				{status === "success" && (
					<>
						<h2 className="text-2xl font-bold">Email updated</h2>
						<p className="text-text-muted">
							Your email address has been changed to{" "}
							<strong>{newEmail}</strong>.
						</p>
						<Link
							href="/settings"
							className="inline-block mt-4 text-primary hover:underline"
						>
							Back to Settings
						</Link>
					</>
				)}

				{status === "error" && (
					<>
						<h2 className="text-2xl font-bold">Verification failed</h2>
						<p className="text-text-muted">{error}</p>
						<Link
							href="/settings"
							className="inline-block mt-4 text-primary hover:underline"
						>
							Back to Settings
						</Link>
					</>
				)}
			</div>
		</div>
	);
}
