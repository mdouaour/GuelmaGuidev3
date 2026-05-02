import { NextResponse } from 'next/server'
import { BACKEND_URL, clearAuthCookies, csrfError, validateCsrfToken, getAuthToken } from '@/lib/server-api'

export async function POST(request: Request): Promise<NextResponse> {
  if (!(await validateCsrfToken(request))) {
    return csrfError()
  }

  const token = await getAuthToken()
  if (token) {
    try {
      await fetch(`${BACKEND_URL}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
    } catch (err) {
      console.error('Failed to notify backend of logout:', err)
    }
  }

  const response = NextResponse.json({ ok: true })
  clearAuthCookies(response)
  return response
}
