// app/api/auth/line/login/route.ts - REAL LINE LOGIN
import { NextRequest, NextResponse } from 'next/server'
import { generateLineState, getLineLoginUrl } from '@/lib/line-auth'

export async function GET(request: NextRequest) {
  try {
    // Get tenant from URL parameter or headers
    const { searchParams } = new URL(request.url)
    const tenant = searchParams.get('tenant') || ''
    
    if (!tenant) {
      return NextResponse.json({
        success: false,
        message: 'Invalid request - no tenant specified'
      }, { status: 400 })
    }
    
    // Generate state for CSRF protection
    const state = generateLineState()
    
    // Generate LINE Login URL with proper callback
    const loginUrl = getLineLoginUrl(state, tenant)
    
    console.log('=== LINE Login Debug ===')
    console.log('Tenant:', tenant)
    console.log('State:', state)
    console.log('Login URL:', loginUrl)
    console.log('Environment:', process.env.NODE_ENV)
    console.log('======================')
    
    // Redirect to LINE Login
    return NextResponse.redirect(loginUrl)
    
  } catch (error: any) {
    console.error('LINE login initiation error:', error)
    
    // Get tenant for error redirect
    const { searchParams } = new URL(request.url)
    const tenant = searchParams.get('tenant') || ''
    
    const isDevelopment = process.env.NODE_ENV === 'development'
    let errorUrl = '/'
    
    if (tenant) {
      if (isDevelopment) {
        errorUrl = `http://localhost:3000/${tenant}?error=line_login_failed`
      } else {
        const domain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'aoowarranty.com'
        errorUrl = `https://${tenant}.${domain}?error=line_login_failed`
      }
    }
    
    return NextResponse.redirect(errorUrl)
  }
}