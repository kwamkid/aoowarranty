// app/api/auth/direct-login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { verifyPassword } from '@/lib/crypto-utils'
import { cookies } from 'next/headers'
import { generateId } from '@/lib/utils'

export async function POST(request: NextRequest) {
  console.log('=== Direct Login API Called ===')
  console.log('Time:', new Date().toISOString())
  console.log('Environment:', process.env.NODE_ENV)
  
  try {
    const body = await request.json()
    const { email, password } = body
    
    console.log('Login attempt for email:', email)
    
    // Debug: Check if Firebase Admin is initialized
    try {
      console.log('Testing Firebase Admin connection...')
      const testCollection = await adminDb.collection('users').limit(1).get()
      console.log('Firebase Admin connected successfully')
    } catch (fbError: any) {
      console.error('Firebase Admin connection error:', fbError.message)
      return NextResponse.json({ 
        success: false, 
        message: 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้',
        debug: {
          error: 'Firebase connection failed',
          details: fbError.message
        }
      }, { status: 500 })
    }
    
    // 1. Find user by email across all companies
    console.log('Searching for user:', email)
    const usersSnapshot = await adminDb.collection('users')
      .where('email', '==', email)
      .where('isActive', '==', true)
      .limit(1)
      .get()
    
    console.log('User search result:', {
      found: !usersSnapshot.empty,
      size: usersSnapshot.size
    })
    
    if (usersSnapshot.empty) {
      // Debug: Check if user exists but inactive
      const inactiveUser = await adminDb.collection('users')
        .where('email', '==', email)
        .limit(1)
        .get()
      
      if (!inactiveUser.empty) {
        console.log('User found but inactive')
        return NextResponse.json({ 
          success: false, 
          message: 'บัญชีผู้ใช้งานถูกระงับ',
          debug: {
            reason: 'User is inactive',
            email: email
          }
        }, { status: 401 })
      }
      
      console.log('User not found at all')
      return NextResponse.json({ 
        success: false, 
        message: 'ไม่พบผู้ใช้งานในระบบ',
        debug: {
          reason: 'User not found',
          email: email
        }
      }, { status: 401 })
    }
    
    const userDoc = usersSnapshot.docs[0]
    const userData = userDoc.data()
    
    console.log('User found:', {
      id: userDoc.id,
      name: userData.name,
      companyId: userData.companyId,
      role: userData.role,
      hasPassword: !!userData.password,
      hasPasswordHash: !!userData.passwordHash
    })
    
    // 2. Verify password
    let passwordMatch = false
    
    if (userData.passwordHash) {
      // User has hashed password
      passwordMatch = verifyPassword(password, userData.passwordHash)
      console.log('Checking hashed password - match:', passwordMatch)
    } else if (userData.password) {
      // Old user with plain text password
      passwordMatch = userData.password === password
      console.log('Checking plain text password (legacy) - match:', passwordMatch)
      
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
      console.log('Password verification failed')
      return NextResponse.json({ 
        success: false, 
        message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
        debug: {
          reason: 'Invalid password',
          email: email
        }
      }, { status: 401 })
    }
    
    // 3. Get company data
    console.log('Fetching company data for ID:', userData.companyId)
    const companyDoc = await adminDb.collection('companies')
      .doc(userData.companyId)
      .get()
    
    if (!companyDoc.exists) {
      console.error('Company not found:', userData.companyId)
      return NextResponse.json({ 
        success: false, 
        message: 'ไม่พบข้อมูลบริษัท',
        debug: {
          reason: 'Company not found',
          companyId: userData.companyId
        }
      }, { status: 404 })
    }
    
    const companyData = companyDoc.data()
    console.log('Company found:', {
      id: companyDoc.id,
      name: companyData.name,
      slug: companyData.slug,
      isActive: companyData.isActive
    })
    
    // Check if company is active
    if (!companyData.isActive) {
      console.log('Company is suspended')
      return NextResponse.json({ 
        success: false, 
        message: 'บริษัทถูกระงับการใช้งาน',
        debug: {
          reason: 'Company suspended',
          companyName: companyData.name
        }
      }, { status: 403 })
    }
    
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
    
    console.log('Creating session for user')
    
    // 5. Generate session token
    const sessionToken = generateId()
    
    // 6. Store session in cookies
    const cookieStore = await cookies()
    
    // Set auth cookie with proper domain for production
    const isDevelopment = process.env.NODE_ENV === 'development'
    const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'aoowarranty.com'
    
    const cookieOptions: any = {
      httpOnly: true,
      secure: !isDevelopment,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    }
    
    // IMPORTANT: Set domain for production to share cookie across subdomains
    if (!isDevelopment) {
      // Use wildcard domain so cookie works on all subdomains
      cookieOptions.domain = `.${appDomain}` // .aoowarranty.com
    }
    
    console.log('Setting cookies with options:', cookieOptions)
    
    cookieStore.set('auth-session', JSON.stringify({
      ...sessionData,
      token: sessionToken
    }), cookieOptions)
    
    // Set tenant cookie with same domain
    cookieStore.set('tenant', companyData.slug, {
      httpOnly: false,
      secure: !isDevelopment,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      ...(cookieOptions.domain && { domain: cookieOptions.domain })
    })
    
    // 7. Update last login
    await adminDb.collection('users').doc(userDoc.id).update({
      lastLogin: new Date()
    })
    
    console.log('Login successful, updating last login')
    
    // 8. Return success with redirect info
    const { getLoginRedirectUrl } = await import('@/lib/url-helper')
    const redirectUrl = getLoginRedirectUrl({ tenant: companyData.slug })
    console.log('Login success! Redirecting to:', redirectUrl)
    
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
      redirectUrl
    })
    
  } catch (error: any) {
    console.error('=== Direct Login Error ===')
    console.error('Error type:', error.constructor.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    console.error('=========================')
    
    return NextResponse.json({ 
      success: false, 
      message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ',
      debug: {
        error: error.message,
        type: error.constructor.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    }, { status: 500 })
  }
}