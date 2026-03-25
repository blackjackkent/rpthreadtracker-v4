"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { resetPassword } from "@/app/actions/auth";

interface ResetPasswordPageProps {
	params: Promise<{ token: string }>;
}

export default function ResetPasswordPage({ params }: ResetPasswordPageProps) {
	const router = useRouter();
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setIsLoading(true);

		try {
			const { token } = await params;
			await resetPassword(token, newPassword, confirmPassword);
			router.push("/login?reset=success");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="w-full max-w-md space-y-8 p-8">
				<div>
					<h2 className="text-center text-3xl font-bold">Choose a new password</h2>
				</div>

				<form className="mt-8 space-y-6" onSubmit={handleSubmit}>
					<div className="space-y-4">
						<div>
							<label htmlFor="newPassword" className="block text-sm font-medium">
								New password
							</label>
							<input
								id="newPassword"
								type="password"
								required
								value={newPassword}
								onChange={(e) => setNewPassword(e.target.value)}
								className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
								disabled={isLoading}
								minLength={6}
							/>
						</div>
						<div>
							<label htmlFor="confirmPassword" className="block text-sm font-medium">
								Confirm new password
							</label>
							<input
								id="confirmPassword"
								type="password"
								required
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
								disabled={isLoading}
								minLength={6}
							/>
						</div>
					</div>

					{error && (
						<div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
							<p className="text-sm text-red-800 dark:text-red-300">{error}</p>
						</div>
					)}

					<button
						type="submit"
						disabled={isLoading}
						className="w-full rounded-md bg-primary px-4 py-2 text-white hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						{isLoading ? "Saving..." : "Set new password"}
					</button>

					<p className="text-center text-sm text-text-muted">
						<Link href="/login" className="text-primary hover:underline">
							Back to sign in
						</Link>
					</p>
				</form>
			</div>
		</div>
	);
}
