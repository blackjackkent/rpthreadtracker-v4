"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { registerUser } from "@/app/actions/auth";

const registerSchema = z
	.object({
		username: z.string().min(1, "Username is required"),
		email: z.string().email("Please enter a valid email address"),
		password: z.string().min(6, "Password must be at least 6 characters"),
		confirmPassword: z.string().min(1, "Please confirm your password"),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<RegisterFormData>({
		resolver: zodResolver(registerSchema),
	});

	async function onSubmit(data: RegisterFormData) {
		setError(null);

		try {
			await registerUser(
				data.username,
				data.email,
				data.password,
				data.confirmPassword
			);

			const result = await signIn("credentials", {
				login: data.username,
				password: data.password,
				redirect: false,
			});

			if (result?.error) {
				setError("Account created, but sign-in failed. Please sign in manually.");
			} else {
				router.push("/");
				router.refresh();
			}
		} catch (err) {
			if (err instanceof Error && err.message.startsWith("Password")) {
				setError(err.message);
			} else {
				setError("Unable to create account. Please check your details and try again.");
			}
		}
	}

	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="w-full max-w-md space-y-8 p-8">
				<div>
					<h2 className="text-center text-3xl font-bold">Create an account</h2>
				</div>

				<form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
					<div className="space-y-4">
						<div>
							<label htmlFor="username" className="block text-sm font-medium">
								Username
							</label>
							<input
								id="username"
								type="text"
								{...register("username")}
								className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
								disabled={isSubmitting}
							/>
							{errors.username && (
								<p className="mt-1 text-sm text-red-500">{errors.username.message}</p>
							)}
						</div>

						<div>
							<label htmlFor="email" className="block text-sm font-medium">
								Email
							</label>
							<input
								id="email"
								type="email"
								{...register("email")}
								className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
								disabled={isSubmitting}
							/>
							{errors.email && (
								<p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
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
								<p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
							)}
						</div>

						<div>
							<label
								htmlFor="confirmPassword"
								className="block text-sm font-medium"
							>
								Confirm Password
							</label>
							<input
								id="confirmPassword"
								type="password"
								{...register("confirmPassword")}
								className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
								disabled={isSubmitting}
							/>
							{errors.confirmPassword && (
								<p className="mt-1 text-sm text-red-500">
									{errors.confirmPassword.message}
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
						{isSubmitting ? "Creating account..." : "Create account"}
					</button>

					<p className="text-center text-sm text-text-muted">
						Already have an account?{" "}
						<Link href="/login" className="text-primary hover:underline">
							Sign in
						</Link>
					</p>
				</form>
			</div>
		</div>
	);
}
