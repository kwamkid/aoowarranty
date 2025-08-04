// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { cookies } from 'next/headers'

// Update user
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
        { success: false, message: 'ไม่มีสิทธิ์แก้ไขข้อมูล' },
        { status: 403 }
      )
    }
    
    const data = await request.json()
    
    // Get user to check company
    const userDoc = await adminDb.collection('users').doc(userId).get()
    if (!userDoc.exists || userDoc.data()?.companyId !== session.companyId) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบผู้ใช้' },
        { status: 404 }
      )
    }
    
    // Cannot change owner role
    if (userDoc.data()?.role === 'owner' && data.role !== 'owner') {
      return NextResponse.json(
        { success: false, message: 'ไม่สามารถเปลี่ยนบทบาทของเจ้าของระบบได้' },
        { status: 400 }
      )
    }
    
    // Update user
    const updateData = {
      email: data.email,
      name: data.name,
      role: data.role,
      isActive: data.isActive,
      updatedAt: new Date(),
      updatedBy: session.userId
    }
    
    await adminDb.collection('users').doc(userId).update(updateData)
    
    return NextResponse.json({
      success: true,
      message: 'แก้ไขข้อมูลสำเร็จ'
    })
    
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล' },
      { status: 500 }
    )
  }
}

// Delete user
export async function DELETE(
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
        { success: false, message: 'ไม่มีสิทธิ์ลบผู้ใช้' },
        { status: 403 }
      )
    }
    
    // Cannot delete yourself
    if (userId === session.userId) {
      return NextResponse.json(
        { success: false, message: 'ไม่สามารถลบบัญชีของตัวเองได้' },
        { status: 400 }
      )
    }
    
    // Get user to check
    const userDoc = await adminDb.collection('users').doc(userId).get()
    if (!userDoc.exists || userDoc.data()?.companyId !== session.companyId) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบผู้ใช้' },
        { status: 404 }
      )
    }
    
    // Cannot delete owner
    if (userDoc.data()?.role === 'owner') {
      return NextResponse.json(
        { success: false, message: 'ไม่สามารถลบบัญชีเจ้าของระบบได้' },
        { status: 400 }
      )
    }
    
    // Delete user
    await adminDb.collection('users').doc(userId).delete()
    
    return NextResponse.json({
      success: true,
      message: 'ลบผู้ใช้สำเร็จ'
    })
    
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการลบผู้ใช้' },
      { status: 500 }
    )
  }
}