import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { verifyPassword } from '@/lib/crypto-utils'
import { cookies } from 'next/headers'
import { generateId } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    // 1. Find user by email across all companies
    const usersSnapshot = await adminDb.collection('users')
      .where('email', '==', email)
      .where('isActive', '==', true)
      .limit(1)
      .get()
    
    if (usersSnapshot.empty) {
      return NextResponse.json({ 
        success: false, 
        message: 'ไม่พบผู้ใช้งานในระบบ' 
      }, { status: 401 })
    }
    
    const userDoc = usersSnapshot.docs[0]
    const userData = userDoc.data()
    
    // 2. Verify password
    let passwordMatch = false
    
    if (userData.passwordHash) {
      // User has hashed password
      passwordMatch = verifyPassword(password, userData.passwordHash)
      console.log('Checking hashed password')
    } else if (userData.password) {
      // Old user with plain text password
      passwordMatch = userData.password === password
      console.log('Checking plain text password (legacy)')
      
      // Auto-migrate to hashed password
      if (passwordMatch) {
        try {
          const { hashPassword } = await import('@/lib/crypto-utils')
          await adminDb.collection('users').doc(userDoc.id).update({
            passwordHash: hashPassword(password),
            password: null // Remove plain text password
          })
          console.log('Auto-migrated password to hash')
        } catch (error) {
          console.error('Error migrating password:', error)
        }
      }
    } else {
      console.log('User has no password set')
    }
    
    if (!passwordMatch) {
      return NextResponse.json({ 
        success: false, 
        message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' 
      }, { status: 401 })
    }
    
    // 3. Get company data
    const companyDoc = await adminDb.collection('companies')
      .doc(userData.companyId)
      .get()
    
    if (!companyDoc.exists) {
      return NextResponse.json({ 
        success: false, 
        message: 'ไม่พบข้อมูลบริษัท' 
      }, { status: 404 })
    }
    
    const companyData = companyDoc.data()
    
    // 4. Create session
    const sessionData = {
      userId: userDoc.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      companyId: userData.companyId,
      companySlug: companyData.slug,
      companyName: companyData.name,
      tenant: companyData.slug  // Add tenant for compatibility
    }
    
    // 5. Generate session token
    const sessionToken = generateId()
    
    // 6. Store session in cookies
    const cookieStore = await cookies()
    
    // Set auth cookie
    cookieStore.set('auth-session', JSON.stringify({
      ...sessionData,
      token: sessionToken
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })
    
    // Set tenant cookie
    cookieStore.set('tenant', companyData.slug, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })
    
    // 7. Update last login
    await adminDb.collection('users').doc(userDoc.id).update({
      lastLogin: new Date()
    })
    
    // 8. Return success with redirect info
    return NextResponse.json({
      success: true,
      user: {
        id: userDoc.id,
        name: userData.name,
        email: userData.email,
        role: userData.role
      },
      company: {
        id: userData.companyId,
        name: companyData.name,
        slug: companyData.slug
      },
      redirectUrl: getRedirectUrl(companyData.slug)
    })
    
  } catch (error) {
    console.error('Direct login error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' 
    }, { status: 500 })
  }
}

// Helper function to build redirect URL
function getRedirectUrl(companySlug: string): string {
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  if (isDevelopment) {
    return `http://localhost:3000/${companySlug}/admin`
  } else {
    // Get domain from environment or use default
    const domain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'aoowarranty.com'
    return `https://${companySlug}.${domain}/admin`
  }
}