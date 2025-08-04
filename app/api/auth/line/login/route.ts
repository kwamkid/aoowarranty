// app/api/auth/line/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { generateLineState, getLineLoginUrl } from '@/lib/line-auth'
import { headers } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    // Get tenant from headers
    const headersList = await headers()
    const tenant = headersList.get('x-tenant') || ''
    
    if (!tenant) {
      return NextResponse.json({
        success: false,
        message: 'Invalid request'
      }, { status: 400 })
    }
    
    // Generate state for CSRF protection
    const state = generateLineState()
    
    // TODO: In production, store state in database or cache for verification
    
    // Generate LINE Login URL
    const loginUrl = getLineLoginUrl(state, tenant)
    
    // Redirect to LINE Login
    return NextResponse.redirect(loginUrl)
    
  } catch (error: any) {
    console.error('LINE login initiation error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Failed to initiate LINE login',
      error: error.message
    }, { status: 500 })
  }
}