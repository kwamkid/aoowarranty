// app/api/test-firebase/route.ts
import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function GET() {
  try {
    // ทดสอบการเชื่อมต่อ Firebase Admin
    const companiesRef = adminDb.collection('companies')
    const snapshot = await companiesRef.limit(5).get()
    
    const companies = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    // ทดสอบการสร้างข้อมูล
    const testDoc = await companiesRef.add({
      name: 'API Test Company',
      slug: 'api-test-company',
      email: 'api-test@example.com',
      phone: '02-999-9999',
      isActive: true,
      createdAt: new Date(),
      createdBy: 'api-test'
    })

    return NextResponse.json({
      success: true,
      message: 'Firebase Admin SDK working correctly!',
      data: {
        companiesCount: snapshot.size,
        companies,
        newDocId: testDoc.id
      }
    })

  } catch (error: any) {
    console.error('Firebase Admin SDK Error:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Firebase Admin SDK connection failed'
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // สร้าง Super Admin
    if (body.action === 'create-super-admin') {
      const superAdminsRef = adminDb.collection('superAdmins')
      
      const superAdmin = {
        email: body.email || 'admin@warrantyhub.com',
        name: body.name || 'Super Administrator',
        isActive: true,
        permissions: ['all'],
        createdAt: new Date()
      }
      
      const docRef = await superAdminsRef.add(superAdmin)
      
      return NextResponse.json({
        success: true,
        message: 'Super Admin created successfully!',
        data: {
          id: docRef.id,
          ...superAdmin
        }
      })
    }
    
    return NextResponse.json({
      success: false,
      message: 'Invalid action'
    }, { status: 400 })
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}