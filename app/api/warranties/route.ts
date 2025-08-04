// app/api/warranties/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { adminDb, adminStorage } from '@/lib/firebase-admin'
import { cookies } from 'next/headers'
import { generateId } from '@/lib/utils'

// Get customer session
async function getCustomerSession() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('line-session')
  
  if (!sessionCookie) return null
  
  try {
    return JSON.parse(sessionCookie.value)
  } catch {
    return null
  }
}

// GET - List warranties for customer
export async function GET(request: NextRequest) {
  try {
    const session = await getCustomerSession()
    if (!session) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 })
    }
    
    // Get warranties for this customer
    const warrantiesSnapshot = await adminDb
      .collection('warranties')
      .where('customerId', '==', session.customerId)
      .orderBy('registrationDate', 'desc')
      .get()
    
    const warranties = warrantiesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    return NextResponse.json({
      success: true,
      data: warranties
    })
    
  } catch (error: any) {
    console.error('Error fetching warranties:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch warranties',
      error: error.message
    }, { status: 500 })
  }
}

// POST - Create new warranty registration
export async function POST(request: NextRequest) {
  try {
    const session = await getCustomerSession()
    if (!session) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 })
    }
    
    const formData = await request.formData()
    const warrantyDataStr = formData.get('warrantyData') as string
    const receiptFile = formData.get('receipt') as File | null
    
    if (!warrantyDataStr) {
      return NextResponse.json({
        success: false,
        message: 'Invalid request data'
      }, { status: 400 })
    }
    
    const warrantyData = JSON.parse(warrantyDataStr)
    
    // Get product details
    const productDoc = await adminDb.collection('products').doc(warrantyData.productId).get()
    if (!productDoc.exists) {
      return NextResponse.json({
        success: false,
        message: 'Product not found'
      }, { status: 404 })
    }
    
    const product = productDoc.data()!
    
    // Get brand details
    const brandDoc = await adminDb.collection('brands').doc(product.brandId).get()
    const brand = brandDoc.data()!
    
    // Upload receipt if provided
    let receiptUrl = ''
    if (receiptFile && receiptFile.size > 0) {
      try {
        const bucket = adminStorage.bucket()
        const fileName = `warranties/${warrantyData.companyId}/${generateId()}-${receiptFile.name}`
        const file = bucket.file(fileName)
        
        const arrayBuffer = await receiptFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        
        await file.save(buffer, {
          metadata: {
            contentType: receiptFile.type,
          },
        })
        
        await file.makePublic()
        receiptUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`
        
      } catch (uploadError) {
        console.error('Receipt upload error:', uploadError)
      }
    }
    
    // Create warranty document
    const warrantyId = generateId()
    const warranty = {
      companyId: warrantyData.companyId,
      productId: warrantyData.productId,
      
      // Customer data
      customerId: session.customerId,
      customerInfo: {
        name: warrantyData.customerName,
        lineDisplayName: session.displayName,
        phone: warrantyData.phone,
        email: warrantyData.email || '',
        
        // Address
        address: warrantyData.address,
        district: warrantyData.district,
        amphoe: warrantyData.amphoe,
        province: warrantyData.province,
        postcode: warrantyData.postcode
      },
      
      // Product data
      productInfo: {
        brandName: brand.name,
        productName: product.name,
        model: product.model || '',
        serialNumber: warrantyData.serialNumber || '',
        purchaseLocation: warrantyData.purchaseLocation || ''
      },
      
      // Purchase data
      purchaseDate: warrantyData.purchaseDate,
      warrantyStartDate: warrantyData.purchaseDate,
      warrantyExpiry: warrantyData.warrantyExpiry,
      
      // Documents
      receiptImage: receiptUrl,
      
      // Status
      status: 'active',
      registrationDate: new Date(),
      
      // Additional
      notes: warrantyData.notes || '',
      claimHistory: []
    }
    
    await adminDb.collection('warranties').doc(warrantyId).set(warranty)
    
    // Update customer's warranty list
    await adminDb.collection('customers').doc(session.customerId).update({
      warranties: adminDb.FieldValue.arrayUnion(warrantyId)
    })
    
    // Update company stats
    await adminDb.collection('companies').doc(warrantyData.companyId).update({
      totalWarranties: adminDb.FieldValue.increment(1)
    })
    
    return NextResponse.json({
      success: true,
      message: 'ลงทะเบียนประกันสำเร็จ',
      data: {
        id: warrantyId,
        ...warranty
      }
    })
    
  } catch (error: any) {
    console.error('Error creating warranty:', error)
    return NextResponse.json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการลงทะเบียน',
      error: error.message
    }, { status: 500 })
  }
}