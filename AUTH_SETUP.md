# NextAuth.js Setup Documentation

This document describes the authentication setup for RPThreadTracker v4, which supports migrating from an existing ASP.NET application with legacy password hashes.

## Overview

The authentication system supports three types of password hashes:
1. **Legacy ASP.NET MVC** - `System.Web.Helpers.Crypto` (PBKDF2 with HMACSHA1, 1000 iterations)
2. **ASP.NET Core Identity** - .NET Core Identity V2/V3 format (PBKDF2 with various PRFs)
3. **bcrypt** - Modern hash format that passwords are migrated to upon successful login

## Setup Instructions

### 1. Environment Variables

Update the `.env.local` file with your configuration:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-change-this-in-production

# SQL Server Connection
DATABASE_URL="your-connection-string-here"
```

To generate a secure `NEXTAUTH_SECRET`, run:
```bash
openssl rand -base64 32
```

### 2. Database Connection

The application connects to your existing SQL Server database with the `dbo.AspNetUsers` table. Update the `DATABASE_URL` in `.env.local`:

**For local development:**
```
Data Source=(localdb)\\MSSQLLocalDB;Initial Catalog=RPThreadTracker;Integrated Security=True;Connect Timeout=15;Encrypt=False;TrustServerCertificate=True;ApplicationIntent=ReadWrite;MultiSubnetFailover=False
```

**For production:**
```
Server={serverWithPort};Initial Catalog=RPThreadTracker-Production;Persist Security Info=False;User ID={username};Password={password};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;
```

### 3. Running the Application

Start the development server:
```bash
npm run dev
```

Visit `http://localhost:3000` to see the home page.

## How It Works

### Password Verification Flow

1. User submits credentials via the login form (`/login`)
2. System queries the database for user by email or username
3. Password verification attempts in order:
   - If hash starts with `$2a$`, `$2b$`, or `$2y$` → bcrypt verification
   - Otherwise → ASP.NET MVC Crypto verification (legacy)
   - If that fails → .NET Core Identity verification (current)
4. On successful verification with legacy or identity hash:
   - Password is re-hashed using bcrypt
   - Database is updated with new bcrypt hash
   - This happens transparently during login

### Password Migration Strategy

The system automatically migrates passwords from legacy formats to bcrypt:
- Migration happens on successful login
- Users don't need to reset passwords
- After migration, passwords use modern bcrypt hashing
- Failed migrations are logged but don't prevent authentication

### Protected Routes

Routes are protected using Next.js middleware. Configure protected routes in `middleware.ts`:

```typescript
const protectedRoutes = ['/dashboard', '/profile'];
```

Users attempting to access protected routes without authentication are redirected to `/login`.

## File Structure

```
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts          # NextAuth API route handler
│   ├── login/
│   │   └── page.tsx                  # Login page
│   └── page.tsx                      # Home page with auth status
├── lib/
│   ├── auth.ts                       # NextAuth configuration
│   ├── db.ts                         # SQL Server connection & queries
│   └── password-verifiers.ts        # Password verification logic
├── types/
│   └── next-auth.d.ts               # TypeScript type extensions
├── middleware.ts                     # Route protection middleware
└── .env.local                       # Environment variables
```

## Security Considerations

1. **HTTPS Required**: Always use HTTPS in production
2. **Secret Management**: Keep `NEXTAUTH_SECRET` secure and unique per environment
3. **Connection Strings**: Store production credentials in secure environment variables
4. **Lockout Support**: The system respects `LockoutEnabled` and `LockoutEnd` from the database
5. **Timing-Safe Comparisons**: Password verification uses constant-time comparison to prevent timing attacks

## Testing

To test the authentication:

1. Ensure your SQL Server database is running and accessible
2. Verify a test user exists in `dbo.AspNetUsers`
3. Navigate to `/login`
4. Enter email/username and password
5. Upon successful login, you'll be redirected to the home page
6. Check the database - the user's `PasswordHash` should now be in bcrypt format

## Troubleshooting

### Connection Issues
- Verify SQL Server is running
- Check connection string format
- Ensure firewall allows connection
- For LocalDB, verify the instance is started

### Authentication Failures
- Check user exists in database
- Verify password is correct
- Check for account lockout (`LockoutEnd`)
- Review server logs for specific errors

### Migration Issues
- Password migration failures are logged but don't block authentication
- Check console for migration error messages
- Verify database user has UPDATE permissions on `AspNetUsers` table

## Next Steps

1. Customize the login page UI
2. Add registration functionality
3. Implement password reset flow
4. Add email verification
5. Configure additional NextAuth providers (OAuth, etc.)
6. Add role-based authorization
