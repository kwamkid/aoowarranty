// app/api/users/[id]/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { cookies } from 'next/headers'
import { generatePassword } from '@/lib/utils'
import { hashPassword } from '@/lib/crypto-utils'

// Reset password
export async function POST(
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
        { success: false, message: 'ไม่มีสิทธิ์รีเซ็ตรหัสผ่าน' },
        { status: 403 }
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
    
    // Generate new password
    const newPassword = generatePassword(6)
    
    // Update password
    await adminDb.collection('users').doc(userId).update({
      passwordHash: hashPassword(newPassword), // Store hashed password
      passwordResetAt: new Date(),
      passwordResetBy: session.userId
    })
    
    return NextResponse.json({
      success: true,
      message: 'รีเซ็ตรหัสผ่านสำเร็จ',
      data: { newPassword }
    })
    
  } catch (error) {
    console.error('Error resetting password:', error)
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน' },
      { status: 500 }
    )
  }
}