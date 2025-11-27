import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Authentication helper for API routes
 *
 * Use this to ensure API routes are only accessible to authenticated users.
 * Returns the session if authenticated, or a 401 response if not.
 *
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const authResult = await requireAuth();
 *   if (authResult instanceof NextResponse) return authResult; // Not authenticated
 *   const session = authResult; // Authenticated
 *
 *   // Your route logic here
 * }
 * ```
 */
export async function requireAuth() {
	const session = await auth();

	if (!session) {
		return NextResponse.json(
			{ error: "Unauthorized - Authentication required" },
			{ status: 401 }
		);
	}

	return session;
}

/**
 * Optional authentication helper for API routes
 *
 * Use this when you want to know if a user is authenticated but don't require it.
 * Always returns the session (or null), never a response.
 *
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const session = await getOptionalAuth();
 *
 *   if (session) {
 *     // Personalized response
 *   } else {
 *     // Public response
 *   }
 * }
 * ```
 */
export async function getOptionalAuth() {
	const session = await auth();
	return session;
}
