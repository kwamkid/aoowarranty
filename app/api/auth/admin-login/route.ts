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
    const { email, password, tenant: bodyTenant } = body
    
    // Get tenant from headers
    const headersList = await headers()
    let tenant = headersList.get('x-tenant') || ''
    
    // If not from middleware, try from request header (sent by client)
    if (!tenant) {
      const clientTenant = request.headers.get('x-tenant')
      if (clientTenant) {
        tenant = clientTenant
      }
    }
    
    // Try from body if provided
    if (!tenant && bodyTenant) {
      tenant = bodyTenant
      console.log('Using tenant from request body:', tenant)
    }
    
    // Try to extract from host header
    if (!tenant) {
      const host = headersList.get('host') || ''
      
      // Check if it's a subdomain in production
      if (!host.includes('localhost') && !host.includes('127.0.0.1')) {
        // Direct extraction for aoowarranty.com subdomain
        // Pattern: abc-shop.aoowarranty.com -> abc-shop
        const match = host.match(/^([^.]+)\.aoowarranty\.com/)
        if (match && match[1] !== 'www') {
          tenant = match[1]
          console.log('Extracted tenant from production subdomain:', tenant)
        } else {
          // Fallback to original method
          const parts = host.split('.')
          if (parts.length >= 2 && parts[0] !== 'www') {
            tenant = parts[0]
          }
        }
      }
    }
    
    // Try from referer as last resort
    if (!tenant) {
      const referer = headersList.get('referer') || ''
      
      // Production pattern: https://abc-shop.aoowarranty.com/admin/login
      if (!referer.includes('localhost') && !referer.includes('127.0.0.1')) {
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
    console.log('Environment:', process.env.NODE_ENV)
    console.log('Raw Request Headers:', Object.fromEntries(request.headers.entries()))
    console.log('=====================')
    
    if (!tenant) {
      return NextResponse.json({
        success: false,
        message: 'ไม่พบข้อมูลบริษัท',
        debug: {
          host: headersList.get('host'),
          referer: headersList.get('referer'),
          xTenant: headersList.get('x-tenant'),
          clientTenant: request.headers.get('x-tenant'),
          environment: process.env.NODE_ENV
        }
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
      
      // Debug: List all companies
      const allCompanies = await adminDb.collection('companies').get()
      console.log('All companies in DB:')
      allCompanies.docs.forEach(doc => {
        const data = doc.data()
        console.log(`- ${data.name}: slug="${data.slug}", active=${data.isActive}`)
      })
      
      return NextResponse.json({
        success: false,
        message: 'ไม่พบข้อมูลบริษัท',
        debug: {
          searchedSlug: tenant,
          totalCompanies: allCompanies.size
        }
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
      
      // Debug: Check if user exists in other companies
      const userInOtherCompany = await adminDb.collection('users')
        .where('email', '==', email)
        .get()
      
      if (!userInOtherCompany.empty) {
        const otherUser = userInOtherCompany.docs[0].data()
        console.log('User found in different company:', otherUser.companyId)
        console.log('User isActive:', otherUser.isActive)
      }
      
      // Debug: List all users in this company
      const allUsersInCompany = await adminDb.collection('users')
        .where('companyId', '==', companyId)
        .get()
      
      console.log('All users in company', companyId, ':')
      allUsersInCompany.docs.forEach(doc => {
        const userData = doc.data()
        console.log(`- ${userData.email}: active=${userData.isActive}, role=${userData.role}`)
      })
      
      return NextResponse.json({
        success: false,
        message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
      }, { status: 401 })
    }
    
    const userDoc = usersSnapshot.docs[0]
    const userData = userDoc.data()
    
    console.log('User found:', userData.email)
    console.log('Has password:', !!userData.password)
    console.log('Has passwordHash:', !!userData.passwordHash)
    
    // Check password with hash
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
    
    // Create session data with complete info
    const sessionData = {
      userId: userDoc.id,
      companyId,
      companySlug: companyData.slug,
      companyName: companyData.name,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      tenant
    }
    
    // Set cookie with proper domain for production
    const cookieStore = await cookies()
    const host = headersList.get('host') || ''
    const isProduction = !host.includes('localhost') && !host.includes('127.0.0.1')
    
   // Cookie options
    const cookieOptions: any = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    }
    
    // Set domain for production subdomain - use wildcard domain
    if (isProduction) {
      const domain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'aoowarranty.com'
      cookieOptions.domain = `.${domain}` // .aoowarranty.com
      console.log('Production mode - setting cookie domain:', cookieOptions.domain)
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
    console.error('Stack trace:', error.stack)
    
    return NextResponse.json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ',
      error: error.message
    }, { status: 500 })
  }
}