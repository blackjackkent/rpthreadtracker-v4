import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@rpthreadtracker.com";
const APP_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

function emailWrapper(content: string): string {
	return `
		<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
			${content}
			<hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
			<p style="color: #888; font-size: 12px;">RPThreadTracker</p>
		</div>
	`;
}

function primaryButton(label: string, url: string): string {
	return `
		<p style="margin: 32px 0;">
			<a
				href="${url}"
				style="background-color: #418ce4; color: #ffffff; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-weight: bold;"
			>
				<span style="color: #ffffff;">${label}</span>
			</a>
		</p>
		<p style="color: #888; font-size: 12px;">
			Or copy this link into your browser:<br />
			<a href="${url}" style="color: #418ce4;">${url}</a>
		</p>
	`;
}

export async function sendPasswordResetEmail(
	toEmail: string,
	token: string
): Promise<void> {
	const resetUrl = `${APP_URL}/reset-password/${token}`;

	await resend.emails.send({
		from: FROM,
		to: toEmail,
		subject: "Reset your RPThreadTracker password",
		html: emailWrapper(`
			<h2 style="color: #418ce4;">Reset your password</h2>
			<p>We received a request to reset the password for your RPThreadTracker account.</p>
			<p>Click the button below to choose a new password. This link expires in <strong>1 hour</strong>.</p>
			${primaryButton("Reset Password", resetUrl)}
			<p style="color: #888; font-size: 14px;">
				If you didn't request a password reset, you can safely ignore this email.
				Your password will not change.
			</p>
		`),
	});
}

export async function sendEmailChangeVerificationEmail(
	toEmail: string,
	token: string
): Promise<void> {
	const verifyUrl = `${APP_URL}/verify-email/${token}`;

	await resend.emails.send({
		from: FROM,
		to: toEmail,
		subject: "Verify your new email address",
		html: emailWrapper(`
			<h2 style="color: #418ce4;">Verify your email address</h2>
			<p>We received a request to change the email address on your RPThreadTracker account to <strong>${toEmail}</strong>.</p>
			<p>Click the button below to confirm this change. This link expires in <strong>24 hours</strong>.</p>
			${primaryButton("Verify Email Address", verifyUrl)}
			<p style="color: #888; font-size: 14px;">
				If you didn't request this change, you can safely ignore this email.
				Your email address will not change.
			</p>
		`),
	});
}
