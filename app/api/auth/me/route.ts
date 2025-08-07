// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('auth-session')
    
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
        user: {
          id: sessionData.userId,
          email: sessionData.email,
          name: sessionData.name,
          role: sessionData.role
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
    console.error('Auth check error:', error)
    
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
    const sessionCookie = cookieStore.get('auth-session')
    const headersList = await headers()
    
    // Get tenant from session or headers
    let tenant = ''
    let loginPath = '/admin/login'
    
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
      tenant = headersList.get('x-tenant') || ''
    }
    
    // Determine if production or development
    const host = headersList.get('host') || ''
    const isProduction = !host.includes('localhost')
    
    // Build logout redirect URL
    let redirectUrl = '/'
    
    if (tenant) {
      if (isProduction) {
        // Production: redirect to subdomain admin login
        redirectUrl = '/admin/login'
      } else {
        // Development: redirect with tenant path
        redirectUrl = `/${tenant}/admin/login`
      }
    }
    
    // Clear the session cookie
    const cookieOptions: any = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      maxAge: 0, // Expire immediately
      path: '/'
    }
    
    // Set domain for production to clear across subdomains
    if (isProduction) {
      const baseDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'aoowarranty.com'
      cookieOptions.domain = `.${baseDomain}`
    }
    
    // Clear cookie
    cookieStore.set('auth-session', '', cookieOptions)
    
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