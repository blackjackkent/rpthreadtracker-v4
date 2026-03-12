"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import { updateAccountInfo } from "@/app/actions/settings";

interface UpdateAccountInfoPaneProps {
	user: {
		id: string;
		userName: string;
		email: string;
	};
}

export const UpdateAccountInfoPane = ({ user }: UpdateAccountInfoPaneProps) => {
	const { update } = useSession();
	const [username, setUsername] = useState(user.userName);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		const trimmed = username.trim();
		if (!trimmed) {
			setError("Username is required");
			return;
		}
		if (trimmed.length < 3) {
			setError("Username must be at least 3 characters");
			return;
		}

		setIsSubmitting(true);
		try {
			const { newUsername } = await updateAccountInfo(trimmed);
			// Refresh the NextAuth session so the new username is reflected immediately
			await update({ name: newUsername });
			toast.success("Account info updated.");
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to update account info"
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="bg-surface border border-border rounded-lg shadow-sm">
			<div className="px-6 py-4 border-b border-border">
				<h2 className="text-lg font-semibold">Account Info</h2>
			</div>
			<form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
				{error && (
					<div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded text-sm">
						{error}
					</div>
				)}

				{/* Username */}
				<div>
					<label className="block text-sm font-medium mb-1">
						Username
					</label>
					<input
						type="text"
						value={username}
						onChange={(e) => {
							setError("");
							setUsername(e.target.value);
						}}
						disabled={isSubmitting}
						className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
					/>
				</div>

				{/* Email — disabled, coming soon */}
				<div>
					<label className="block text-sm font-medium mb-1">
						Email
					</label>
					<input
						type="email"
						value={user.email}
						disabled
						className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm opacity-60 cursor-not-allowed"
					/>
					<p className="mt-1 text-xs text-text-muted flex items-center gap-1">
						<FontAwesomeIcon icon={faInfoCircle} className="w-3 h-3 shrink-0" />
						Email updates require email verification, which is coming soon.
					</p>
				</div>

				<div className="pt-2">
					<button
						type="submit"
						disabled={isSubmitting}
						className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isSubmitting ? (
							<>
								<FontAwesomeIcon
									icon={faSpinner}
									className="w-3.5 h-3.5 animate-spin mr-1.5"
								/>
								Saving...
							</>
						) : (
							"Save Changes"
						)}
					</button>
				</div>
			</form>
		</div>
	);
};
