import { NextResponse } from 'next/server'
import { BACKEND_URL, generateCsrfToken, setAuthCookies } from '@/lib/server-api'
import type { AuthUser } from '@/lib/api'

interface BackendTokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ detail: 'Invalid request body' }, { status: 400 })
  }

  const backendRes = await fetch(`${BACKEND_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!backendRes.ok) {
    const error: unknown = await backendRes.json().catch(() => ({}))
    return NextResponse.json(error, { status: backendRes.status })
  }

  const tokenData = (await backendRes.json()) as BackendTokenResponse

  const meRes = await fetch(`${BACKEND_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  })

  if (!meRes.ok) {
    return NextResponse.json({ detail: 'Authentication failed' }, { status: 500 })
  }
  const user = (await meRes.json()) as AuthUser
  const csrfToken = generateCsrfToken()

  const response = NextResponse.json({ user })
  setAuthCookies(
    response,
    tokenData.access_token,
    tokenData.refresh_token,
    csrfToken,
    tokenData.expires_in,
  )
  return response
}
