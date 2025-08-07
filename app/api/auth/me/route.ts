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
    
    // Clear auth session
    cookieStore.delete('auth-session')
    cookieStore.delete('tenant')
    
    return NextResponse.json({
      success: true,
      message: 'ออกจากระบบเรียบร้อยแล้ว'
    })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ 
      success: false,
      message: 'เกิดข้อผิดพลาดในการออกจากระบบ' 
    }, { status: 500 })
  }
}