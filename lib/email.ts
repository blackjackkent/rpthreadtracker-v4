import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@rpthreadtracker.com";
const APP_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

export async function sendPasswordResetEmail(
	toEmail: string,
	token: string
): Promise<void> {
	const resetUrl = `${APP_URL}/reset-password/${token}`;

	await resend.emails.send({
		from: FROM,
		to: toEmail,
		subject: "Reset your RPThreadTracker password",
		html: `
			<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
				<h2 style="color: #418ce4;">Reset your password</h2>
				<p>We received a request to reset the password for your RPThreadTracker account.</p>
				<p>Click the button below to choose a new password. This link expires in <strong>1 hour</strong>.</p>
				<p style="margin: 32px 0;">
					<a
						href="${resetUrl}"
						style="background-color: #418ce4; color: #ffffff; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-weight: bold;"
					>
						Reset Password
					</a>
				</p>
				<p style="color: #888; font-size: 14px;">
					If you didn't request a password reset, you can safely ignore this email.
					Your password will not change.
				</p>
				<p style="color: #888; font-size: 12px;">
					Or copy this link into your browser:<br />
					<a href="${resetUrl}" style="color: #418ce4;">${resetUrl}</a>
				</p>
			</div>
		`,
	});
}
