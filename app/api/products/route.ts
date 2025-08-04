// app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { adminDb, adminStorage } from '@/lib/firebase-admin'
import { cookies } from 'next/headers'
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

// GET - List products
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
    const brandId = searchParams.get('brandId')
    const search = searchParams.get('search') || ''
    
    // Get products for this company
    let query = adminDb.collection('products')
      .where('companyId', '==', session.companyId)
      .orderBy('name', 'asc')
    
    // Filter by brand if specified
    if (brandId) {
      query = query.where('brandId', '==', brandId)
    }
    
    const snapshot = await query.get()
    
    // Get brands for mapping
    const brandsSnapshot = await adminDb.collection('brands')
      .where('companyId', '==', session.companyId)
      .get()
    
    const brandsMap = new Map()
    brandsSnapshot.docs.forEach(doc => {
      brandsMap.set(doc.id, doc.data().name)
    })
    
    interface ProductData {
      id: string
      name: string
      model: string
      brandId: string
      brandName?: string
      description?: string
      image?: string
      warrantyYears: number
      warrantyMonths: number
      requiredFields: any
      companyId: string
      isActive: boolean
      createdAt: any
      createdBy: string
    }
    
    let products: ProductData[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      brandName: brandsMap.get(doc.data().brandId)
    } as ProductData))
    
    // Filter by search term
    if (search) {
      products = products.filter(product => 
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.model.toLowerCase().includes(search.toLowerCase()) ||
        product.brandName?.toLowerCase().includes(search.toLowerCase())
      )
    }
    
    return NextResponse.json({
      success: true,
      data: products
    })
    
  } catch (error: any) {
    console.error('Error fetching products:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    }, { status: 500 })
  }
}

// POST - Create product
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
    const model = formData.get('model') as string || '' // ทำให้ model เป็น optional
    const warrantyYears = parseInt(formData.get('warrantyYears') as string) || 0
    const warrantyMonths = parseInt(formData.get('warrantyMonths') as string) || 0
    const description = formData.get('description') as string
    const requiredFieldsStr = formData.get('requiredFields') as string
    const imageFile = formData.get('image') as File | null
    
    // Validate required fields (ลบ model ออกจาก validation)
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