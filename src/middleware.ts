import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server'

const CSRF_COOKIE = 'csrf_token'
const locales = ['en', 'ar', 'fr'];

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale: 'en'
});

export function middleware(request: NextRequest) {
  // Check if we need to set CSRF token
  const hasCsrf = request.cookies.has(CSRF_COOKIE);
  
  // Get intl response
  const response = intlMiddleware(request);
  
  // Ensure we have a CSRF token cookie even for visitors
  if (!hasCsrf) {
    const token = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2)
    response.cookies.set(CSRF_COOKIE, token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })
  }
  
  return response
}

export const config = {
  matcher: [
    // Apply to pages where the visitor might start their session
    // We skip api, _next, and static assets
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
