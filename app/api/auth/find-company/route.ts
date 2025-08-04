// app/api/auth/find-company/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body
    
    if (!email) {
      return NextResponse.json({
        success: false,
        message: 'กรุณากรอกอีเมล'
      }, { status: 400 })
    }
    
    // Find user by email
    const usersSnapshot = await adminDb
      .collection('users')
      .where('email', '==', email)
      .where('isActive', '==', true)
      .limit(1)
      .get()
    
    if (usersSnapshot.empty) {
      return NextResponse.json({
        success: false,
        message: 'ไม่พบบัญชีผู้ใช้ในระบบ'
      }, { status: 404 })
    }
    
    const userData = usersSnapshot.docs[0].data()
    const companyId = userData.companyId
    
    // Get company info
    const companyDoc = await adminDb.collection('companies').doc(companyId).get()
    
    if (!companyDoc.exists) {
      return NextResponse.json({
        success: false,
        message: 'ไม่พบข้อมูลบริษัท'
      }, { status: 404 })
    }
    
    const companyData = companyDoc.data()
    
    if (!companyData?.isActive) {
      return NextResponse.json({
        success: false,
        message: 'บริษัทถูกระงับการใช้งาน'
      }, { status: 403 })
    }
    
    return NextResponse.json({
      success: true,
      companySlug: companyData.slug,
      companyName: companyData.name
    })
    
  } catch (error: any) {
    console.error('Find company error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการค้นหาบริษัท',
      error: error.message
    }, { status: 500 })
  }
}