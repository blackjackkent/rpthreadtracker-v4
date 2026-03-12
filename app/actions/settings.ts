"use server";

import { auth } from "@/lib/auth";
import {
	getUserById,
	getUserByUsername,
	updateUserPassword,
	updateUsername,
	deleteUser,
} from "@/lib/db/user";
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

export async function deleteAccount(): Promise<void> {
	const session = await auth();
	if (!session?.user?.id) throw new Error("Unauthorized");

	await deleteUser(session.user.id);
}
