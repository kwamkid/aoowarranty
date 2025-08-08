// lib/url-helper.ts
/**
 * Centralized URL management for multi-tenant application
 * Handles both development (path-based) and production (subdomain-based) URLs
 */

interface UrlConfig {
  tenant?: string
  isProduction?: boolean
  hostname?: string
}

class UrlHelper {
  private static instance: UrlHelper
  
  private constructor() {}
  
  static getInstance(): UrlHelper {
    if (!UrlHelper.instance) {
      UrlHelper.instance = new UrlHelper()
    }
    return UrlHelper.instance
  }
  
  /**
   * Detect if we're in production environment
   */
  isProduction(): boolean {
    if (typeof window === 'undefined') {
      // Server-side
      return process.env.NODE_ENV === 'production'
    } else {
      // Client-side
      const hostname = window.location.hostname
      return !hostname.includes('localhost') && !hostname.includes('127.0.0.1')
    }
  }
  
  /**
   * Extract tenant from current context
   */
  extractTenant(pathname?: string, hostname?: string): string {
    // Client-side
    if (typeof window !== 'undefined') {
      const currentHostname = window.location.hostname
      const currentPathname = window.location.pathname
      
      if (this.isProduction()) {
        // Production: Extract from subdomain
        const parts = currentHostname.split('.')
        if (parts.length >= 3 && parts[0] !== 'www') {
          return parts[0]
        }
      } else {
        // Development: Extract from path
        const segments = currentPathname.split('/')
        if (segments[1] && !this.isReservedPath(segments[1])) {
          return segments[1]
        }
      }
    }
    
    // Server-side or fallback
    if (pathname && !this.isProduction()) {
      const segments = pathname.split('/')
      if (segments[1] && !this.isReservedPath(segments[1])) {
        return segments[1]
      }
    }
    
    if (hostname && this.isProduction()) {
      const parts = hostname.split('.')
      if (parts.length >= 3 && parts[0] !== 'www') {
        return parts[0]
      }
    }
    
    return ''
  }
  
  /**
   * Check if a path segment is reserved (not a tenant)
   */
  private isReservedPath(segment: string): boolean {
    const reserved = ['api', '_next', 'register', 'super-admin', 'admin', 'favicon.ico']
    return reserved.includes(segment) || segment.includes('.')
  }
  
  /**
   * Build admin URL
   */
  adminUrl(path: string = '', config?: UrlConfig): string {
    const isProduction = config?.isProduction ?? this.isProduction()
    const tenant = config?.tenant || this.extractTenant()
    
    if (isProduction) {
      // Production: Direct path (we're already on subdomain)
      return `/admin${path}`
    } else {
      // Development: Need tenant prefix
      if (!tenant) {
        console.warn('[UrlHelper] No tenant found for admin URL')
        return `/admin${path}`
      }
      return `/${tenant}/admin${path}`
    }
  }
  
  /**
   * Build customer-facing URL
   */
  customerUrl(path: string = '', config?: UrlConfig): string {
    const isProduction = config?.isProduction ?? this.isProduction()
    const tenant = config?.tenant || this.extractTenant()
    
    if (isProduction) {
      // Production: Direct path (we're already on subdomain)
      return path || '/'
    } else {
      // Development: Need tenant prefix
      if (!tenant) {
        console.warn('[UrlHelper] No tenant found for customer URL')
        return path || '/'
      }
      return `/${tenant}${path}`
    }
  }
  
  /**
   * Build login URL
   */
  loginUrl(config?: UrlConfig): string {
    return this.adminUrl('/login', config)
  }
  
  /**
   * Build logout redirect URL
   */
  logoutUrl(config?: UrlConfig): string {
    return this.loginUrl(config)
  }
  
  /**
   * Build absolute URL with domain
   */
  absoluteUrl(path: string = '', config?: UrlConfig): string {
    const isProduction = config?.isProduction ?? this.isProduction()
    const tenant = config?.tenant || this.extractTenant()
    const domain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'aoowarranty.com'
    
    if (!tenant) {
      console.warn('[UrlHelper] No tenant found for absolute URL')
      return ''
    }
    
    if (isProduction) {
      // Production: Use subdomain
      return `https://${tenant}.${domain}${path}`
    } else {
      // Development: Use localhost with path
      return `http://localhost:3000/${tenant}${path}`
    }
  }
  
  /**
   * Build API URL (no tenant prefix needed)
   */
  apiUrl(path: string): string {
    return `/api${path}`
  }
  
  /**
   * Clean duplicate tenant from URL if exists
   * e.g., /abc-shop/abc-shop/admin -> /abc-shop/admin
   */
  cleanDuplicateTenant(url: string, tenant?: string): string {
    const tenantToUse = tenant || this.extractTenant()
    if (!tenantToUse) return url
    
    // Pattern: /tenant/tenant/... -> /tenant/...
    const pattern = new RegExp(`^/${tenantToUse}/${tenantToUse}/`)
    return url.replace(pattern, `/${tenantToUse}/`)
  }
  
  /**
   * Get redirect URL after login
   */
  getLoginRedirectUrl(config?: UrlConfig): string {
    const isProduction = config?.isProduction ?? this.isProduction()
    const tenant = config?.tenant || this.extractTenant()
    const domain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'aoowarranty.com'
    
    if (!tenant) {
      console.warn('[UrlHelper] No tenant found for login redirect')
      return '/admin'
    }
    
    if (isProduction) {
      // Production: Full URL with subdomain
      return `https://${tenant}.${domain}/admin`
    } else {
      // Development: Localhost with path
      return `http://localhost:3000/${tenant}/admin`
    }
  }
  
  /**
   * Debug helper
   */
  debug(): void {
    console.log('=== UrlHelper Debug ===')
    console.log('Environment:', this.isProduction() ? 'Production' : 'Development')
    if (typeof window !== 'undefined') {
      console.log('Hostname:', window.location.hostname)
      console.log('Pathname:', window.location.pathname)
      console.log('Extracted Tenant:', this.extractTenant())
    }
    console.log('=====================')
  }
}

// Export singleton instance
export const urlHelper = UrlHelper.getInstance()

// Export convenience functions
export const adminUrl = (path: string = '', config?: UrlConfig) => urlHelper.adminUrl(path, config)
export const customerUrl = (path: string = '', config?: UrlConfig) => urlHelper.customerUrl(path, config)
export const loginUrl = (config?: UrlConfig) => urlHelper.loginUrl(config)
export const logoutUrl = (config?: UrlConfig) => urlHelper.logoutUrl(config)
export const absoluteUrl = (path: string = '', config?: UrlConfig) => urlHelper.absoluteUrl(path, config)
export const apiUrl = (path: string) => urlHelper.apiUrl(path)
export const getLoginRedirectUrl = (config?: UrlConfig) => urlHelper.getLoginRedirectUrl(config)
export const debugUrl = () => urlHelper.debug()