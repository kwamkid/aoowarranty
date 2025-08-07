import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const hostname = request.headers.get('host') || ''
  
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
        !['api', '_next', 'register', 'super-admin'].includes(firstSegment) &&
        !firstSegment.includes('.')) {
      subdomain = firstSegment
      
      // Remove tenant from path for internal routing
      pathSegments.splice(1, 1)
      url.pathname = pathSegments.join('/') || '/'
    }
  } else {
    // Production: extract from actual subdomain
    // Special handling for aoowarranty.com (2-part domain)
    const parts = hostname.split('.')
    
    // For aoowarranty.com structure:
    // - www.aoowarranty.com → no subdomain
    // - aoowarranty.com → no subdomain  
    // - abc-shop.aoowarranty.com → subdomain = abc-shop
    
    if (parts.length === 3 && parts[1] === 'aoowarranty' && parts[2] === 'com') {
      // Format: [subdomain].aoowarranty.com
      if (parts[0] !== 'www') {
        subdomain = parts[0]
      }
    } else if (parts.length === 2 && parts[0] === 'aoowarranty' && parts[1] === 'com') {
      // Format: aoowarranty.com (no subdomain)
      subdomain = ''
    } else if (parts.length >= 3) {
      // Other domains with 3+ parts
      const possibleSubdomain = parts[0]
      if (possibleSubdomain !== 'www') {
        subdomain = possibleSubdomain
      }
    }
  }

  // Store subdomain in headers
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-tenant', subdomain)
  requestHeaders.set('x-tenant-host', isLocalhost ? 'localhost' : 'production')
  requestHeaders.set('x-original-hostname', hostname)
  
  // Special handling for tenant routes
  if (subdomain) {
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
    
    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('=== Middleware Debug ===')
      console.log('Hostname:', hostname)
      console.log('Original path:', request.nextUrl.pathname)
      console.log('Rewritten path:', url.pathname)
      console.log('Subdomain:', subdomain)
      console.log('Is localhost:', isLocalhost)
      console.log('=======================')
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
     * - public files (public directory)
     * - api routes (they handle their own tenant logic)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|public|api).*)',
  ],
}