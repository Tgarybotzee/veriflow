import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_COOKIE } from '@/lib/auth'

export function middleware(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE)?.value
  const path = request.nextUrl.pathname
  if (path === '/admin/login') { if (token) return NextResponse.redirect(new URL('/admin', request.url), 307); return NextResponse.next() }
  if (path.startsWith('/admin') && !token) return NextResponse.redirect(new URL('/admin/login', request.url), 307)
  return NextResponse.next()
}

export const config = { matcher: ['/admin/:path*'] }
