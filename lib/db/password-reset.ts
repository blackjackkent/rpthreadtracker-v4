import { prisma } from "@/lib/db/db";
import { randomBytes, createHash } from "crypto";

const TOKEN_EXPIRY_HOURS = 1;

/** Generates a secure random token, stores the SHA-256 hash, returns the raw token for the email link. */
export async function createPasswordResetToken(userId: string): Promise<string> {
	// Invalidate any existing unused tokens for this user
	await prisma.passwordResetTokens.updateMany({
		where: { UserId: userId, UsedUtc: null },
		data: { UsedUtc: new Date() },
	});

	const rawToken = randomBytes(32).toString("hex");
	const hashedToken = createHash("sha256").update(rawToken).digest("hex");

	const expiresUtc = new Date();
	expiresUtc.setHours(expiresUtc.getHours() + TOKEN_EXPIRY_HOURS);

	await prisma.passwordResetTokens.create({
		data: {
			Id: crypto.randomUUID(),
			UserId: userId,
			Token: hashedToken,
			ExpiresUtc: expiresUtc,
		},
	});

	return rawToken;
}

/** Looks up a valid (unexpired, unused) token. Returns the userId if valid, null otherwise. */
export async function validatePasswordResetToken(
	rawToken: string
): Promise<string | null> {
	const hashedToken = createHash("sha256").update(rawToken).digest("hex");

	const record = await prisma.passwordResetTokens.findFirst({
		where: {
			Token: hashedToken,
			UsedUtc: null,
			ExpiresUtc: { gt: new Date() },
		},
	});

	return record?.UserId ?? null;
}

/** Marks a token as used so it can't be reused. */
export async function consumePasswordResetToken(rawToken: string): Promise<void> {
	const hashedToken = createHash("sha256").update(rawToken).digest("hex");

	await prisma.passwordResetTokens.updateMany({
		where: { Token: hashedToken },
		data: { UsedUtc: new Date() },
	});
}
