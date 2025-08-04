// app/api/brands/[id]/route.ts
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

// GET - Get single brand
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 })
    }
    
    const brandId = params.id
    
    // Get brand document
    const brandDoc = await adminDb.collection('brands').doc(brandId).get()
    
    if (!brandDoc.exists) {
      return NextResponse.json({
        success: false,
        message: 'Brand not found'
      }, { status: 404 })
    }
    
    const brandData = brandDoc.data()
    
    // Check if data exists
    if (!brandData) {
      return NextResponse.json({
        success: false,
        message: 'Brand data not found'  
      }, { status: 404 })
    }
    
    // Verify company access
    if (brandData?.companyId !== session.companyId) {
      return NextResponse.json({
        success: false,
        message: 'Access denied'
      }, { status: 403 })
    }
    
    return NextResponse.json({
      success: true,
      data: {
        id: brandDoc.id,
        ...brandData
      }
    })
    
  } catch (error: any) {
    console.error('Error fetching brand:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch brand',
      error: error.message
    }, { status: 500 })
  }
}

// PUT - Update brand
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 })
    }
    
    const brandId = params.id
    const formData = await request.formData()
    
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const isActive = formData.get('isActive') === 'true'
    const logoFile = formData.get('logo') as File | null
    const removeLogo = formData.get('removeLogo') === 'true'
    
    // Validate required fields
    if (!name) {
      return NextResponse.json({
        success: false,
        message: 'ชื่อแบรนด์เป็นข้อมูลที่จำเป็น'
      }, { status: 400 })
    }
    
    // Get existing brand
    const brandDoc = await adminDb.collection('brands').doc(brandId).get()
    if (!brandDoc.exists) {
      return NextResponse.json({
        success: false,
        message: 'Brand not found'
      }, { status: 404 })
    }
    
    const existingData = brandDoc.data()
    if (!existingData) {
      return NextResponse.json({
        success: false,
        message: 'Brand data not found'
      }, { status: 404 })
    }
    
    // Verify company access
    if (existingData?.companyId !== session.companyId) {
      return NextResponse.json({
        success: false,
        message: 'Access denied'
      }, { status: 403 })
    }
    
    // Check if name already exists (excluding current brand)
    const duplicateCheck = await adminDb.collection('brands')
      .where('companyId', '==', session.companyId)
      .where('name', '==', name)
      .get()
    
    const isDuplicate = duplicateCheck.docs.some(doc => doc.id !== brandId)
    if (isDuplicate) {
      return NextResponse.json({
        success: false,
        message: 'มีแบรนด์ชื่อนี้อยู่แล้ว'
      }, { status: 400 })
    }
    
    // Handle logo
    let logoUrl = existingData.logo || ''
    
    if (removeLogo) {
      // Delete old logo from storage
      if (logoUrl) {
        try {
          const oldFileName = logoUrl.split('/').pop()
          if (oldFileName) {
            await adminStorage.bucket().file(`brands/${session.companyId}/${oldFileName}`).delete()
          }
        } catch (error) {
          console.error('Error deleting old logo:', error)
        }
      }
      logoUrl = ''
    } else if (logoFile && logoFile.size > 0) {
      // Upload new logo
      try {
        const bucket = adminStorage.bucket()
        const fileName = `brands/${session.companyId}/${Date.now()}-${logoFile.name}`
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
        
        // Delete old logo
        if (existingData.logo) {
          try {
            const oldFileName = existingData.logo.split('/').pop()
            if (oldFileName) {
              await bucket.file(`brands/${session.companyId}/${oldFileName}`).delete()
            }
          } catch (error) {
            console.error('Error deleting old logo:', error)
          }
        }
      } catch (uploadError) {
        console.error('Logo upload error:', uploadError)
      }
    }
    
    // Update brand
    const updateData = {
      name,
      description: description || '',
      logo: logoUrl,
      isActive,
      updatedAt: new Date(),
      updatedBy: session.userId
    }
    
    await adminDb.collection('brands').doc(brandId).update(updateData)
    
    return NextResponse.json({
      success: true,
      message: 'แก้ไขแบรนด์สำเร็จ',
      data: {
        id: brandId,
        ...existingData,
        ...updateData
      }
    })
    
  } catch (error: any) {
    console.error('Error updating brand:', error)
    return NextResponse.json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการแก้ไขแบรนด์',
      error: error.message
    }, { status: 500 })
  }
}

    // Delete - Delete brand
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 })
    }
    
    const brandId = params.id
    
    // Get brand document
    const brandDoc = await adminDb.collection('brands').doc(brandId).get()
    
    if (!brandDoc.exists) {
      return NextResponse.json({
        success: false,
        message: 'Brand not found'
      }, { status: 404 })
    }
    
    const brandData = brandDoc.data()
    if (!brandData) {
      return NextResponse.json({
        success: false,
        message: 'Brand data not found'
      }, { status: 404 })
    }
    
    // Verify company access
    if (brandData?.companyId !== session.companyId) {
      return NextResponse.json({
        success: false,
        message: 'Access denied'
      }, { status: 403 })
    }
    
    // Check if brand has products
    const productsCount = await adminDb.collection('products')
      .where('companyId', '==', session.companyId)
      .where('brandId', '==', brandId)
      .count()
      .get()
    
    if (productsCount.data().count > 0) {
      return NextResponse.json({
        success: false,
        message: 'ไม่สามารถลบแบรนด์ที่มีสินค้าอยู่'
      }, { status: 400 })
    }
    
    // Delete logo from storage
    if (brandData.logo) {
      try {
        const fileName = brandData.logo.split('/').pop()
        if (fileName) {
          await adminStorage.bucket().file(`brands/${session.companyId}/${fileName}`).delete()
        }
      } catch (error) {
        console.error('Error deleting logo:', error)
      }
    }
    
    // Delete brand document
    await adminDb.collection('brands').doc(brandId).delete()
    
    return NextResponse.json({
      success: true,
      message: 'ลบแบรนด์สำเร็จ'
    })
    
  } catch (error: any) {
    console.error('Error deleting brand:', error)
    return NextResponse.json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการลบแบรนด์',
      error: error.message
    }, { status: 500 })
  }
}