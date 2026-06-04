"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import { updateAccountInfo, requestEmailChange } from "@/app/actions/settings";

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
	const [usernameError, setUsernameError] = useState("");

	const [newEmail, setNewEmail] = useState("");
	const [isSendingVerification, setIsSendingVerification] = useState(false);
	const [emailError, setEmailError] = useState("");

	const handleUsernameSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setUsernameError("");

		const trimmed = username.trim();
		if (!trimmed) { setUsernameError("Username is required"); return; }
		if (trimmed.length < 3) { setUsernameError("Username must be at least 3 characters"); return; }

		setIsSubmitting(true);
		try {
			const { newUsername } = await updateAccountInfo(trimmed);
			await update({ name: newUsername });
			toast.success("Username updated.");
		} catch (err) {
			setUsernameError(err instanceof Error ? err.message : "Failed to update username");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleEmailChange = async (e: React.FormEvent) => {
		e.preventDefault();
		setEmailError("");

		const trimmed = newEmail.trim();
		if (!trimmed) { setEmailError("Email is required"); return; }

		setIsSendingVerification(true);
		try {
			await requestEmailChange(trimmed);
			toast.success(`Verification email sent to ${trimmed}. Click the link to confirm the change.`);
			setNewEmail("");
		} catch (err) {
			setEmailError(err instanceof Error ? err.message : "Failed to send verification email");
		} finally {
			setIsSendingVerification(false);
		}
	};

	return (
		<div className="space-y-6">
			{/* Username */}
			<div className="bg-surface border border-border rounded-lg shadow-sm">
				<div className="px-6 py-4 border-b border-border">
					<h2 className="text-lg font-semibold">Username</h2>
				</div>
				<form onSubmit={handleUsernameSubmit} className="px-6 py-4 space-y-4">
					{usernameError && (
						<div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded text-sm">
							{usernameError}
						</div>
					)}
					<div>
						<label htmlFor="acct-username" className="block text-sm font-medium mb-1">Username</label>
						<input
							id="acct-username"
							type="text"
							value={username}
							onChange={(e) => { setUsernameError(""); setUsername(e.target.value); }}
							disabled={isSubmitting}
							className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
						/>
					</div>
					<div className="pt-2">
						<button
							type="submit"
							disabled={isSubmitting}
							className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isSubmitting ? (
								<><FontAwesomeIcon icon={faSpinner} className="w-3.5 h-3.5 animate-spin mr-1.5" />Saving...</>
							) : "Save Username"}
						</button>
					</div>
				</form>
			</div>

			{/* Email */}
			<div className="bg-surface border border-border rounded-lg shadow-sm">
				<div className="px-6 py-4 border-b border-border">
					<h2 className="text-lg font-semibold">Email Address</h2>
				</div>
				<div className="px-6 py-4 space-y-4">
					<div>
						<label htmlFor="acct-current-email" className="block text-sm font-medium mb-1">Current email</label>
						<input
							id="acct-current-email"
							type="email"
							value={user.email}
							disabled
							className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm opacity-60 cursor-not-allowed"
						/>
					</div>
					<form onSubmit={handleEmailChange} className="space-y-4">
						{emailError && (
							<div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded text-sm">
								{emailError}
							</div>
						)}
						<div>
							<label htmlFor="acct-new-email" className="block text-sm font-medium mb-1">New email address</label>
							<input
								id="acct-new-email"
								type="email"
								value={newEmail}
								onChange={(e) => { setEmailError(""); setNewEmail(e.target.value); }}
								disabled={isSendingVerification}
								placeholder="new@example.com"
								className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
							/>
							<p className="mt-1 text-xs text-text-muted">
								A verification link will be sent to the new address. Your email won&apos;t change until you click it.
							</p>
						</div>
						<div>
							<button
								type="submit"
								disabled={isSendingVerification || !newEmail.trim()}
								className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{isSendingVerification ? (
									<><FontAwesomeIcon icon={faSpinner} className="w-3.5 h-3.5 animate-spin mr-1.5" />Sending...</>
								) : "Send Verification Email"}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
};
