/**
 * Middleware for authentication, route protection, and performance optimization
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/league',
  '/team',
  '/draft',
  '/profile',
  '/settings',
];

// Routes that should redirect to dashboard if authenticated
const authRoutes = [
  '/auth/signin',
  '/auth/signup',
];

// Cache configuration type
type CacheConfig = {
  maxAge: number;
  sMaxAge: number;
  staleWhileRevalidate?: number;
};

// Cache configurations for different routes
const cacheConfigs: Record<string, CacheConfig> = {
  '/api/players': { maxAge: 1800, sMaxAge: 3600, staleWhileRevalidate: 300 }, // 30 min
  '/api/stats': { maxAge: 900, sMaxAge: 1800, staleWhileRevalidate: 180 }, // 15 min
  '/api/leagues': { maxAge: 600, sMaxAge: 1200, staleWhileRevalidate: 120 }, // 10 min
  '/api/teams': { maxAge: 300, sMaxAge: 600, staleWhileRevalidate: 60 }, // 5 min
  '/_next/static': { maxAge: 31536000, sMaxAge: 31536000 }, // 1 year for static assets
  '/_next/image': { maxAge: 31536000, sMaxAge: 31536000 }, // 1 year for images
};

export async function middleware(request: NextRequest) {
  const token = await getToken({ 
    req: request as any,
    secret: process.env.NEXTAUTH_SECRET,
  });
  
  const { pathname } = request.nextUrl;
  
  // Check if route requires authentication
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  // Redirect to signin if accessing protected route without auth
  if (isProtectedRoute && !token) {
    const url = new URL('/auth/signin', request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }
  
  // Redirect to dashboard if accessing auth routes while authenticated
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // Add security and performance headers
  const response = NextResponse.next();
  
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Add cache headers based on route
  const cacheConfig = getCacheConfigForRoute(pathname);
  if (cacheConfig) {
    let cacheControl = '';
    
    if (cacheConfig.maxAge) {
      cacheControl += `max-age=${cacheConfig.maxAge}`;
    }
    
    if (cacheConfig.sMaxAge) {
      cacheControl += cacheControl ? `, s-maxage=${cacheConfig.sMaxAge}` : `s-maxage=${cacheConfig.sMaxAge}`;
    }
    
    if (cacheConfig.staleWhileRevalidate) {
      cacheControl += cacheControl ? `, stale-while-revalidate=${cacheConfig.staleWhileRevalidate}` : `stale-while-revalidate=${cacheConfig.staleWhileRevalidate}`;
    }
    
    if (cacheControl) {
      response.headers.set('Cache-Control', cacheControl);
    }
  }
  
  // Add CORS headers for API routes
  if (pathname.startsWith('/api')) {
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Origin', process.env.NEXTAUTH_URL || '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    response.headers.set(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );
    
    // Add performance headers for API routes
    response.headers.set('X-Response-Time', Date.now().toString());
    response.headers.set('X-Cache-Status', 'MISS');
  }
  
  // Add compression hint
  if (pathname.startsWith('/api') || pathname.startsWith('/_next')) {
    response.headers.set('Vary', 'Accept-Encoding');
  }
  
  return response;
}

function getCacheConfigForRoute(pathname: string): CacheConfig | null {
  // Check for exact matches first
  if (cacheConfigs[pathname as keyof typeof cacheConfigs]) {
    return cacheConfigs[pathname as keyof typeof cacheConfigs];
  }
  
  // Check for pattern matches
  for (const [route, config] of Object.entries(cacheConfigs)) {
    if (pathname.startsWith(route)) {
      return config;
    }
  }
  
  return null;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};