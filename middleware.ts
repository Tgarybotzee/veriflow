import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: ['/admin/:path*'],
};

/**
 * Middleware protects /admin/* routes. Unauthenticated users are redirected to /admin/login.
 * Authenticated users who visit /admin/login are redirected to /admin.
 */
export default async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const pathname = url.pathname;

  // Allow public access to the login page itself
  if (pathname === '/admin/login') {
    // if authenticated, redirect to /admin
    try {
      const resp = await fetch(new URL('/admin/api/overview', req.url).toString(), {
        method: 'GET',
        headers: { cookie: req.headers.get('cookie') || '' },
        cache: 'no-store',
      });
      if (resp.ok) {
        // already authenticated
        return NextResponse.redirect(new URL('/admin', req.url), 307);
      }
    } catch (err) {
      // fall through to allow showing login
    }

    return NextResponse.next();
  }

  // For any other /admin/* route, require authentication
  try {
    const resp = await fetch(new URL('/admin/api/overview', req.url).toString(), {
      method: 'GET',
      headers: { cookie: req.headers.get('cookie') || '' },
      cache: 'no-store',
    });
    if (resp.ok) {
      // allow through
      return NextResponse.next();
    }
  } catch (err) {
    // treat as not authenticated
  }

  // Not authenticated -> redirect to login
  const loginUrl = new URL('/admin/login', req.url);
  return NextResponse.redirect(loginUrl, 307);
}
