// app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { adminDb, adminStorage } from '@/lib/firebase-admin'
import { cookies } from 'next/headers'

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

interface RouteParams {
  params: { id: string }
}

// GET - Get single product
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 })
    }
    
    const productId = params.id
    
    // Get product document
    const productDoc = await adminDb.collection('products').doc(productId).get()
    
    if (!productDoc.exists) {
      return NextResponse.json({
        success: false,
        message: 'Product not found'
      }, { status: 404 })
    }
    
    const productData = productDoc.data()
    
    // Check if data exists
    if (!productData) {
      return NextResponse.json({
        success: false,
        message: 'Product data not found'  
      }, { status: 404 })
    }
    
    // Verify company access
    if (productData?.companyId !== session.companyId) {
      return NextResponse.json({
        success: false,
        message: 'Access denied'
      }, { status: 403 })
    }
    
    // Get brand name
    const brandDoc = await adminDb.collection('brands').doc(productData.brandId).get()
    const brandName = brandDoc.exists ? brandDoc.data()?.name : 'Unknown'
    
    return NextResponse.json({
      success: true,
      data: {
        id: productDoc.id,
        ...productData,
        brandName
      }
    })
    
  } catch (error: any) {
    console.error('Error fetching product:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message
    }, { status: 500 })
  }
}

// PUT - Update product
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 })
    }
    
    const productId = params.id
    const formData = await request.formData()
    
    const brandId = formData.get('brandId') as string
    const name = formData.get('name') as string
    const model = formData.get('model') as string || '' // ทำให้ model เป็น optional
    const warrantyYears = parseInt(formData.get('warrantyYears') as string) || 0
    const warrantyMonths = parseInt(formData.get('warrantyMonths') as string) || 0
    const description = formData.get('description') as string
    const isActive = formData.get('isActive') === 'true'
    const requiredFieldsStr = formData.get('requiredFields') as string
    const imageFile = formData.get('image') as File | null
    const removeImage = formData.get('removeImage') === 'true'
    
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
    
    // Get existing product
    const productDoc = await adminDb.collection('products').doc(productId).get()
    if (!productDoc.exists) {
      return NextResponse.json({
        success: false,
        message: 'Product not found'
      }, { status: 404 })
    }
    
    const existingData = productDoc.data()
    if (!existingData) {
      return NextResponse.json({
        success: false,
        message: 'Product data not found'
      }, { status: 404 })
    }
    
    // Verify company access
    if (existingData?.companyId !== session.companyId) {
      return NextResponse.json({
        success: false,
        message: 'Access denied'
      }, { status: 403 })
    }
    
    // Verify brand belongs to company
    const brandDoc = await adminDb.collection('brands').doc(brandId).get()
    if (!brandDoc.exists || brandDoc.data()?.companyId !== session.companyId) {
      return NextResponse.json({
        success: false,
        message: 'Invalid brand selection'
      }, { status: 400 })
    }
    
    // Check if product name+model already exists (excluding current product)
    const duplicateCheck = await adminDb.collection('products')
      .where('companyId', '==', session.companyId)
      .where('brandId', '==', brandId)
      .where('name', '==', name)
      .where('model', '==', model)
      .get()
    
    const isDuplicate = duplicateCheck.docs.some(doc => doc.id !== productId)
    if (isDuplicate) {
      return NextResponse.json({
        success: false,
        message: 'มีสินค้ารุ่นนี้อยู่แล้ว'
      }, { status: 400 })
    }
    
    // Handle image
    let imageUrl = existingData.image || ''
    
    if (removeImage) {
      // Delete old image from storage
      if (imageUrl) {
        try {
          const oldFileName = imageUrl.split('/').pop()
          if (oldFileName) {
            await adminStorage.bucket().file(`products/${session.companyId}/${oldFileName}`).delete()
          }
        } catch (error) {
          console.error('Error deleting old image:', error)
        }
      }
      imageUrl = ''
    } else if (imageFile && imageFile.size > 0) {
      // Upload new image
      try {
        const bucket = adminStorage.bucket()
        const fileName = `products/${session.companyId}/${Date.now()}-${imageFile.name}`
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
        
        // Delete old image
        if (existingData.image) {
          try {
            const oldFileName = existingData.image.split('/').pop()
            if (oldFileName) {
              await bucket.file(`products/${session.companyId}/${oldFileName}`).delete()
            }
          } catch (error) {
            console.error('Error deleting old image:', error)
          }
        }
      } catch (uploadError) {
        console.error('Image upload error:', uploadError)
      }
    }
    
    // Update product
    const updateData = {
      brandId,
      name,
      model,
      warrantyYears,
      warrantyMonths,
      requiredFields,
      description: description || '',
      image: imageUrl,
      isActive,
      updatedAt: new Date(),
      updatedBy: session.userId
    }
    
    await adminDb.collection('products').doc(productId).update(updateData)
    
    return NextResponse.json({
      success: true,
      message: 'แก้ไขสินค้าสำเร็จ',
      data: {
        id: productId,
        ...existingData,
        ...updateData
      }
    })
    
  } catch (error: any) {
    console.error('Error updating product:', error)
    return NextResponse.json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการแก้ไขสินค้า',
      error: error.message
    }, { status: 500 })
  }
}

// DELETE - Delete product
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 })
    }
    
    const productId = params.id
    
    // Get product document
    const productDoc = await adminDb.collection('products').doc(productId).get()
    
    if (!productDoc.exists) {
      return NextResponse.json({
        success: false,
        message: 'Product not found'
      }, { status: 404 })
    }
    
    const productData = productDoc.data()
    if (!productData) {
      return NextResponse.json({
        success: false,
        message: 'Product data not found'
      }, { status: 404 })
    }
    
    // Verify company access
    if (productData?.companyId !== session.companyId) {
      return NextResponse.json({
        success: false,
        message: 'Access denied'
      }, { status: 403 })
    }
    
    // Check if product has warranties
    const warrantiesCount = await adminDb.collection('warranties')
      .where('companyId', '==', session.companyId)
      .where('productId', '==', productId)
      .count()
      .get()
    
    if (warrantiesCount.data().count > 0) {
      return NextResponse.json({
        success: false,
        message: 'ไม่สามารถลบสินค้าที่มีการลงทะเบียนประกันแล้ว'
      }, { status: 400 })
    }
    
    // Delete image from storage
    if (productData.image) {
      try {
        const fileName = productData.image.split('/').pop()
        if (fileName) {
          await adminStorage.bucket().file(`products/${session.companyId}/${fileName}`).delete()
        }
      } catch (error) {
        console.error('Error deleting image:', error)
      }
    }
    
    // Delete product document
    await adminDb.collection('products').doc(productId).delete()
    
    return NextResponse.json({
      success: true,
      message: 'ลบสินค้าสำเร็จ'
    })
    
  } catch (error: any) {
    console.error('Error deleting product:', error)
    return NextResponse.json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการลบสินค้า',
      error: error.message
    }, { status: 500 })
  }
}