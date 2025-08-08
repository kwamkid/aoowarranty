import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const hostname = request.headers.get('host') || ''
  
  // Debug logging for production
  const isProduction = process.env.NODE_ENV === 'production'
  
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
      const potentialSubdomain = parts[0]
      if (potentialSubdomain !== 'www' && potentialSubdomain !== 'aoowarranty') {
        subdomain = potentialSubdomain
      }
    }
  }

  if (isProduction) {
    console.log('=== Middleware Debug ===')
    console.log('Hostname:', hostname)
    console.log('Original path:', request.nextUrl.pathname)
    console.log('Detected subdomain:', subdomain)
    console.log('Is localhost:', isLocalhost)
  }

  // CRITICAL FIX: Clean up URLs that already contain tenant in production
  // This handles cases where someone navigated to /abc-shop/admin on abc-shop.aoowarranty.com
  if (subdomain && !isLocalhost && url.pathname.startsWith(`/${subdomain}`)) {
    // Remove the duplicate tenant from the path
    url.pathname = url.pathname.slice(subdomain.length + 1) || '/'
    
    if (isProduction) {
      console.log('Cleaned duplicate tenant, new path:', url.pathname)
    }
  }

  // Store subdomain in headers
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-tenant', subdomain)
  requestHeaders.set('x-tenant-host', isLocalhost ? 'localhost' : 'production')
  requestHeaders.set('x-original-hostname', hostname)
  
  // Check if path is already rewritten to avoid double rewriting
  const isAlreadyRewritten = url.pathname.startsWith('/tenant/')
  
  // Only rewrite if we have a subdomain and path isn't already rewritten
  if (subdomain && !isAlreadyRewritten) {
    // Map paths to internal tenant routes
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
    else if (!url.pathname.startsWith('/api/') && !url.pathname.startsWith('/_next/')) {
      url.pathname = `/tenant${url.pathname}`
    }
    
    if (isProduction) {
      console.log('Final rewritten path:', url.pathname)
      console.log('======================')
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