// app/api/brands/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { adminDb, adminStorage } from '@/lib/firebase-admin'
import { headers, cookies } from 'next/headers'
import { generateId } from '@/lib/utils'

// Get auth session
async function getAuthSession() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('auth-session')
  
  if (!sessionCookie) return null
  
  try {
    return JSON.parse(sessionCookie.value)
  } catch {
    return null
  }
}

// GET - List brands
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    
    // Get brands for this company
    let query = adminDb.collection('brands')
      .where('companyId', '==', session.companyId)
      .orderBy('name', 'asc')
    
    const snapshot = await query.get()
    
    interface BrandData {
      id: string
      name: string
      description?: string
      logo?: string
      companyId: string
      isActive: boolean
      createdAt: any
      createdBy: string
    }
    
    let brands: BrandData[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as BrandData))
    
    // Filter by search term
    if (search) {
      brands = brands.filter(brand => 
        brand.name.toLowerCase().includes(search.toLowerCase()) ||
        brand.description?.toLowerCase().includes(search.toLowerCase())
      )
    }
    
    return NextResponse.json({
      success: true,
      data: brands
    })
    
  } catch (error: any) {
    console.error('Error fetching brands:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch brands',
      error: error.message
    }, { status: 500 })
  }
}

// POST - Create brand
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 })
    }
    
    const formData = await request.formData()
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const logoFile = formData.get('logo') as File | null
    
    // Validate required fields
    if (!name) {
      return NextResponse.json({
        success: false,
        message: 'ชื่อแบรนด์เป็นข้อมูลที่จำเป็น'
      }, { status: 400 })
    }
    
    // Check if brand name already exists
    const existingBrand = await adminDb.collection('brands')
      .where('companyId', '==', session.companyId)
      .where('name', '==', name)
      .get()
    
    if (!existingBrand.empty) {
      return NextResponse.json({
        success: false,
        message: 'มีแบรนด์ชื่อนี้อยู่แล้ว'
      }, { status: 400 })
    }
    
    // Upload logo if provided
    let logoUrl = ''
    if (logoFile && logoFile.size > 0) {
      try {
        const bucket = adminStorage.bucket()
        const fileName = `brands/${session.companyId}/${generateId()}-${logoFile.name}`
        const file = bucket.file(fileName)
        
        const arrayBuffer = await logoFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        
        await file.save(buffer, {
          metadata: {
            contentType: logoFile.type,
          },
        })
        
        await file.makePublic()
        logoUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`
        
      } catch (uploadError) {
        console.error('Logo upload error:', uploadError)
      }
    }
    
    // Create brand document
    const brandId = generateId()
    const brandData = {
      companyId: session.companyId,
      name,
      description: description || '',
      logo: logoUrl,
      isActive: true,
      createdAt: new Date(),
      createdBy: session.userId
    }
    
    await adminDb.collection('brands').doc(brandId).set(brandData)
    
    return NextResponse.json({
      success: true,
      message: 'เพิ่มแบรนด์สำเร็จ',
      data: {
        id: brandId,
        ...brandData
      }
    })
    
  } catch (error: any) {
    console.error('Error creating brand:', error)
    return NextResponse.json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการเพิ่มแบรนด์',
      error: error.message
    }, { status: 500 })
  }
}