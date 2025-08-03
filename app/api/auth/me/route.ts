// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

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
    cookieStore.delete('auth-session')
    
    return NextResponse.json({
      success: true,
      message: 'ออกจากระบบสำเร็จ'
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'เกิดข้อผิดพลาด'
    }, { status: 500 })
  }
}