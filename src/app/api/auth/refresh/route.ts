import { NextResponse } from 'next/server'
import { BACKEND_URL, getRefreshToken, setAuthCookies, CSRF_COOKIE } from '@/lib/server-api'
import { cookies } from 'next/headers'

interface BackendTokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

export async function POST(): Promise<NextResponse> {
  const refreshToken = await getRefreshToken()

  if (!refreshToken) {
    return NextResponse.json({ detail: 'No refresh token' }, { status: 401 })
  }

  const backendRes = await fetch(`${BACKEND_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })

  if (!backendRes.ok) {
    const error: unknown = await backendRes.json().catch(() => ({}))
    return NextResponse.json(error, { status: backendRes.status })
  }

  const tokenData = (await backendRes.json()) as BackendTokenResponse
  
  // Reuse existing CSRF token if possible, or generate a new one
  const cookieStore = await cookies()
  const existingCsrf = cookieStore.get(CSRF_COOKIE)?.value || ''
  
  const response = NextResponse.json({ success: true })
  setAuthCookies(
    response,
    tokenData.access_token,
    tokenData.refresh_token,
    existingCsrf,
    tokenData.expires_in
  )
  
  return response
}
