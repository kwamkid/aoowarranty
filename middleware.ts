import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const hostname = request.headers.get('host') || ''
  
  // Extract subdomain
  let subdomain = ''
  let isLocalhost = hostname.includes('localhost')
  
  if (isLocalhost) {
    // For localhost, get tenant from path
    // localhost:3000/abc-shop/* → tenant = abc-shop
    const pathSegments = url.pathname.split('/')
    const firstSegment = pathSegments[1]
    
    // Check if it's a tenant path
    if (firstSegment && 
        !['api', '_next', 'register', 'super-admin', 'test', 'test-firebase'].includes(firstSegment) &&
        !firstSegment.includes('.')) {
      subdomain = firstSegment
      
      // Remove tenant from path for internal routing
      pathSegments.splice(1, 1)
      url.pathname = pathSegments.join('/') || '/'
    }
  } else {
    // Production: extract from actual subdomain
    const parts = hostname.split('.')
    if (parts.length >= 3 && parts[0] !== 'www') {
      subdomain = parts[0]
    }
  }

  // Store subdomain in headers
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-tenant', subdomain)
  requestHeaders.set('x-tenant-host', isLocalhost ? 'localhost' : 'production')
  
  // Handle API routes first - always pass headers without rewriting
  if (url.pathname.startsWith('/api/')) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      }
    })
  }
  
  // Special handling for tenant routes
  if (subdomain) {
    // Rewrite to tenant-specific paths
    if (url.pathname === '/') {
      url.pathname = '/tenant'
    } else if (url.pathname.startsWith('/admin')) {
      url.pathname = `/tenant/admin${url.pathname.slice(6)}`
    } else if (url.pathname === '/register') {
      url.pathname = '/tenant/register'
    } else if (url.pathname.startsWith('/my-warranties')) {
      url.pathname = '/tenant/my-warranties'
    } else if (url.pathname.startsWith('/warranty/')) {
      url.pathname = `/tenant${url.pathname}`
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
     * - files with extensions (e.g. .js, .css, .png)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}