import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isOnLoginPage = req.nextUrl.pathname.startsWith('/login');

  // If user is logged in and trying to access login page, redirect to home
  if (isLoggedIn && isOnLoginPage) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Protected routes - all app routes except login
  const protectedRoutes = [
    '/dashboard',
    '/threads',
    '/manage-characters',
    '/tools',
    '/settings',
    '/help',
    '/profile',
    '/quick-add'
  ];
  const isProtectedRoute = protectedRoutes.some((route) =>
    req.nextUrl.pathname.startsWith(route)
  );

  // If user is not logged in and trying to access protected route, redirect to login
  if (!isLoggedIn && isProtectedRoute) {
    const loginUrl = new URL('/login', req.url);
    const callbackUrl = req.nextUrl.search
      ? `${req.nextUrl.pathname}${req.nextUrl.search}`
      : req.nextUrl.pathname;
    loginUrl.searchParams.set('callbackUrl', callbackUrl);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
