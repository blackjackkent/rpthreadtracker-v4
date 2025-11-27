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
