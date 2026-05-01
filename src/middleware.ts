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
  const isAdminRoute =
    adminRoutes.some((p) => pathname.startsWith(p)) &&
    !adminExcluded.some((p) => pathname.startsWith(p));

  if (!isUserRoute && !isDriverRoute && !isAdminRoute) {
    return NextResponse.next();
  }

  const payload = await getTokenPayload(request);
  const role = payload?.role as string | undefined;

  // Nessun token → redirect al login appropriato
  if (!payload) {
    if (isDriverRoute) return NextResponse.redirect(new URL('/driver/login', request.url));
    if (isAdminRoute) return NextResponse.redirect(new URL('/admin/login', request.url));
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Route driver: solo driver
  if (isDriverRoute && role !== 'driver') {
    if (role === 'admin') return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    return NextResponse.redirect(new URL('/driver/login', request.url));
  }

  // Route admin: solo admin
  if (isAdminRoute && role !== 'admin') {
    if (role === 'driver') return NextResponse.redirect(new URL('/driver/dashboard', request.url));
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  // Route utente: solo passeggeri — driver e admin hanno la loro area
  if (isUserRoute && role !== 'user') {
    if (role === 'driver') return NextResponse.redirect(new URL('/driver/dashboard', request.url));
    if (role === 'admin') return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/account/:path*',
    '/flight-search',
    '/matching',
    '/checkout/:path*',
    '/tracking/:path*',
    '/driver/dashboard/:path*',
    '/driver/ride/:path*',
    '/driver/earnings/:path*',
    '/admin/:path*',
  ],
};
