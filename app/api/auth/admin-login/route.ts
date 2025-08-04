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
    
    // DEBUG: Log all headers
    console.log('=== API Debug ===')
    console.log('Request URL:', request.url)
    console.log('x-tenant:', tenant)
    console.log('x-tenant-host:', headersList.get('x-tenant-host'))
    console.log('host:', headersList.get('host'))
    console.log('referer:', headersList.get('referer'))
    console.log('================')
    
    // Try to extract tenant from referer if not in x-tenant
    let actualTenant = tenant
    if (!actualTenant) {
      const referer = headersList.get('referer') || ''
      console.log('No x-tenant, checking referer:', referer)
      
      // Extract tenant from referer URL like http://localhost:3000/abc-shop/admin/login
      const match = referer.match(/\/([^\/]+)\/admin\/login/)
      if (match) {
        actualTenant = match[1]
        console.log('Found tenant from referer:', actualTenant)
      }
    }
    
    if (!actualTenant) {
      console.log('No tenant found!')
      return NextResponse.json({
        success: false,
        message: 'ไม่พบข้อมูลบริษัท'
      }, { status: 400 })
    }
    
    // Get company by slug
    const companiesSnapshot = await adminDb.collection('companies')
      .where('slug', '==', actualTenant)
      .where('isActive', '==', true)
      .limit(1)
      .get()
    
    if (companiesSnapshot.empty) {
      console.log('Company not found for tenant:', actualTenant)
      return NextResponse.json({
        success: false,
        message: 'ไม่พบข้อมูลบริษัท'
      }, { status: 404 })
    }
    
    const company = companiesSnapshot.docs[0]
    const companyId = company.id
    console.log('Found company:', company.data().name, 'ID:', companyId)
    
    // Find user by email and company
    const usersSnapshot = await adminDb.collection('users')
      .where('email', '==', email)
      .where('companyId', '==', companyId)
      .where('isActive', '==', true)
      .limit(1)
      .get()
    
    if (usersSnapshot.empty) {
      console.log('User not found:', email, 'in company:', companyId)
      return NextResponse.json({
        success: false,
        message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
      }, { status: 401 })
    }
    
    const userDoc = usersSnapshot.docs[0]
    const userData = userDoc.data()
    
    // Check password (in production, use proper hashing)
    if (userData.password !== password) {
      console.log('Invalid password')
      return NextResponse.json({
        success: false,
        message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
      }, { status: 401 })
    }
    
    console.log('Login successful for user:', userData.name)
    
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
      tenant: actualTenant
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