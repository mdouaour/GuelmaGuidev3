import { NextResponse } from 'next/server'
import { BACKEND_URL, csrfError, getAuthToken, proxyJson, validateCsrfToken } from '@/lib/server-api'

export async function POST(request: Request): Promise<NextResponse> {
  if (!(await validateCsrfToken(request))) {
    return csrfError()
  }

  const token = await getAuthToken()
  if (!token) {
    return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ detail: 'Invalid request body' }, { status: 400 })
  }

  const backendRes = await fetch(`${BACKEND_URL}/community/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })

  return proxyJson(backendRes)
}
