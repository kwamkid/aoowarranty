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
    
    // Generate LINE Login URL
    const loginUrl = getLineLoginUrl(state, tenant)
    
    console.log('Redirecting to LINE Login:', loginUrl)
    console.log('Tenant:', tenant)
    
    // Redirect to LINE Login
    return NextResponse.redirect(loginUrl)
    
  } catch (error: any) {
    console.error('LINE login initiation error:', error)
    
    // Get tenant for error redirect
    const { searchParams } = new URL(request.url)
    const tenant = searchParams.get('tenant') || ''
    
    let errorUrl = '/'
    if (tenant) {
      errorUrl = `http://localhost:3000/${tenant}?error=line_login_failed`
    }
    
    return NextResponse.redirect(errorUrl)
  }
}