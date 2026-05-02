import { NextResponse } from 'next/server'
import { BACKEND_URL, validateCsrfToken, csrfError } from '@/lib/server-api'

export async function POST(request: Request): Promise<NextResponse> {
  if (!(await validateCsrfToken(request))) {
    return csrfError()
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ detail: 'Invalid request body' }, { status: 400 })
  }

  const backendRes = await fetch(`${BACKEND_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!backendRes.ok) {
    const error: unknown = await backendRes.json().catch(() => ({}))
    return NextResponse.json(error, { status: backendRes.status })
  }

  const data = (await backendRes.json()) as { message: string }
  // Registration no longer issues a session — the user must verify their email first.
  return NextResponse.json({ message: data.message }, { status: 201 })
}
