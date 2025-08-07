// lib/line-auth.ts
import { generateId } from './utils'

// LINE Login Configuration
export const LINE_LOGIN_CONFIG = {
  channelId: process.env.NEXT_PUBLIC_LINE_CHANNEL_ID || '',
  channelSecret: process.env.LINE_CHANNEL_SECRET || '',
}

// Get production callback URL
export function getCallbackUrl(): string {
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  if (isDevelopment) {
    return 'http://localhost:3000/api/auth/line/callback'
  }
  
  // Use domain from environment variable
  const domain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'aoowarranty.com'
  return `https://${domain}/api/auth/line/callback`
}

// Generate LINE Login URL
export function getLineLoginUrl(state: string, tenant: string) {
  const redirectUri = getCallbackUrl()
  
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: LINE_LOGIN_CONFIG.channelId,
    redirect_uri: redirectUri,
    state: `${tenant}:${state}`, // Include tenant in state
    scope: 'profile openid email',
  })
  
  return `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`
}

// Verify LINE token
export async function verifyLineToken(accessToken: string) {
  try {
    const response = await fetch('https://api.line.me/oauth2/v2.1/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        access_token: accessToken,
        client_id: LINE_LOGIN_CONFIG.channelId,
      }),
    })
    
    if (!response.ok) {
      throw new Error('Invalid token')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error verifying LINE token:', error)
    throw error
  }
}

// Get LINE user profile
export async function getLineProfile(accessToken: string) {
  try {
    const response = await fetch('https://api.line.me/v2/profile', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    
    if (!response.ok) {
      throw new Error('Failed to get profile')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error getting LINE profile:', error)
    throw error
  }
}

// Exchange code for token
export async function exchangeCodeForToken(code: string, redirectUri?: string) {
  try {
    // Use the same callback URL that was used for authorization
    const callbackUrl = redirectUri || getCallbackUrl()
    
    const response = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: callbackUrl,
        client_id: LINE_LOGIN_CONFIG.channelId,
        client_secret: LINE_LOGIN_CONFIG.channelSecret,
      }),
    })
    
    if (!response.ok) {
      const error = await response.json()
      console.error('Token exchange error:', error)
      throw new Error(error.error_description || 'Failed to exchange code')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error exchanging code for token:', error)
    throw error
  }
}

// Generate state for CSRF protection
export function generateLineState(): string {
  return generateId()
}

// Helper to check if user is logged in with LINE
export function isLineAuthenticated(session: any): boolean {
  return !!(session?.lineUserId && session?.accessToken)
}

// Build redirect URL based on environment
export function buildRedirectUrl(tenant: string, path: string = ''): string {
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  if (isDevelopment) {
    return `http://localhost:3000/${tenant}${path}`
  }
  
  // Production uses subdomain with domain from env
  const domain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'aoowarranty.com'
  return `https://${tenant}.${domain}${path}`
}

// Get cookie domain based on environment
export function getCookieDomain(): string | undefined {
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  if (isDevelopment) {
    // Don't set domain for localhost
    return undefined
  }
  
  // Use wildcard domain for production
  const domain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'aoowarranty.com'
  return `.${domain}`
}