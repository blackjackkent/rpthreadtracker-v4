import { prisma } from "@/lib/db/db";
import { randomBytes, createHash } from "crypto";

const TOKEN_EXPIRY_HOURS = 24;

/** Generates a secure token, stores the SHA-256 hash alongside the new email, returns the raw token for the email link. */
export async function createEmailChangeToken(
	userId: string,
	newEmail: string
): Promise<string> {
	// Invalidate any existing unused tokens for this user
	await prisma.emailChangeTokens.updateMany({
		where: { UserId: userId, UsedUtc: null },
		data: { UsedUtc: new Date() },
	});

	const rawToken = randomBytes(32).toString("hex");
	const hashedToken = createHash("sha256").update(rawToken).digest("hex");

	const expiresUtc = new Date();
	expiresUtc.setHours(expiresUtc.getHours() + TOKEN_EXPIRY_HOURS);

	await prisma.emailChangeTokens.create({
		data: {
			Id: crypto.randomUUID(),
			UserId: userId,
			NewEmail: newEmail,
			Token: hashedToken,
			ExpiresUtc: expiresUtc,
		},
	});

	return rawToken;
}

/** Returns the pending record (userId + newEmail) if the token is valid, null otherwise. */
export async function validateEmailChangeToken(
	rawToken: string
): Promise<{ userId: string; newEmail: string } | null> {
	const hashedToken = createHash("sha256").update(rawToken).digest("hex");

	const record = await prisma.emailChangeTokens.findFirst({
		where: {
			Token: hashedToken,
			UsedUtc: null,
			ExpiresUtc: { gt: new Date() },
		},
	});

	if (!record) return null;
	return { userId: record.UserId, newEmail: record.NewEmail };
}

/** Marks a token as used so it can't be reused. */
export async function consumeEmailChangeToken(rawToken: string): Promise<void> {
	const hashedToken = createHash("sha256").update(rawToken).digest("hex");

	await prisma.emailChangeTokens.updateMany({
		where: { Token: hashedToken },
		data: { UsedUtc: new Date() },
	});
}
