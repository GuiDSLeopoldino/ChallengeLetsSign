import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicPaths = ['/login', '/', '/api'];
const authPaths = ['/dashboard'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('accessToken')?.value || '';

  // Check if path is public
  const isPublicPath = publicPaths.some(path => pathname === path || pathname.startsWith(path + '/'));
  const isAuthPath = authPaths.some(path => pathname.startsWith(path));

  // Redirect authenticated users away from login
  if (pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Redirect unauthenticated users to login
  if (isAuthPath && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};