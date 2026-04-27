import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const getSecretKey = () => new TextEncoder().encode(process.env.JWT_SECRET);

async function getTokenPayload(request: NextRequest) {
  const token =
    request.cookies.get('flanvo_token')?.value ||
    request.headers.get('Authorization')?.replace('Bearer ', '');

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const userRoutes = ['/dashboard', '/flight-search', '/matching', '/checkout', '/tracking'];
  const driverRoutes = ['/driver/dashboard', '/driver/ride'];
  const adminRoutes = ['/admin'];
  const adminExcluded = ['/admin/login'];

  const isUserRoute = userRoutes.some((p) => pathname.startsWith(p));
  const isDriverRoute = driverRoutes.some((p) => pathname.startsWith(p));
  const isAdminRoute = adminRoutes.some((p) => pathname.startsWith(p)) &&
    !adminExcluded.some((p) => pathname.startsWith(p));

  if (!isUserRoute && !isDriverRoute && !isAdminRoute) {
    return NextResponse.next();
  }

  const payload = await getTokenPayload(request);

  if (!payload) {
    if (isDriverRoute) return NextResponse.redirect(new URL('/driver/login', request.url));
    if (isAdminRoute) return NextResponse.redirect(new URL('/admin/login', request.url));
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const role = payload.role as string;

  if (isDriverRoute && role !== 'driver') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAdminRoute && role !== 'admin') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isUserRoute && !['user', 'driver', 'admin'].includes(role)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/flight-search',
    '/matching',
    '/checkout/:path*',
    '/tracking/:path*',
    '/driver/dashboard/:path*',
    '/driver/ride/:path*',
    '/admin/:path*',
  ],
};
