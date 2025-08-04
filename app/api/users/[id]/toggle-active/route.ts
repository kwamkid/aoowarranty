// app/api/users/[id]/toggle-active/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { cookies } from 'next/headers'

// Toggle active status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params
    
    // Get auth session
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('auth-session')
    
    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const session = JSON.parse(sessionCookie.value)
    
    // Check if user is owner/admin
    if (!['owner', 'admin'].includes(session.role)) {
      return NextResponse.json(
        { success: false, message: 'ไม่มีสิทธิ์แก้ไขสถานะผู้ใช้' },
        { status: 403 }
      )
    }
    
    // Cannot toggle yourself
    if (userId === session.userId) {
      return NextResponse.json(
        { success: false, message: 'ไม่สามารถเปลี่ยนสถานะของตัวเองได้' },
        { status: 400 }
      )
    }
    
    const data = await request.json()
    
    // Get user to check
    const userDoc = await adminDb.collection('users').doc(userId).get()
    if (!userDoc.exists || userDoc.data()?.companyId !== session.companyId) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบผู้ใช้' },
        { status: 404 }
      )
    }
    
    // Cannot deactivate owner
    if (userDoc.data()?.role === 'owner' && !data.isActive) {
      return NextResponse.json(
        { success: false, message: 'ไม่สามารถปิดการใช้งานบัญชีเจ้าของระบบได้' },
        { status: 400 }
      )
    }
    
    // Update status
    await adminDb.collection('users').doc(userId).update({
      isActive: data.isActive,
      updatedAt: new Date(),
      updatedBy: session.userId
    })
    
    return NextResponse.json({
      success: true,
      message: data.isActive ? 'เปิดการใช้งานผู้ใช้สำเร็จ' : 'ปิดการใช้งานผู้ใช้สำเร็จ'
    })
    
  } catch (error) {
    console.error('Error toggling user status:', error)
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    )
  }
}