"use client";

import { useState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/app/actions/auth";

export default function ForgotPasswordPage() {
	const [email, setEmail] = useState("");
	const [submitted, setSubmitted] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setIsLoading(true);

		try {
			await requestPasswordReset(email);
			setSubmitted(true);
		} catch {
			setError("Something went wrong. Please try again.");
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="w-full max-w-md space-y-8 p-8">
				<div>
					<h2 className="text-center text-3xl font-bold">Reset your password</h2>
				</div>

				{submitted ? (
					<div className="space-y-4">
						<div className="rounded-md bg-green-50 p-4 dark:bg-green-900/20">
							<p className="text-sm text-green-800 dark:text-green-300">
								If an account exists for <strong>{email}</strong>, you&apos;ll
								receive a password reset link shortly. Check your inbox (and spam
								folder).
							</p>
						</div>
						<p className="text-center text-sm text-text-muted">
							<Link href="/login" className="text-primary hover:underline">
								Back to sign in
							</Link>
						</p>
					</div>
				) : (
					<form className="mt-8 space-y-6" onSubmit={handleSubmit}>
						<div>
							<label htmlFor="email" className="block text-sm font-medium">
								Email address
							</label>
							<input
								id="email"
								type="email"
								required
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
								disabled={isLoading}
								placeholder="you@example.com"
							/>
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
							{isLoading ? (
								<span className="flex items-center justify-center gap-2">
									<span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
									Sending...
								</span>
							) : "Send reset link"}
						</button>

						<p className="text-center text-sm text-text-muted">
							<Link href="/login" className="text-primary hover:underline">
								Back to sign in
							</Link>
						</p>
					</form>
				)}
			</div>
		</div>
	);
}
