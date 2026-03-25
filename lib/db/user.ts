import { prisma } from "./db";

export async function getUserByEmail(email: string) {
	return prisma.aspNetUsers.findFirst({
		where: {
			NormalizedEmail: email.toUpperCase(),
		},
	});
}

export async function getUserByUsername(username: string) {
	return prisma.aspNetUsers.findFirst({
		where: {
			NormalizedUserName: username.toUpperCase(),
		},
	});
}

export async function updateUserPassword(
	userId: string,
	newPasswordHash: string
): Promise<void> {
	await prisma.aspNetUsers.update({
		where: { Id: userId },
		data: { PasswordHash: newPasswordHash },
	});
}

export async function getUserById(userId: string) {
	return prisma.aspNetUsers.findUnique({
		where: { Id: userId },
		select: {
			Id: true,
			UserName: true,
			Email: true,
			NormalizedEmail: true,
			NormalizedUserName: true,
			PasswordHash: true,
		},
	});
}

export async function updateUsername(
	userId: string,
	newUsername: string
): Promise<void> {
	await prisma.aspNetUsers.update({
		where: { Id: userId },
		data: {
			UserName: newUsername,
			NormalizedUserName: newUsername.toUpperCase(),
		},
	});
}

export async function updateUserEmail(
	userId: string,
	newEmail: string
): Promise<void> {
	await prisma.aspNetUsers.update({
		where: { Id: userId },
		data: {
			Email: newEmail,
			NormalizedEmail: newEmail.toUpperCase(),
		},
	});
}

export async function deleteUser(userId: string): Promise<void> {
	// Delete PublicViews first (no FK cascade defined to AspNetUsers)
	await prisma.publicViews.deleteMany({ where: { UserId: userId } });
	// Delete the user — DB cascades to Characters, Threads, ProfileSettings, RefreshTokens
	await prisma.aspNetUsers.delete({ where: { Id: userId } });
}
