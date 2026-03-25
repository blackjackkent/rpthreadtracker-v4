"use server";

import { auth } from "@/lib/auth";
import {
	getUserById,
	getUserByEmail,
	getUserByUsername,
	updateUserPassword,
	updateUsername,
	updateUserEmail,
	deleteUser,
} from "@/lib/db/user";
import {
	createEmailChangeToken,
} from "@/lib/db/email-change";
import { sendEmailChangeVerificationEmail } from "@/lib/email";
import {
	verifyPassword,
	hashPasswordBcrypt,
} from "@/lib/password-verifiers";
import { revalidatePath } from "next/cache";

export async function changePassword(
	currentPassword: string,
	newPassword: string,
	confirmPassword: string
): Promise<void> {
	const session = await auth();
	if (!session?.user?.id) throw new Error("Unauthorized");

	if (!currentPassword) throw new Error("Current password is required");
	if (!newPassword || newPassword.length < 6)
		throw new Error("New password must be at least 6 characters");
	if (newPassword !== confirmPassword)
		throw new Error("Passwords do not match");

	const user = await getUserById(session.user.id);
	if (!user?.PasswordHash) throw new Error("User not found");

	const { verified } = await verifyPassword(currentPassword, user.PasswordHash);
	if (!verified) throw new Error("Current password is incorrect");

	const newHash = await hashPasswordBcrypt(newPassword);
	await updateUserPassword(session.user.id, newHash);
}

export async function updateAccountInfo(
	username: string
): Promise<{ newUsername: string }> {
	const session = await auth();
	if (!session?.user?.id) throw new Error("Unauthorized");

	const trimmed = username.trim();
	if (!trimmed) throw new Error("Username is required");
	if (trimmed.length < 3) throw new Error("Username must be at least 3 characters");
	if (trimmed.length > 256) throw new Error("Username must be 256 characters or fewer");

	// Check uniqueness (exclude current user)
	const existing = await getUserByUsername(trimmed);
	if (existing && existing.Id !== session.user.id) {
		throw new Error("That username is already taken");
	}

	await updateUsername(session.user.id, trimmed);
	revalidatePath("/", "layout");
	return { newUsername: trimmed };
}

export async function requestEmailChange(newEmail: string): Promise<void> {
	const session = await auth();
	if (!session?.user?.id) throw new Error("Unauthorized");

	const trimmed = newEmail.trim().toLowerCase();
	if (!trimmed) throw new Error("Email is required");
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed))
		throw new Error("Invalid email address");

	// Silently do nothing if the address is already in use — don't reveal it
	const existing = await getUserByEmail(trimmed);
	if (existing && existing.Id !== session.user.id) return;

	const token = await createEmailChangeToken(session.user.id, trimmed);
	await sendEmailChangeVerificationEmail(trimmed, token);
}

export async function verifyEmailChange(
	rawToken: string
): Promise<{ newEmail: string }> {
	const { validateEmailChangeToken, consumeEmailChangeToken } = await import(
		"@/lib/db/email-change"
	);

	const result = await validateEmailChangeToken(rawToken);
	if (!result) throw new Error("This verification link is invalid or has expired");

	await updateUserEmail(result.userId, result.newEmail);
	await consumeEmailChangeToken(rawToken);
	revalidatePath("/", "layout");
	return { newEmail: result.newEmail };
}

export async function deleteAccount(): Promise<void> {
	const session = await auth();
	if (!session?.user?.id) throw new Error("Unauthorized");

	await deleteUser(session.user.id);
}
