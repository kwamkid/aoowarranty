import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// GET: Check current session
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const authSession = cookieStore.get('auth-session')
    
    if (!authSession) {
      return NextResponse.json({ 
        success: true,
        user: null,
        authenticated: false 
      })
    }
    
    try {
      const sessionData = JSON.parse(authSession.value)
      
      // Return user info
      return NextResponse.json({
        success: true,
        authenticated: true,
        user: {
          id: sessionData.userId,
          name: sessionData.name,
          email: sessionData.email,
          role: sessionData.role,
          companyName: sessionData.companyName,
          companySlug: sessionData.companySlug || sessionData.tenant,
          companyId: sessionData.companyId
        }
      })
    } catch (error) {
      // Invalid session data
      return NextResponse.json({ 
        success: true,
        user: null,
        authenticated: false 
      })
    }
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json({ 
      success: false,
      message: 'เกิดข้อผิดพลาดในการตรวจสอบ session' 
    }, { status: 500 })
  }
}

// DELETE: Logout
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const isDevelopment = process.env.NODE_ENV === 'development'
    const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'aoowarranty.com'
    
    // Clear auth session - with domain for production
    if (isDevelopment) {
      // Development - just delete normally
      cookieStore.delete('auth-session')
      cookieStore.delete('tenant')
    } else {
      // Production - delete with domain to clear from all subdomains
      const deleteCookieOptions = {
        path: '/',
        domain: `.${appDomain}` // .aoowarranty.com
      }
      
      // Delete by setting empty value with maxAge 0
      cookieStore.set('auth-session', '', {
        ...deleteCookieOptions,
        httpOnly: true,
        secure: true,
        sameSite: 'lax' as const,
        maxAge: 0
      })
      
      cookieStore.set('tenant', '', {
        ...deleteCookieOptions,
        httpOnly: false,
        secure: true,
        sameSite: 'lax' as const,
        maxAge: 0
      })
    }
    
    // Build homepage URL
    let homepageUrl = '/'
    if (!isDevelopment) {
      // Production - redirect to main domain
      homepageUrl = `https://www.${appDomain}`
    }
    
    console.log('Logout successful, redirecting to:', homepageUrl)
    
    return NextResponse.json({
      success: true,
      message: 'ออกจากระบบเรียบร้อยแล้ว',
      redirectUrl: homepageUrl
    })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ 
      success: false,
      message: 'เกิดข้อผิดพลาดในการออกจากระบบ' 
    }, { status: 500 })
  }
}