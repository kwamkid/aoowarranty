import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const hostname = request.headers.get('host') || ''
  
  // Debug logging for production
  const isProduction = process.env.NODE_ENV === 'production'
  if (isProduction) {
    console.log('=== Middleware Production ===')
    console.log('Hostname:', hostname)
    console.log('Original path:', request.nextUrl.pathname)
  }
  
  // Extract subdomain
  let subdomain = ''
  let isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1')
  
  if (isLocalhost) {
    // For localhost, get tenant from path
    // localhost:3000/abc-shop/* → tenant = abc-shop
    const pathSegments = url.pathname.split('/')
    const firstSegment = pathSegments[1]
    
    // Check if it's a tenant path
    if (firstSegment && 
        !['api', '_next', 'register', 'super-admin', 'favicon.ico'].includes(firstSegment) &&
        !firstSegment.includes('.')) {
      subdomain = firstSegment
      
      // Remove tenant from path for internal routing
      pathSegments.splice(1, 1)
      url.pathname = pathSegments.join('/') || '/'
    }
  } else {
    // Production: extract from actual subdomain
    // abc-shop.aoowarranty.com → subdomain = abc-shop
    const parts = hostname.split('.')
    
    // Check for subdomain pattern
    if (parts.length >= 3) {
      // Pattern: abc-shop.aoowarranty.com
      const potentialSubdomain = parts[0]
      if (potentialSubdomain !== 'www' && potentialSubdomain !== 'aoowarranty') {
        subdomain = potentialSubdomain
      }
    }
  }

  // Store subdomain in headers
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-tenant', subdomain)
  requestHeaders.set('x-tenant-host', isLocalhost ? 'localhost' : 'production')
  requestHeaders.set('x-original-hostname', hostname)
  
  // IMPORTANT: Don't rewrite if already processed
  // This prevents double rewriting like /tenant/admin -> /tenant/tenant/admin
  const isAlreadyRewritten = url.pathname.startsWith('/tenant/')
  
  if (isProduction) {
    console.log('Subdomain detected:', subdomain)
    console.log('Is already rewritten:', isAlreadyRewritten)
    console.log('Current pathname:', url.pathname)
  }
  
  // Special handling for tenant routes
  if (subdomain && !isAlreadyRewritten) {
    // Rewrite to tenant-specific paths
    if (url.pathname === '/') {
      url.pathname = '/tenant'
    } else if (url.pathname.startsWith('/admin')) {
      url.pathname = `/tenant/admin${url.pathname.slice(6)}`
    } else if (url.pathname.startsWith('/register')) {
      url.pathname = `/tenant/register`
    } else if (url.pathname.startsWith('/my-warranties')) {
      url.pathname = `/tenant/my-warranties`
    }
    // For any other paths under tenant (but not API routes)
    else if (!url.pathname.startsWith('/api/')) {
      url.pathname = `/tenant${url.pathname}`
    }
    
    if (isProduction) {
      console.log('Rewritten to:', url.pathname)
      console.log('=========================')
    }
  }
  
  return NextResponse.rewrite(url, {
    request: {
      headers: requestHeaders,
    }
  })
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - files with extensions (e.g., .css, .js, .png)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}