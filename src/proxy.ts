import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server'

const CSRF_COOKIE = 'csrf_token'
const locales = ['en', 'ar', 'fr'];

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale: 'ar',
  localeDetection: true,
});

export function proxy(request: NextRequest) {
  // Check if we need to set CSRF token
  const hasCsrf = request.cookies.has(CSRF_COOKIE);
  
  // Get intl response
  const response = intlMiddleware(request);
  
  // Ensure we have a CSRF token cookie even for visitors
  if (!hasCsrf) {
    // Use Web Crypto API (available in Edge runtime) for cryptographically secure token
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    const token = Array.from(array).map((b) => b.toString(16).padStart(2, '0')).join('')
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
    // We skip api, _next, offline, and static assets
    '/((?!api|_next/static|_next/image|favicon.ico|offline).*)',
  ],
}
