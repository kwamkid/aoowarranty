// app/api/auth/admin-login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { headers } from 'next/headers'
import { cookies } from 'next/headers'
import { generateId } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body
    
    // Get tenant from headers
    const headersList = await headers()
    const tenant = headersList.get('x-tenant') || ''
    
    if (!tenant) {
      return NextResponse.json({
        success: false,
        message: 'ไม่พบข้อมูลบริษัท'
      }, { status: 400 })
    }
    
    // Get company by slug
    const companiesSnapshot = await adminDb.collection('companies')
      .where('slug', '==', tenant)
      .where('isActive', '==', true)
      .limit(1)
      .get()
    
    if (companiesSnapshot.empty) {
      return NextResponse.json({
        success: false,
        message: 'ไม่พบข้อมูลบริษัท'
      }, { status: 404 })
    }
    
    const company = companiesSnapshot.docs[0]
    const companyId = company.id
    
    // Find user by email and company
    const usersSnapshot = await adminDb.collection('users')
      .where('email', '==', email)
      .where('companyId', '==', companyId)
      .where('isActive', '==', true)
      .limit(1)
      .get()
    
    if (usersSnapshot.empty) {
      return NextResponse.json({
        success: false,
        message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
      }, { status: 401 })
    }
    
    const userDoc = usersSnapshot.docs[0]
    const userData = userDoc.data()
    
    // Check password (in production, use proper hashing)
    if (userData.password !== password) {
      return NextResponse.json({
        success: false,
        message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
      }, { status: 401 })
    }
    
    // Update last login
    await adminDb.collection('users').doc(userDoc.id).update({
      lastLogin: new Date()
    })
    
    // Create session token (in production, use JWT)
    const sessionToken = generateId()
    const sessionData = {
      userId: userDoc.id,
      companyId,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      tenant
    }
    
    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set('auth-session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })
    
    return NextResponse.json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      data: {
        user: {
          id: userDoc.id,
          name: userData.name,
          email: userData.email,
          role: userData.role
        },
        company: {
          id: companyId,
          name: company.data().name,
          slug: company.data().slug
        }
      }
    })
    
  } catch (error: any) {
    console.error('Login error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ',
      error: error.message
    }, { status: 500 })
  }
}