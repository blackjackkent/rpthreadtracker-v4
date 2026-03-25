"use server";

import { getUserByEmail } from "@/lib/db/user";
import {
	createPasswordResetToken,
	validatePasswordResetToken,
	consumePasswordResetToken,
} from "@/lib/db/password-reset";
import { updateUserPassword } from "@/lib/db/user";
import { hashPasswordBcrypt } from "@/lib/password-verifiers";
import { sendPasswordResetEmail } from "@/lib/email";

/**
 * Initiates a password reset. Always returns success to prevent user enumeration —
 * the caller should show the same message whether or not the email exists.
 */
export async function requestPasswordReset(email: string): Promise<void> {
	if (!email?.trim()) throw new Error("Email is required");

	const user = await getUserByEmail(email.trim());
	if (!user?.Email) return; // Silently do nothing if email not found

	const rawToken = await createPasswordResetToken(user.Id);
	await sendPasswordResetEmail(user.Email, rawToken);
}

export async function resetPassword(
	rawToken: string,
	newPassword: string,
	confirmPassword: string
): Promise<void> {
	if (!newPassword || newPassword.length < 6)
		throw new Error("Password must be at least 6 characters");
	if (newPassword !== confirmPassword)
		throw new Error("Passwords do not match");

	const userId = await validatePasswordResetToken(rawToken);
	if (!userId) throw new Error("This reset link is invalid or has expired");

	const newHash = await hashPasswordBcrypt(newPassword);
	await updateUserPassword(userId, newHash);
	await consumePasswordResetToken(rawToken);
}
