// app/api/products/route.ts
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

// GET - List products with better performance
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
    const brandId = searchParams.get('brandId') || searchParams.get('brand')
    const search = searchParams.get('search') || ''
    
    // Start parallel queries
    const productsPromise = adminDb.collection('products')
      .where('companyId', '==', session.companyId)
      .orderBy('name', 'asc')
      .get()
    
    const brandsPromise = adminDb.collection('brands')
      .where('companyId', '==', session.companyId)
      .get()
    
    // Execute queries in parallel
    const [productsSnapshot, brandsSnapshot] = await Promise.all([
      productsPromise,
      brandsPromise
    ])
    
    // Create brands map for quick lookup
    const brandsMap = new Map()
    brandsSnapshot.docs.forEach(doc => {
      brandsMap.set(doc.id, doc.data().name)
    })
    
    // Process products
    let products = await Promise.all(
      productsSnapshot.docs.map(async (doc) => {
        const data = doc.data()
        
        // Skip if brand filter doesn't match
        if (brandId && data.brandId !== brandId) {
          return null
        }
        
        // Get warranty count in the background
        const warrantyCountPromise = adminDb
          .collection('warranties')
          .where('companyId', '==', session.companyId)
          .where('productId', '==', doc.id)
          .count()
          .get()
        
        const warrantyCount = await warrantyCountPromise
        const createdAt = data.createdAt?.toDate?.() || data.createdAt || new Date()
        
        return {
          id: doc.id,
          name: data.name,
          model: data.model || '',
          brandId: data.brandId,
          brandName: brandsMap.get(data.brandId) || 'Unknown',
          description: data.description || '',
          image: data.image || '',
          warrantyYears: data.warrantyYears || 0,
          warrantyMonths: data.warrantyMonths || 0,
          requiredFields: data.requiredFields || {
            serialNumber: true,
            receiptImage: true,
            purchaseLocation: false
          },
          companyId: data.companyId,
          isActive: data.isActive !== false,
          createdAt: createdAt instanceof Date ? createdAt.toISOString() : createdAt,
          createdBy: data.createdBy,
          warrantyCount: warrantyCount.data().count
        }
      })
    )
    
    // Filter out nulls from brand filtering
    products = products.filter(p => p !== null)
    
    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase()
      products = products.filter(product => 
        product.name.toLowerCase().includes(searchLower) ||
        product.model.toLowerCase().includes(searchLower) ||
        product.brandName?.toLowerCase().includes(searchLower)
      )
    }
    
    // Set cache headers for better performance
    const headers = {
      'Cache-Control': 'private, max-age=10, stale-while-revalidate=60',
    }
    
    return NextResponse.json({
      success: true,
      data: products,
      count: products.length
    }, { headers })
    
  } catch (error: any) {
    console.error('Error fetching products:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    }, { status: 500 })
  }
}

// POST - Create product (unchanged)
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
    const brandId = formData.get('brandId') as string
    const name = formData.get('name') as string
    const model = formData.get('model') as string || ''
    const warrantyYears = parseInt(formData.get('warrantyYears') as string) || 0
    const warrantyMonths = parseInt(formData.get('warrantyMonths') as string) || 0
    const description = formData.get('description') as string
    const requiredFieldsStr = formData.get('requiredFields') as string
    const imageFile = formData.get('image') as File | null
    
    // Validate required fields
    if (!brandId || !name) {
      return NextResponse.json({
        success: false,
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน'
      }, { status: 400 })
    }
    
    // Parse required fields
    let requiredFields = {
      serialNumber: true,
      receiptImage: true,
      purchaseLocation: false
    }
    
    try {
      if (requiredFieldsStr) {
        requiredFields = JSON.parse(requiredFieldsStr)
      }
    } catch (error) {
      console.error('Error parsing required fields:', error)
    }
    
    // Verify brand belongs to company
    const brandDoc = await adminDb.collection('brands').doc(brandId).get()
    if (!brandDoc.exists || brandDoc.data()?.companyId !== session.companyId) {
      return NextResponse.json({
        success: false,
        message: 'Invalid brand selection'
      }, { status: 400 })
    }
    
    // Check if product name+model already exists for this brand
    const existingProduct = await adminDb.collection('products')
      .where('companyId', '==', session.companyId)
      .where('brandId', '==', brandId)
      .where('name', '==', name)
      .where('model', '==', model)
      .get()
    
    if (!existingProduct.empty) {
      return NextResponse.json({
        success: false,
        message: 'มีสินค้ารุ่นนี้อยู่แล้ว'
      }, { status: 400 })
    }
    
    // Upload image if provided
    let imageUrl = ''
    if (imageFile && imageFile.size > 0) {
      try {
        const bucket = adminStorage.bucket()
        const fileName = `products/${session.companyId}/${generateId()}-${imageFile.name}`
        const file = bucket.file(fileName)
        
        const arrayBuffer = await imageFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        
        await file.save(buffer, {
          metadata: {
            contentType: imageFile.type,
          },
        })
        
        await file.makePublic()
        imageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`
        
      } catch (uploadError) {
        console.error('Image upload error:', uploadError)
      }
    }
    
    // Create product document
    const productId = generateId()
    const productData = {
      companyId: session.companyId,
      brandId,
      name,
      model,
      warrantyYears,
      warrantyMonths,
      requiredFields,
      description: description || '',
      image: imageUrl,
      isActive: true,
      createdAt: new Date(),
      createdBy: session.userId
    }
    
    await adminDb.collection('products').doc(productId).set(productData)
    
    return NextResponse.json({
      success: true,
      message: 'เพิ่มสินค้าสำเร็จ',
      data: {
        id: productId,
        ...productData
      }
    })
    
  } catch (error: any) {
    console.error('Error creating product:', error)
    return NextResponse.json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการเพิ่มสินค้า',
      error: error.message
    }, { status: 500 })
  }
}