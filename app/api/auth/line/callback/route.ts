// app/api/auth/line/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { exchangeCodeForToken, getLineProfile, buildRedirectUrl, getCookieDomain } from '@/lib/line-auth'
import { adminDb } from '@/lib/firebase-admin'
import { generateId } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')
    
    // Extract tenant from state
    let tenant = ''
    if (state) {
      const stateParts = state.split(':')
      tenant = stateParts[0] || ''
    }
    
    // Build base URL for redirects
    const isDevelopment = process.env.NODE_ENV === 'development'
    const domain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'aoowarranty.com'
    const baseUrl = isDevelopment 
      ? 'http://localhost:3000' 
      : `https://${domain}`
    
    if (!tenant) {
      console.error('No tenant in callback state')
      return NextResponse.redirect(new URL(baseUrl, request.url))
    }
    
    // Handle LINE errors
    if (error) {
      console.error('LINE Login error:', error, errorDescription)
      const errorUrl = buildRedirectUrl(tenant, `?error=line_login_failed&desc=${encodeURIComponent(errorDescription || '')}`)
      return NextResponse.redirect(new URL(errorUrl, request.url))
    }
    
    if (!code || !state) {
      console.error('Missing code or state')
      const errorUrl = buildRedirectUrl(tenant, '?error=invalid_request')
      return NextResponse.redirect(new URL(errorUrl, request.url))
    }
    
    // Get company info
    const companiesSnapshot = await adminDb.collection('companies')
      .where('slug', '==', tenant)
      .where('isActive', '==', true)
      .limit(1)
      .get()
    
    if (companiesSnapshot.empty) {
      console.error('Company not found:', tenant)
      return NextResponse.redirect(new URL(baseUrl, request.url))
    }
    
    const company = companiesSnapshot.docs[0]
    const companyId = company.id
    
    // Exchange code for token
    console.log('Exchanging code for token...')
    const tokenData = await exchangeCodeForToken(code)
    console.log('Token exchange successful')
    
    // Get user profile
    const profile = await getLineProfile(tokenData.access_token)
    console.log('Got LINE profile:', profile.displayName)
    
    // Check if customer exists
    const customersRef = adminDb.collection('customers')
    const existingCustomerQuery = await customersRef
      .where('lineUserId', '==', profile.userId)
      .where('companyId', '==', companyId)
      .limit(1)
      .get()
    
    let customerId: string
    
    if (existingCustomerQuery.empty) {
      // Create new customer
      customerId = generateId()
      await customersRef.doc(customerId).set({
        companyId,
        lineUserId: profile.userId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl || '',
        email: tokenData.email || '',
        statusMessage: profile.statusMessage || '',
        createdAt: new Date(),
        lastLogin: new Date(),
        warranties: []
      })
      console.log('Created new customer:', customerId)
    } else {
      // Update existing customer
      customerId = existingCustomerQuery.docs[0].id
      await customersRef.doc(customerId).update({
        lastLogin: new Date(),
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl || '',
        statusMessage: profile.statusMessage || ''
      })
      console.log('Updated existing customer:', customerId)
    }
    
    // Create session
    const sessionData = {
      customerId,
      lineUserId: profile.userId,
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl || '',
      email: tokenData.email || '',
      companyId,
      tenant,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || '',
      expiresIn: tokenData.expires_in
    }
    
    // Set session cookie with proper domain
    const cookieStore = await cookies()
    const cookieDomain = getCookieDomain()
    
    cookieStore.set('line-session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: !isDevelopment, // Only secure in production
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      ...(cookieDomain && { domain: cookieDomain }) // Add domain only if defined
    })
    
    console.log('Session created, redirecting to:', buildRedirectUrl(tenant))
    
    // Redirect to tenant home
    return NextResponse.redirect(new URL(buildRedirectUrl(tenant), request.url))
    
  } catch (error: any) {
    console.error('LINE callback error:', error)
    
    // Get tenant for redirect
    const searchParams = request.nextUrl.searchParams
    const state = searchParams.get('state')
    let tenant = ''
    if (state) {
      const stateParts = state.split(':')
      tenant = stateParts[0] || ''
    }
    
    const isDevelopment = process.env.NODE_ENV === 'development'
    const domain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'aoowarranty.com'
    const baseUrl = isDevelopment 
      ? 'http://localhost:3000' 
      : `https://${domain}`
    
    const errorUrl = tenant 
      ? buildRedirectUrl(tenant, '?error=authentication_failed')
      : baseUrl
      
    return NextResponse.redirect(new URL(errorUrl, request.url))
  }
}