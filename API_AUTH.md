# API Route Authentication

This document explains how authentication works for API routes in RPThreadTracker v4.

## Overview

**Important:** API routes in Next.js App Router are **NOT** automatically protected by the `proxy.ts` middleware. Each API route must implement its own authentication checks.

### Why API Routes Need Manual Auth

The `proxy.ts` middleware explicitly excludes `/api/*` routes:

```typescript
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

This is intentional to allow flexibility for:
- Public API endpoints (webhooks, health checks)
- Different authentication methods per endpoint
- Custom rate limiting or authorization logic

## Authentication Helpers

We provide two authentication helpers in `lib/api-auth.ts`:

### 1. `requireAuth()` - For Protected Routes

Use this for routes that MUST have an authenticated user.

```typescript
import { requireAuth } from "@/lib/api-auth";
import { NextResponse } from "next/server";

export async function GET() {
  // Require authentication
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult; // 401 if not authenticated
  const session = authResult; // Session object if authenticated

  // Your protected route logic here
  const userId = session.user.id;
  // ...
}
```

**Returns:**
- `Session` object if authenticated
- `NextResponse` with 401 status if not authenticated

### 2. `getOptionalAuth()` - For Public Routes with Optional Auth

Use this for routes that work for both authenticated and non-authenticated users.

```typescript
import { getOptionalAuth } from "@/lib/api-auth";

export async function GET() {
  const session = await getOptionalAuth();

  if (session) {
    // Personalized response for authenticated user
    return NextResponse.json({ message: `Hello, ${session.user.username}` });
  } else {
    // Generic response for anonymous user
    return NextResponse.json({ message: "Hello, guest" });
  }
}
```

**Returns:**
- `Session` object if authenticated
- `null` if not authenticated

## Current API Routes

### Protected Routes (Require Authentication)

These routes should **always** use `requireAuth()`:

| Route | Purpose | Auth Helper |
|-------|---------|-------------|
| `POST /api/thread` | Batch fetch thread status from Tumblr | ✅ `requireAuth()` |
| `GET /api/thread` | Fetch single thread status from Tumblr | ✅ `requireAuth()` |
| `GET /api/threads/active` | Fetch user's active threads from database | ✅ `requireAuth()` |

### Public Routes (No Authentication)

These routes do **NOT** require authentication:

| Route | Purpose | Auth Required |
|-------|---------|---------------|
| `POST /api/auth/[...nextauth]` | NextAuth.js authentication endpoints | ❌ Public (handled by NextAuth) |

### Future Routes - Considerations

When creating new API routes, ask yourself:

**Should this route be protected?**
- ✅ **YES** if it accesses user-specific data
- ✅ **YES** if it modifies data in the database
- ✅ **YES** if it calls external APIs with user credentials
- ❌ **NO** if it's a webhook from an external service
- ❌ **NO** if it's a health check or status endpoint
- ⚠️ **MAYBE** if it's a public read-only endpoint (consider rate limiting)

## Implementation Checklist

When creating a new API route:

- [ ] Determine if the route should be protected
- [ ] Add `requireAuth()` at the start of the handler if protected
- [ ] Add `@requires Authentication` JSDoc comment if protected
- [ ] Test the route without authentication (should return 401)
- [ ] Test the route with authentication (should work)
- [ ] Update this document with the new route

## Security Best Practices

### 1. Always Validate User Ownership

Even with authentication, verify that the user owns the resource they're accessing:

```typescript
export async function GET(request: NextRequest, { params }: { params: { threadId: string } }) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const session = authResult;

  // Fetch the thread
  const thread = await getThreadById(params.threadId);

  // Verify ownership
  if (thread.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Safe to return the thread
  return NextResponse.json(thread);
}
```

### 2. Use Consistent Error Responses

- **401 Unauthorized** - No valid authentication (handled by `requireAuth()`)
- **403 Forbidden** - Authenticated but not authorized for this resource
- **400 Bad Request** - Invalid request parameters
- **404 Not Found** - Resource doesn't exist
- **500 Internal Server Error** - Server-side error

### 3. Never Trust Client-Provided User IDs

Always use `session.user.id` from the authenticated session, never accept a user ID from the request body or query parameters:

```typescript
// ❌ BAD - User could manipulate userId
const userId = searchParams.get("userId");
const threads = await getThreadsForUser(userId);

// ✅ GOOD - Use authenticated session
const authResult = await requireAuth();
if (authResult instanceof NextResponse) return authResult;
const threads = await getThreadsForUser(authResult.user.id);
```

### 4. Rate Limiting (Future Enhancement)

Consider adding rate limiting to API routes to prevent abuse:
- Tumblr API calls (429 if too many requests)
- Database-heavy operations
- Batch operations that could be expensive

## Testing Authentication

### Manual Testing

**Test 401 Response (Not Authenticated):**
```bash
curl http://localhost:3000/api/threads/active
# Should return: {"error":"Unauthorized - Authentication required"}
```

**Test with Authentication:**
1. Log in to the app in your browser
2. Open Developer Tools → Application → Cookies
3. Copy the `authjs.session-token` cookie value
4. Use it in your curl request:

```bash
curl http://localhost:3000/api/threads/active \
  -H "Cookie: authjs.session-token=YOUR_TOKEN_HERE"
# Should return: [...threads...]
```

### Automated Testing (Future)

When implementing tests, ensure:
- [ ] Test routes return 401 without authentication
- [ ] Test routes work with valid authentication
- [ ] Test routes return 403 when accessing other users' resources
- [ ] Test edge cases (expired sessions, invalid tokens)

## Troubleshooting

### "Unauthorized" error on authenticated requests

**Possible causes:**
1. Session cookie not being sent (check CORS settings)
2. Session expired (re-login required)
3. Database connection issue (check Prisma logs)
4. NextAuth configuration issue (check `lib/auth.ts`)

**Debug steps:**
1. Add `console.log` in `requireAuth()` to see if session exists
2. Check browser DevTools → Network → Cookies to verify session token
3. Verify `NEXTAUTH_SECRET` is set in `.env.local`
4. Check database connectivity with `npx prisma studio`

### API route works without auth check

**Cause:** You forgot to add `requireAuth()` at the start of the handler.

**Fix:**
```typescript
export async function GET() {
  const authResult = await requireAuth(); // Add this
  if (authResult instanceof NextResponse) return authResult; // Add this

  // Your route logic...
}
```

## Migration Notes

### Changes Made During Auth Security Audit

**Date:** 2025-01-27

**Issue Found:**
- `/api/thread` routes (GET and POST) had no authentication checks
- Anyone could fetch thread status for any Tumblr post without logging in

**Changes Made:**
1. Created `lib/api-auth.ts` with `requireAuth()` and `getOptionalAuth()` helpers
2. Added authentication to `/api/thread` routes (GET and POST)
3. Refactored `/api/threads/active` to use new helper for consistency
4. Added `@requires Authentication` JSDoc comments to protected routes
5. Created this documentation file

**Testing:**
- ✅ All protected routes now return 401 without authentication
- ✅ All protected routes work correctly with authentication
- ✅ No TypeScript errors or warnings

## See Also

- [AUTH_SETUP.md](AUTH_SETUP.md) - General authentication setup and NextAuth.js configuration
- [lib/api-auth.ts](lib/api-auth.ts) - Authentication helper functions
- [proxy.ts](proxy.ts) - Middleware route protection (for pages, not API routes)
