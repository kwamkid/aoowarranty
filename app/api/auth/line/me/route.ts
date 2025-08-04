// app/api/auth/line/me/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

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