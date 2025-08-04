// app/api/auth/line/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { exchangeCodeForToken, getLineProfile } from '@/lib/line-auth'
import { adminDb } from '@/lib/firebase-admin'
import { generateId } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    
    // Extract tenant from state
    let tenant = ''
    if (state) {
      const stateParts = state.split(':')
      tenant = stateParts[0] || ''
    }
    
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    if (!tenant) {
      return NextResponse.redirect(new URL(appUrl, request.url))
    }
    
    // Handle LINE errors
    if (error) {
      console.error('LINE Login error:', error)
      return NextResponse.redirect(new URL(`${appUrl}/${tenant}?error=line_login_failed`, request.url))
    }
    
    if (!code || !state) {
      return NextResponse.redirect(new URL(`${appUrl}/${tenant}?error=invalid_request`, request.url))
    }
    
    // Get company info
    const companiesSnapshot = await adminDb.collection('companies')
      .where('slug', '==', tenant)
      .where('isActive', '==', true)
      .limit(1)
      .get()
    
    if (companiesSnapshot.empty) {
      return NextResponse.redirect(new URL(appUrl, request.url))
    }
    
    const company = companiesSnapshot.docs[0]
    const companyId = company.id
    
    // Exchange code for token
    const redirectUri = `${appUrl}/api/auth/line/callback`
    const tokenData = await exchangeCodeForToken(code, redirectUri)
    
    // Get user profile
    const profile = await getLineProfile(tokenData.access_token)
    
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
        createdAt: new Date(),
        lastLogin: new Date(),
        warranties: []
      })
    } else {
      // Update existing customer
      customerId = existingCustomerQuery.docs[0].id
      await customersRef.doc(customerId).update({
        lastLogin: new Date(),
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl || ''
      })
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
      accessToken: tokenData.access_token
    }
    
    // Set session cookie
    const cookieStore = await cookies()
    cookieStore.set('line-session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    })
    
    // Redirect to register page
    return NextResponse.redirect(new URL(`${appUrl}/${tenant}/register`, request.url))
    
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
    
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return NextResponse.redirect(
      new URL(`${appUrl}/${tenant}?error=authentication_failed`, request.url)
    )
  }
}