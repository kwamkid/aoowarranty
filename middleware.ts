// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Known tenant slugs (in production, you might want to fetch this from database)
const KNOWN_TENANTS = ['abc-shop', 'xyz-store']

// System paths that should never be treated as tenant
const SYSTEM_PATHS = [
  '/_next',
  '/api',
  '/favicon.ico',
  '/robots.txt',
  '/register',
  '/super-admin',
  '/test',
  '/apple-touch-icon.png',
  '/favicon-32x32.png',
  '/favicon-16x16.png',
  '/site.webmanifest'
]

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const hostname = request.headers.get('host') || ''
  const pathname = url.pathname
  
  // Detect environment
  const isLocalhost = hostname.includes('localhost')
  const isProduction = !isLocalhost
  
  let tenant = ''
  
  if (isLocalhost) {
    // LOCALHOST: Extract tenant from path
    // e.g., localhost:3000/abc-shop/admin → tenant = abc-shop
    const pathSegments = pathname.split('/').filter(Boolean)
    const firstSegment = pathSegments[0]
    
    if (firstSegment && KNOWN_TENANTS.includes(firstSegment)) {
      tenant = firstSegment
      
      // Remove tenant from path for internal routing
      pathSegments.shift()
      url.pathname = '/' + pathSegments.join('/')
    }
  } else {
    // PRODUCTION: Extract from subdomain
    // e.g., abc-shop.warrantyhub.com → tenant = abc-shop
    const hostParts = hostname.split('.')
    
    // Check if it's a subdomain (not www and not naked domain)
    if (hostParts.length >= 3) {
      const potentialTenant = hostParts[0]
      if (potentialTenant !== 'www' && KNOWN_TENANTS.includes(potentialTenant)) {
        tenant = potentialTenant
      }
    }
  }
  
  // Debug logging (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Middleware Debug:', {
      hostname,
      pathname,
      isLocalhost,
      tenant,
      newPath: url.pathname
    })
  }
  
  // Add tenant info to headers
  const headers = new Headers(request.headers)
  headers.set('x-tenant', tenant)
  headers.set('x-tenant-host', isLocalhost ? 'localhost' : 'production')
  
  // Handle tenant-specific routing
  if (tenant) {
    // Don't process system paths
    if (SYSTEM_PATHS.some(path => url.pathname.startsWith(path))) {
      return NextResponse.rewrite(url, { request: { headers } })
    }
    
    // Map tenant routes to internal pages
    if (url.pathname === '/') {
      url.pathname = '/tenant'
    } else if (url.pathname === '/login') {
      url.pathname = '/tenant/login'
    } else if (url.pathname.startsWith('/admin')) {
      // Admin routes require auth check
      url.pathname = `/tenant/admin${url.pathname.slice(6)}`
    } else if (url.pathname === '/register') {
      url.pathname = '/tenant/register'
    } else if (url.pathname === '/my-warranties') {
      url.pathname = '/tenant/my-warranties'
    } else if (url.pathname === '/login') {
      url.pathname = '/tenant/login'
    }
  } else {
    // No tenant: Main site routes
    // Redirect /admin to homepage on main site
    if (pathname.startsWith('/admin') && !pathname.startsWith('/api')) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }
  
  return NextResponse.rewrite(url, {
    request: { headers }
  })
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - files with extensions in public folder
     */
    '/((?!_next/static|_next/image|.*\\..*$).*)',
  ],
}