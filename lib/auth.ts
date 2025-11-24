import NextAuth, { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const authConfig: NextAuthConfig = {
	providers: [
		Credentials({
			name: "Credentials",
			credentials: {
				login: { label: "Email or Username", type: "text" },
				password: { label: "Password", type: "password" },
			},
			async authorize(credentials) {
				try {
					if (!credentials?.login || !credentials?.password) {
						return null;
					}

					const login = credentials.login as string;
					const password = credentials.password as string;

					// Dynamic imports to avoid loading Node.js modules in Edge Runtime
					const { getUserByEmail, getUserByUsername, updateUserPassword } =
						await import("./db");
					const { verifyPassword, hashPasswordBcrypt } = await import(
						"./password-verifiers"
					);

					// Try to find user by email or username
					let user = await getUserByEmail(login);
					if (!user) {
						user = await getUserByUsername(login);
					}

					if (!user) {
						return null;
					}

					// Check if user is locked out
					if (
						user.LockoutEnabled &&
						user.LockoutEnd &&
						new Date(user.LockoutEnd) > new Date()
					) {
						return null;
					}

					// Verify the password using all known hash formats
					const { verified, hashType } = await verifyPassword(
						password,
						!!user.PasswordHash ? user.PasswordHash : ""
					);

					if (!verified) {
						return null;
					}

					// If the password is verified with legacy or identity hash, migrate to bcrypt
					if (hashType === "legacy" || hashType === "identity") {
						try {
							const newHash = await hashPasswordBcrypt(password);
							await updateUserPassword(user.Id, newHash);
						} catch (error) {
							// Log error but don't fail authentication
							console.error("Failed to migrate password hash:", error);
						}
					}

					// Return user object for the session
					return {
						id: user.Id,
						email: user.Email,
						name: user.UserName,
					};
				} catch (error) {
					console.error("Authentication error:", error);
					return null;
				}
			},
		}),
	],
	pages: {
		signIn: "/login",
	},
	callbacks: {
		async jwt({ token, user }) {
			if (user) {
				token.id = user.id;
			}
			return token;
		},
		async session({ session, token }) {
			if (session.user) {
				session.user.id = token.id as string;
			}
			return session;
		},
	},
	session: {
		strategy: "jwt",
	},
	secret: process.env.NEXTAUTH_SECRET,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
