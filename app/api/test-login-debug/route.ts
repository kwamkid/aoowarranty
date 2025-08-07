// app/api/test-login-debug/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function POST(request: NextRequest) {
  const { email } = await request.json()
  const host = request.headers.get('host') || ''
  
  // Extract tenant
  let tenant = ''
  const match = host.match(/^([^.]+)\.aoowarranty\.com/)
  if (match) {
    tenant = match[1]
  }
  
  console.log('Debug - Host:', host)
  console.log('Debug - Tenant:', tenant)
  console.log('Debug - Headers:', Object.fromEntries(request.headers.entries()))
  
  try {
    // Test Firebase connection
    console.log('Testing Firebase connection...')
    const testCollection = await adminDb.collection('companies').limit(1).get()
    console.log('Firebase connected successfully')
    
    // Find company
    const companyQuery = await adminDb.collection('companies')
      .where('slug', '==', tenant)
      .get()
    
    const companyData = companyQuery.empty ? null : {
      id: companyQuery.docs[0].id,
      ...companyQuery.docs[0].data()
    }
    
    // Find user
    let userData = null
    let allUserData = null
    
    if (companyData) {
      const userQuery = await adminDb.collection('users')
        .where('email', '==', email)
        .where('companyId', '==', companyData.id)
        .get()
      
      userData = userQuery.empty ? null : {
        id: userQuery.docs[0].id,
        ...userQuery.docs[0].data()
      }
    }
    
    // Find user in any company
    const anyUserQuery = await adminDb.collection('users')
      .where('email', '==', email)
      .get()
    
    if (!anyUserQuery.empty) {
      allUserData = anyUserQuery.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    }
    
    return NextResponse.json({
      success: true,
      debug: {
        host,
        tenant,
        environment: process.env.NODE_ENV,
        hasFirebaseProjectId: !!process.env.FIREBASE_ADMIN_PROJECT_ID,
        hasFirebaseClientEmail: !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        hasFirebasePrivateKey: !!process.env.FIREBASE_ADMIN_PRIVATE_KEY,
        companyFound: !!companyData,
        companyId: companyData?.id,
        companySlug: companyData?.slug,
        companyIsActive: companyData?.isActive,
        userFound: !!userData,
        userCompanyId: userData?.companyId,
        userIsActive: userData?.isActive,
        hasPassword: !!userData?.password,
        hasPasswordHash: !!userData?.passwordHash,
        userFoundInOtherCompanies: allUserData ? allUserData.length : 0,
        allUserCompanies: allUserData?.map(u => ({
          companyId: u.companyId,
          isActive: u.isActive
        }))
      }
    })
  } catch (error: any) {
    console.error('Debug error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    })
  }
}