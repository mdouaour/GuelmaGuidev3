import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL, proxyJson } from '@/lib/server-api'

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ detail: 'Invalid request body' }, { status: 400 })
  }

  const backendRes = await fetch(`${BACKEND_URL}/auth/resend-verification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return proxyJson(backendRes)
}
