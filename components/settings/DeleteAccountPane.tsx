"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faTriangleExclamation,
	faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import { deleteAccount } from "@/app/actions/settings";

export const DeleteAccountPane = () => {
	const [showConfirm, setShowConfirm] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const handleDelete = async () => {
		setIsDeleting(true);
		try {
			await deleteAccount();
			toast.success("Your account has been deleted.");
			await signOut({ callbackUrl: "/" });
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to delete account"
			);
			setIsDeleting(false);
			setShowConfirm(false);
		}
	};

	return (
		<div className="bg-surface border border-red-500/30 rounded-lg shadow-sm">
			<div className="px-6 py-4 border-b border-red-500/30">
				<h2 className="text-lg font-semibold text-red-500">Danger Zone</h2>
			</div>
			<div className="px-6 py-4 space-y-4">
				<div className="flex items-start gap-3 text-sm text-text-muted">
					<FontAwesomeIcon
						icon={faTriangleExclamation}
						className="w-4 h-4 text-red-500 mt-0.5 shrink-0"
					/>
					<p>
						Deleting your account permanently removes all your characters,
						threads, tags, public views, and settings.{" "}
						<strong className="text-text">This cannot be undone.</strong> You
						will be unable to retrieve your tracking data unless you create a
						new account and re-add everything manually.
					</p>
				</div>

				{!showConfirm ? (
					<button
						onClick={() => setShowConfirm(true)}
						className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
					>
						Delete My Account
					</button>
				) : (
					<div className="border border-red-500/50 bg-red-500/5 rounded-lg p-4 space-y-3">
						<p className="text-sm font-medium text-text">
							Are you sure? This action cannot be undone.
						</p>
						<div className="flex items-center gap-2">
							<button
								onClick={handleDelete}
								disabled={isDeleting}
								className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{isDeleting ? (
									<>
										<FontAwesomeIcon
											icon={faSpinner}
											className="w-3.5 h-3.5 animate-spin mr-1.5"
										/>
										Deleting...
									</>
								) : (
									"Yes, delete my account"
								)}
							</button>
							<button
								onClick={() => setShowConfirm(false)}
								disabled={isDeleting}
								className="px-4 py-2 text-text-muted hover:text-text text-sm transition-colors"
							>
								Cancel
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};
