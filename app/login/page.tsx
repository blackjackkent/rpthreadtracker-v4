"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";

const loginSchema = z.object({
	login: z.string().min(1, "Email or username is required"),
	password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const resetSuccess = searchParams.get("reset") === "success";
	const [error, setError] = useState<string | null>(null);

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<LoginFormData>({
		resolver: zodResolver(loginSchema),
	});

	async function onSubmit(data: LoginFormData) {
		setError(null);

		try {
			const result = await signIn("credentials", {
				login: data.login,
				password: data.password,
				redirect: false,
			});

			if (result?.error) {
				setError("Invalid email/username or password");
			} else {
				router.push("/");
				router.refresh();
			}
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
		} catch (error) {
			setError("An error occurred. Please try again.");
		}
	}

	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="w-full max-w-md space-y-8 p-8">
				<div>
					<h2 className="text-center text-3xl font-bold">
						Sign in to your account
					</h2>
				</div>

				{resetSuccess && (
					<div className="rounded-md bg-green-50 p-4 dark:bg-green-900/20">
						<p className="text-sm text-green-800 dark:text-green-300">
							Your password has been reset. You can now sign in with your new password.
						</p>
					</div>
				)}

				<form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
					<div className="space-y-4">
						<div>
							<label htmlFor="login" className="block text-sm font-medium">
								Email or Username
							</label>
							<input
								id="login"
								type="text"
								{...register("login")}
								className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
								disabled={isSubmitting}
							/>
							{errors.login && (
								<p className="mt-1 text-sm text-red-500">
									{errors.login.message}
								</p>
							)}
						</div>
						<div>
							<label htmlFor="password" className="block text-sm font-medium">
								Password
							</label>
							<input
								id="password"
								type="password"
								{...register("password")}
								className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
								disabled={isSubmitting}
							/>
							{errors.password && (
								<p className="mt-1 text-sm text-red-500">
									{errors.password.message}
								</p>
							)}
						</div>
					</div>

					{error && (
						<div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
							<p className="text-sm text-red-800 dark:text-red-300">{error}</p>
						</div>
					)}

					<button
						type="submit"
						disabled={isSubmitting}
						className="w-full rounded-md bg-primary px-4 py-2 text-white hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						{isSubmitting ? "Signing in..." : "Sign in"}
					</button>

					<div className="space-y-2 text-center text-sm text-text-muted">
						<p>
							<Link href="/forgot-password" className="text-primary hover:underline">
								Forgot your password?
							</Link>
						</p>
						<p>
							Don&apos;t have an account?{" "}
							<Link href="/register" className="text-primary hover:underline">
								Create one
							</Link>
						</p>
					</div>
				</form>
			</div>
		</div>
	);
}
