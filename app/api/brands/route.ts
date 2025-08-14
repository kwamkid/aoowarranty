// app/api/brands/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { adminDb, adminStorage } from '@/lib/firebase-admin'
import { cookies } from 'next/headers'
import { generateId } from '@/lib/utils'

// Get auth session with better error handling
async function getAuthSession() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('auth-session')
    
    if (!sessionCookie?.value) return null
    
    return JSON.parse(sessionCookie.value)
  } catch (error) {
    console.error('Session parse error:', error)
    return null
  }
}

// GET - List brands with product counts
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
    const brandsSnapshot = await adminDb.collection('brands')
      .where('companyId', '==', session.companyId)
      .orderBy('name', 'asc')
      .get()
    
    // Get all products for counting (more efficient than individual counts)
    const productsSnapshot = await adminDb.collection('products')
      .where('companyId', '==', session.companyId)
      .select('brandId') // Only get brandId field to reduce data transfer
      .get()
    
    // Count products per brand
    const productCounts = new Map<string, number>()
    productsSnapshot.docs.forEach(doc => {
      const brandId = doc.data().brandId
      productCounts.set(brandId, (productCounts.get(brandId) || 0) + 1)
    })
    
    // Process brands
    let brands = brandsSnapshot.docs.map(doc => {
      const data = doc.data()
      const createdAt = data.createdAt?.toDate?.() || data.createdAt || new Date()
      
      return {
        id: doc.id,
        name: data.name,
        description: data.description || '',
        logo: data.logo || '',
        companyId: data.companyId,
        isActive: data.isActive !== false,
        createdAt: createdAt instanceof Date ? createdAt.toISOString() : createdAt,
        createdBy: data.createdBy || '',
        productCount: productCounts.get(doc.id) || 0
      }
    })
    
    // Filter by search term
    if (search) {
      const searchLower = search.toLowerCase()
      brands = brands.filter(brand => 
        brand.name.toLowerCase().includes(searchLower) ||
        brand.description?.toLowerCase().includes(searchLower)
      )
    }
    
    // Set cache headers
    const headers = {
      'Cache-Control': 'private, max-age=60, stale-while-revalidate=300',
    }
    
    return NextResponse.json({
      success: true,
      data: brands,
      count: brands.length
    }, { headers })
    
  } catch (error: any) {
    console.error('Error fetching brands:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch brands',
      error: error.message
    }, { status: 500 })
  }
}

// POST - Create brand (unchanged)
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
        ...brandData,
        productCount: 0 // New brand has no products
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