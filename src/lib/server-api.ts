import { randomBytes, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

function normalizeBackendUrl(value: string): string {
  const withoutTrailingSlashes = value.replace(/\/+$/, '')
  return withoutTrailingSlashes.endsWith('/api/v1')
    ? withoutTrailingSlashes
    : `${withoutTrailingSlashes}/api/v1`
}

export const BACKEND_URL = normalizeBackendUrl(
  process.env.INTERNAL_API_URL ?? 
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    'http://localhost:8000',
)

export const AUTH_COOKIE = 'auth_token'
export const REFRESH_COOKIE = 'refresh_token'
export const CSRF_COOKIE = 'csrf_token'
// Allow explicit opt-in/out via COOKIE_SECURE env var; fall back to NODE_ENV === 'production'.
export const IS_SECURE =
  process.env.COOKIE_SECURE !== undefined
    ? process.env.COOKIE_SECURE !== 'false'
    : process.env.NODE_ENV === 'production'

/** Generate a cryptographically random 32-byte hex string for use as a CSRF token. */
export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex')
}

export async function validateCsrfToken(request: Request): Promise<boolean> {
  const headerToken = request.headers.get('X-CSRF-Token')
  if (!headerToken) return false
  const cookieStore = await cookies()
  const cookieToken = cookieStore.get(CSRF_COOKIE)?.value
  if (!cookieToken) return false
  // Use constant-time comparison to prevent timing attacks.
  if (headerToken.length !== cookieToken.length) return false
  return timingSafeEqual(Buffer.from(headerToken), Buffer.from(cookieToken))
}

export function csrfError(): NextResponse {
  return NextResponse.json({ detail: 'Invalid CSRF token' }, { status: 403 })
}

export async function getAuthToken(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(AUTH_COOKIE)?.value
}

export async function getRefreshToken(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(REFRESH_COOKIE)?.value
}

export function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string,
  csrfToken: string,
  accessTokenMaxAge: number,
): void {
  // Access Token - HttpOnly
  response.cookies.set(AUTH_COOKIE, accessToken, {
    httpOnly: true,
    secure: IS_SECURE,
    sameSite: 'strict',
    maxAge: accessTokenMaxAge,
    path: '/',
  })
  
  // Refresh Token - HttpOnly
  response.cookies.set(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: IS_SECURE,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7 days matching backend settings
    path: '/',
  })

  // CSRF Token - Accessible by JS
  response.cookies.set(CSRF_COOKIE, csrfToken, {
    httpOnly: false,
    secure: IS_SECURE,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
}

export async function proxyJson(backendRes: Response): Promise<NextResponse> {
  if (backendRes.status === 204) {
    return new NextResponse(null, { status: 204 })
  }

  let data: unknown
  try {
    data = await backendRes.json()
  } catch {
    return NextResponse.json(
      { detail: 'Invalid response from server' },
      { status: 502 },
    )
  }

  return NextResponse.json(data, { status: backendRes.status })
}

export function clearAuthCookies(response: NextResponse): void {
  const clearOptions = {
    httpOnly: true,
    secure: IS_SECURE,
    sameSite: 'strict' as const,
    maxAge: 0,
    path: '/',
  }
  
  response.cookies.set(AUTH_COOKIE, '', clearOptions)
  response.cookies.set(REFRESH_COOKIE, '', clearOptions)
  response.cookies.set(CSRF_COOKIE, '', { ...clearOptions, httpOnly: false })
}

/**
 * Server-side version of apiRequest specifically for use in Server Components.
 * It uses the internal BACKEND_URL.
 */
async function serverApiRequest<T>(path: string, locale?: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')
  if (locale) {
    headers.set('Accept-Language', locale)
  }
  
  const url = `${BACKEND_URL}${path}`
  
  try {
    const response = await fetch(url, { 
      ...init, 
      headers,
      // If we are building, we might want to skip some checks or handle failures gracefully
      next: { revalidate: (!init.method || init.method.toUpperCase() === 'GET') ? 3600 : 0 }
    })

    if (!response.ok) {
      const message = `Server Request to ${url} failed with status ${response.status}`
      
      // During build or local dev, if we reach something that returns 401 on localhost, 
      // it's likely a platform proxy or an uninitialized backend.
      // We gracefully return empty data structures for known listing endpoints to prevent build crashes/noisy logs.
      if (response.status === 401 && (process.env.NODE_ENV === 'production' || url.includes('localhost'))) {
        if (init.method === 'GET' || !init.method) {
          console.warn(`[Build/Dev Fallback] Backend at ${url} returned 401. Returning empty data structure.`)
          if (path.includes('/places') || path.includes('/activities')) {
            return { results: [], total: 0, page: 1, limit: 12 } as T
          }
          return {} as T
        }
      }

      console.warn(message)
      throw new Error(message)
    }

    if (response.status === 204) return undefined as T
    return (await response.json()) as T
  } catch (error) {
    // During build, connection errors to internal backend are typical if the container isn't up.
    if (process.env.NODE_ENV === 'production' || url.includes('localhost')) {
      console.warn(`[Build/Dev Fallback] Fetch to ${url} failed: ${error instanceof Error ? error.message : 'Unknown'}. Using empty fallback.`)
      if (path.includes('/places') || path.includes('/activities')) {
        return { results: [], total: 0, page: 1, limit: 12 } as T
      }
      return {} as T
    }
    console.error(`Fetch error for ${url}:`, error)
    throw error
  }
}

export function serverGetPlaces(params: URLSearchParams, locale?: string) {
  return serverApiRequest<import('./api').PaginatedResponse<import('./api').Place>>(`/places?${params.toString()}`, locale)
}

export function serverGetPlace(placeId: number, locale?: string) {
  return serverApiRequest<import('./api').Place>(`/places/${placeId}`, locale)
}

export function serverGetActivities(params: URLSearchParams, locale?: string) {
  return serverApiRequest<import('./api').PaginatedResponse<import('./api').Activity>>(`/activities?${params.toString()}`, locale)
}
