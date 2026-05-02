import { NextResponse } from 'next/server'
import { BACKEND_URL, csrfError, getAuthToken, proxyJson, validateCsrfToken } from '@/lib/server-api'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  if (!(await validateCsrfToken(request))) {
    return csrfError()
  }

  const token = await getAuthToken()
  if (!token) {
    return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 })
  }

  const { id } = await params
  const backendRes = await fetch(`${BACKEND_URL}/activities/${id}/leave`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })

  return proxyJson(backendRes)
}
