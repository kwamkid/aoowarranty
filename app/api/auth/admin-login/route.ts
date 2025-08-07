// app/api/auth/admin-login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { headers } from 'next/headers'
import { cookies } from 'next/headers'
import { generateId } from '@/lib/utils'
import { verifyPassword } from '@/lib/crypto-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body
    
    // Get tenant from multiple sources
    const headersList = await headers()
    
    // 1. Try x-tenant header from middleware
    let tenant = headersList.get('x-tenant') || ''
    
    // 2. If not from middleware, try from request header (sent by client)
    if (!tenant) {
      tenant = headersList.get('x-tenant') || ''
    }
    
    // 3. Try to extract from host header (for production)
    if (!tenant) {
      const host = headersList.get('host') || ''
      
      // Check if it's a subdomain
      if (!host.includes('localhost')) {
        const parts = host.split('.')
        if (parts.length >= 2 && parts[0] !== 'www') {
          tenant = parts[0]
        }
      }
    }
    
    // 4. Try from referer as last resort
    if (!tenant) {
      const referer = headersList.get('referer') || ''
      
      // Production pattern: https://abc-shop.aoowarranty.com/admin/login
      if (!referer.includes('localhost')) {
        const url = new URL(referer)
        const hostParts = url.hostname.split('.')
        if (hostParts.length >= 2 && hostParts[0] !== 'www') {
          tenant = hostParts[0]
        }
      } else {
        // Development pattern: http://localhost:3000/abc-shop/admin/login
        const match = referer.match(/\/([^\/]+)\/admin\/login/)
        if (match) {
          tenant = match[1]
        }
      }
    }
    
    console.log('=== Login API Debug ===')
    console.log('Tenant:', tenant)
    console.log('Email:', email)
    console.log('Host:', headersList.get('host'))
    console.log('Referer:', headersList.get('referer'))
    console.log('=====================')
    
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
      console.log('Company not found for tenant:', tenant)
      return NextResponse.json({
        success: false,
        message: 'ไม่พบข้อมูลบริษัท'
      }, { status: 404 })
    }
    
    const company = companiesSnapshot.docs[0]
    const companyId = company.id
    const companyData = company.data()
    console.log('Found company:', companyData.name, 'ID:', companyId)
    
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
    
    // Check password with hash
    let passwordMatch = false
    
    if (userData.passwordHash) {
      // User has hashed password
      passwordMatch = verifyPassword(password, userData.passwordHash)
      console.log('Checking hashed password')
    } else if (userData.password) {
      // Old user with plain text password
      passwordMatch = userData.password === password
      console.log('Checking plain text password (legacy)')
      
      // Optional: Auto-migrate to hashed password
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
    
    // Create session data
    const sessionData = {
      userId: userDoc.id,
      companyId,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      tenant
    }
    
    // Set cookie with proper domain for production
    const cookieStore = await cookies()
    const isProduction = !request.url.includes('localhost')
    
    // Cookie options
    const cookieOptions: any = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    }
    
    // Set domain for production subdomain
    if (isProduction) {
      // Get base domain from environment or use default
      const baseDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'aoowarranty.com'
      cookieOptions.domain = `.${baseDomain}` // Allow cookie across subdomains
    }
    
    cookieStore.set('auth-session', JSON.stringify(sessionData), cookieOptions)
    
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
          name: companyData.name,
          slug: companyData.slug
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