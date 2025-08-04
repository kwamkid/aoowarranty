// lib/line-auth.ts
import { generateId } from './utils'

// LINE Login Configuration
export const LINE_LOGIN_CONFIG = {
  channelId: process.env.NEXT_PUBLIC_LINE_CHANNEL_ID || '',
  channelSecret: process.env.LINE_CHANNEL_SECRET || '',
}

// Generate LINE Login URL
export function getLineLoginUrl(state: string, tenant: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const redirectUri = `${baseUrl}/api/auth/line/callback`
  
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
export async function exchangeCodeForToken(code: string, redirectUri: string) {
  try {
    const response = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
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