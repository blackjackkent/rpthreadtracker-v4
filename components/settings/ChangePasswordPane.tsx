"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import { changePassword } from "@/app/actions/settings";

export const ChangePasswordPane = () => {
	const [form, setForm] = useState({
		currentPassword: "",
		newPassword: "",
		confirmPassword: "",
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});

	const validate = () => {
		const errs: Record<string, string> = {};
		if (!form.currentPassword) errs.currentPassword = "Required";
		if (!form.newPassword) errs.newPassword = "Required";
		else if (form.newPassword.length < 6)
			errs.newPassword = "Must be at least 6 characters";
		if (!form.confirmPassword) errs.confirmPassword = "Required";
		else if (form.newPassword !== form.confirmPassword)
			errs.confirmPassword = "Passwords do not match";
		return errs;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const errs = validate();
		if (Object.keys(errs).length > 0) {
			setErrors(errs);
			return;
		}
		setErrors({});
		setIsSubmitting(true);
		try {
			await changePassword(
				form.currentPassword,
				form.newPassword,
				form.confirmPassword
			);
			toast.success("Password updated successfully.");
			setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to update password"
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const field = (
		key: keyof typeof form,
		label: string,
		placeholder?: string
	) => (
		<div>
			<label htmlFor={`pw-${key}`} className="block text-sm font-medium mb-1">{label}</label>
			<input
				id={`pw-${key}`}
				type="password"
				value={form[key]}
				onChange={(e) => {
					setErrors((prev) => ({ ...prev, [key]: "" }));
					setForm((prev) => ({ ...prev, [key]: e.target.value }));
				}}
				placeholder={placeholder}
				disabled={isSubmitting}
				className={`w-full px-3 py-2 bg-background border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
					errors[key] ? "border-red-500" : "border-border"
				}`}
			/>
			{errors[key] && (
				<p className="mt-1 text-xs text-red-500">{errors[key]}</p>
			)}
		</div>
	);

	return (
		<div className="bg-surface border border-border rounded-lg shadow-sm">
			<div className="px-6 py-4 border-b border-border">
				<h2 className="text-lg font-semibold">Change Password</h2>
			</div>
			<form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
				{field("currentPassword", "Current Password")}
				<div>
					<label htmlFor="pw-newPassword" className="block text-sm font-medium mb-1">
						New Password
					</label>
					<input
						id="pw-newPassword"
						type="password"
						value={form.newPassword}
						onChange={(e) => {
							setErrors((prev) => ({ ...prev, newPassword: "" }));
							setForm((prev) => ({ ...prev, newPassword: e.target.value }));
						}}
						disabled={isSubmitting}
						className={`w-full px-3 py-2 bg-background border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
							errors.newPassword ? "border-red-500" : "border-border"
						}`}
					/>
					{errors.newPassword ? (
						<p className="mt-1 text-xs text-red-500">{errors.newPassword}</p>
					) : (
						<p className="mt-1 text-xs text-text-muted flex items-center gap-1">
							<FontAwesomeIcon icon={faInfoCircle} className="w-3 h-3" />
							Must be at least 6 characters and include uppercase, lowercase,
							a number, and a symbol.
						</p>
					)}
				</div>
				{field("confirmPassword", "Confirm New Password")}

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
							"Update Password"
						)}
					</button>
				</div>
			</form>
		</div>
	);
};
