import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL, proxyJson } from '@/lib/server-api'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = request.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.json({ detail: 'Verification token is missing' }, { status: 400 })
  }

  const backendRes = await fetch(
    `${BACKEND_URL}/auth/verify-email?token=${encodeURIComponent(token)}`,
    { headers: { 'Content-Type': 'application/json' } },
  )

  return proxyJson(backendRes)
}
