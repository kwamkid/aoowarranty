// app/api/auth/line/me/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'
import { buildRedirectUrl } from '@/lib/line-auth'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('line-session')
    
    if (!sessionCookie) {
      return NextResponse.json({
        success: false,
        authenticated: false,
        message: 'ไม่พบ session'
      }, { status: 401 })
    }
    
    try {
      const sessionData = JSON.parse(sessionCookie.value)
      
      return NextResponse.json({
        success: true,
        authenticated: true,
        customer: {
          id: sessionData.customerId,
          lineUserId: sessionData.lineUserId,
          displayName: sessionData.displayName,
          pictureUrl: sessionData.pictureUrl,
          email: sessionData.email
        },
        company: {
          id: sessionData.companyId,
          tenant: sessionData.tenant
        }
      })
    } catch (error) {
      return NextResponse.json({
        success: false,
        authenticated: false,
        message: 'Session ไม่ถูกต้อง'
      }, { status: 401 })
    }
    
  } catch (error: any) {
    console.error('LINE session check error:', error)
    
    return NextResponse.json({
      success: false,
      authenticated: false,
      message: 'เกิดข้อผิดพลาด'
    }, { status: 500 })
  }
}

// Logout endpoint
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('line-session')
    
    // Get tenant from session for redirect
    let tenant = ''
    if (sessionCookie) {
      try {
        const sessionData = JSON.parse(sessionCookie.value)
        tenant = sessionData.tenant || ''
      } catch (error) {
        console.error('Error parsing session:', error)
      }
    }
    
    // If no tenant in session, try headers
    if (!tenant) {
      const headersList = await headers()
      tenant = headersList.get('x-tenant') || ''
    }
    
    // Delete the session cookie
    cookieStore.delete('line-session')
    
    // For production with subdomain, also try to delete with domain
    const isDevelopment = process.env.NODE_ENV === 'development'
    if (!isDevelopment) {
      // Try to delete cookie with domain setting
      const domain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'aoowarranty.com'
      cookieStore.set('line-session', '', {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 0,
        domain: `.${domain}`
      })
    }
    
    // Build redirect URL
    let redirectUrl = '/'
    if (tenant) {
      redirectUrl = buildRedirectUrl(tenant)
    }
    
    return NextResponse.json({
      success: true,
      message: 'ออกจากระบบสำเร็จ',
      redirectUrl
    })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({
      success: false,
      message: 'เกิดข้อผิดพลาด'
    }, { status: 500 })
  }
}