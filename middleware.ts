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
    
    // Simple check: if we have 3 parts and middle is 'aoowarranty'
    if (parts.length === 3 && parts[1] === 'aoowarranty' && parts[2] === 'com') {
      if (parts[0] !== 'www') {
        subdomain = parts[0]
      }
    }
    // Also handle if accessed without www
    else if (parts.length === 2 && parts[0] !== 'aoowarranty' && parts[1] === 'com') {
      // This might be a case like abc-shop.com (if using custom domain)
      subdomain = parts[0]
    }
  }

  // Store subdomain in headers
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-tenant', subdomain)
  requestHeaders.set('x-tenant-host', isLocalhost ? 'localhost' : 'production')
  requestHeaders.set('x-original-hostname', hostname)
  
  // Special handling for tenant routes
  if (subdomain) {
    // IMPORTANT: Check if path is already rewritten to avoid double rewriting
    if (url.pathname.startsWith('/tenant/')) {
      if (isProduction) {
        console.log('Path already starts with /tenant/, skipping rewrite')
      }
      return NextResponse.rewrite(url, {
        request: {
          headers: requestHeaders,
        }
      })
    }
    
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
    // Don't rewrite API routes - they handle tenant context themselves
    else if (!url.pathname.startsWith('/api/')) {
      // For any other paths under tenant, prefix with /tenant
      url.pathname = `/tenant${url.pathname}`
    }
    
    if (isProduction) {
      console.log('Detected subdomain:', subdomain)
      console.log('Rewritten path:', url.pathname)
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