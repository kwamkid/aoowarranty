// lib/url-builder.ts
/**
 * Helper functions for building URLs in multi-tenant environment
 * Handles both development (localhost with path prefix) and production (subdomain) scenarios
 */

/**
 * Check if we're in production environment
 * In production, we use subdomains (e.g., abc-shop.aoowarranty.com)
 * In development, we use path prefixes (e.g., localhost:3000/abc-shop)
 */
export function isProductionEnvironment(): boolean {
  // Server-side check
  if (typeof window === 'undefined') {
    return process.env.NODE_ENV === 'production'
  }
  
  // Client-side check
  const hostname = window.location.hostname
  return !hostname.includes('localhost') && !hostname.includes('127.0.0.1')
}

/**
 * Build admin URL based on environment
 * @param path - The admin path (e.g., '/brands', '/products')
 * @param tenant - The tenant slug (only needed in development)
 * @returns The full admin URL
 */
export function buildAdminUrl(path: string, tenant?: string): string {
  const isProduction = isProductionEnvironment()
  
  if (isProduction) {
    // Production: We're already on subdomain, use direct path
    return `/admin${path}`
  } else {
    // Development: Need tenant prefix
    if (!tenant) {
      console.warn('Tenant not provided for development URL building')
      return `/admin${path}`
    }
    return `/${tenant}/admin${path}`
  }
}

/**
 * Build tenant URL (customer-facing)
 * @param path - The path (e.g., '/', '/register')
 * @param tenant - The tenant slug (only needed in development)
 * @returns The full tenant URL
 */
export function buildTenantUrl(path: string, tenant?: string): string {
  const isProduction = isProductionEnvironment()
  
  if (isProduction) {
    // Production: We're already on subdomain
    return path
  } else {
    // Development: Need tenant prefix
    if (!tenant) {
      console.warn('Tenant not provided for development URL building')
      return path
    }
    return `/${tenant}${path}`
  }
}

/**
 * Build login URL based on environment
 * @param tenant - The tenant slug
 * @returns The login URL
 */
export function buildLoginUrl(tenant?: string): string {
  const isProduction = isProductionEnvironment()
  
  if (isProduction) {
    return '/admin/login'
  } else {
    if (!tenant) {
      console.warn('Tenant not provided for login URL')
      return '/admin/login'
    }
    return `/${tenant}/admin/login`
  }
}

/**
 * Build logout redirect URL based on environment
 * @param tenant - The tenant slug
 * @returns The logout redirect URL
 */
export function buildLogoutRedirectUrl(tenant?: string): string {
  return buildLoginUrl(tenant)
}

/**
 * Extract tenant from pathname (for development)
 * @param pathname - The current pathname
 * @returns The tenant slug or empty string
 */
export function extractTenantFromPath(pathname: string): string {
  const pathSegments = pathname.split('/')
  const firstSegment = pathSegments[1]
  
  // Check if first segment is a tenant (not a reserved path)
  if (firstSegment && 
      !['api', '_next', 'register', 'super-admin', 'admin'].includes(firstSegment) &&
      !firstSegment.includes('.')) {
    return firstSegment
  }
  
  return ''
}

/**
 * Build absolute URL with proper domain/subdomain
 * @param tenant - The tenant slug
 * @param path - The path
 * @returns The absolute URL
 */
export function buildAbsoluteUrl(tenant: string, path: string = ''): string {
  const isProduction = isProductionEnvironment()
  const domain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'aoowarranty.com'
  
  if (isProduction) {
    // Production: Use subdomain
    return `https://${tenant}.${domain}${path}`
  } else {
    // Development: Use localhost with path
    return `http://localhost:3000/${tenant}${path}`
  }
}

/**
 * Get base URL for customer registration
 * @param tenant - The tenant slug
 * @returns The base URL for customer-facing site
 */
export function getCustomerBaseUrl(tenant: string): string {
  return buildAbsoluteUrl(tenant)
}

/**
 * Check if current path is admin area
 * @param pathname - The current pathname
 * @returns True if in admin area
 */
export function isAdminPath(pathname: string): boolean {
  return pathname.includes('/admin')
}

/**
 * Clean duplicate tenant from path (for fixing middleware issues)
 * @param pathname - The current pathname
 * @param tenant - The tenant slug
 * @returns The cleaned pathname
 */
export function cleanDuplicateTenant(pathname: string, tenant: string): string {
  // Pattern: /tenant/tenant/admin -> /tenant/admin
  const duplicatePattern = new RegExp(`^/${tenant}/${tenant}/`)
  if (duplicatePattern.test(pathname)) {
    return pathname.replace(duplicatePattern, `/${tenant}/`)
  }
  return pathname
}