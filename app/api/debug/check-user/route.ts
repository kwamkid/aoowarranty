// app/api/debug/check-user/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

// TEMPORARY DEBUG API - REMOVE AFTER USE!
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ 
        success: false, 
        message: 'Email required' 
      }, { status: 400 })
    }
    
    console.log('Checking user:', email)
    
    // Find all users with this email (both active and inactive)
    const allUsersSnapshot = await adminDb.collection('users')
      .where('email', '==', email)
      .get()
    
    const users = []
    
    for (const doc of allUsersSnapshot.docs) {
      const userData = doc.data()
      
      // Get company info
      let companyInfo = null
      if (userData.companyId) {
        try {
          const companyDoc = await adminDb.collection('companies')
            .doc(userData.companyId)
            .get()
          
          if (companyDoc.exists) {
            companyInfo = {
              id: companyDoc.id,
              name: companyDoc.data().name,
              slug: companyDoc.data().slug,
              isActive: companyDoc.data().isActive
            }
          }
        } catch (error) {
          console.error('Error fetching company:', error)
        }
      }
      
      users.push({
        id: doc.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        isActive: userData.isActive,
        hasPassword: !!userData.password,
        hasPasswordHash: !!userData.passwordHash,
        passwordLength: userData.password ? userData.password.length : 0,
        passwordHashLength: userData.passwordHash ? userData.passwordHash.length : 0,
        companyId: userData.companyId,
        company: companyInfo,
        createdAt: userData.createdAt,
        lastLogin: userData.lastLogin
      })
    }
    
    console.log(`Found ${users.length} users with email ${email}`)
    
    return NextResponse.json({
      success: true,
      email: email,
      totalUsers: users.length,
      users: users,
      debug: {
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      }
    })
    
  } catch (error: any) {
    console.error('Debug check user error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Error checking user',
      error: error.message 
    }, { status: 500 })
  }
}