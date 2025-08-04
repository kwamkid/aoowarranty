// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { cookies } from 'next/headers'
import { hashPassword } from '@/lib/crypto-utils'

// Create new user
export async function POST(request: NextRequest) {
  try {
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
        { success: false, message: 'ไม่มีสิทธิ์เพิ่มผู้ใช้' },
        { status: 403 }
      )
    }
    
    const data = await request.json()
    
    // Validate required fields
    if (!data.email || !data.name || !data.role) {
      return NextResponse.json(
        { success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      )
    }
    
    // Check if email already exists in this company
    const existingUser = await adminDb
      .collection('users')
      .where('companyId', '==', session.companyId)
      .where('email', '==', data.email)
      .get()
    
    if (!existingUser.empty) {
      return NextResponse.json(
        { success: false, message: 'อีเมลนี้มีผู้ใช้งานแล้ว' },
        { status: 400 }
      )
    }
    
    // Create user document
    const newUser = {
      companyId: session.companyId,
      email: data.email,
      name: data.name,
      role: data.role,
      passwordHash: data.password ? hashPassword(data.password) : '', // Hash password
      isActive: true,
      createdAt: new Date(),
      createdBy: session.userId,
      lastLogin: null
    }
    
    const docRef = await adminDb.collection('users').add(newUser)
    
    return NextResponse.json({
      success: true,
      message: 'เพิ่มผู้ใช้สำเร็จ',
      data: { id: docRef.id }
    })
    
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการเพิ่มผู้ใช้' },
      { status: 500 }
    )
  }
}