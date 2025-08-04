// app/api/auth/line/me/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'

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
    cookieStore.delete('line-session')
    
    // Get tenant for redirect
    const headersList = await headers()
    const tenant = headersList.get('x-tenant') || ''
    
    // Redirect to tenant home
    const isLocalhost = headersList.get('x-tenant-host') === 'localhost'
    let redirectUrl = '/'
    
    if (tenant) {
      if (isLocalhost) {
        redirectUrl = `http://localhost:3000/${tenant}`
      } else {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://warrantyhub.com'
        const domain = baseUrl.replace(/https?:\/\//, '')
        redirectUrl = `https://${tenant}.${domain}`
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'ออกจากระบบสำเร็จ',
      redirectUrl
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'เกิดข้อผิดพลาด'
    }, { status: 500 })
  }
}