import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL, proxyJson } from '@/lib/server-api'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const search = request.nextUrl.search

  const backendRes = await fetch(`${BACKEND_URL}/community/leaderboard${search}`)

  return proxyJson(backendRes)
}
