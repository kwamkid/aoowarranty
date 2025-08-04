// app/api/companies/settings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { adminDb, adminStorage } from '@/lib/firebase-admin'
import { cookies } from 'next/headers'

// Update company settings
export async function PUT(request: NextRequest) {
  try {
    // Get auth session
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('auth-session')
    
    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const session = JSON.parse(sessionCookie.value)
    
    // Check if user is owner/admin
    if (!['owner', 'admin'].includes(session.role)) {
      return NextResponse.json(
        { success: false, message: 'ไม่มีสิทธิ์แก้ไขข้อมูล' },
        { status: 403 }
      )
    }
    
    // Get form data
    const formData = await request.formData()
    
    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
      updatedBy: session.userId
    }
    
    // Text fields
    const textFields = [
      'name', 'address', 'district', 'amphoe', 
      'province', 'postcode', 'phone', 'email', 
      'website', 'lineChannelId'
    ]
    
    for (const field of textFields) {
      const value = formData.get(field)
      if (value !== null) {
        updateData[field] = value.toString()
      }
    }
    
    // Handle logo upload
    const logoFile = formData.get('logo') as File | null
    const removeLogo = formData.get('removeLogo') === 'true'
    
    if (logoFile && logoFile.size > 0) {
      // Upload new logo
      const fileName = `companies/${session.companyId}/logo_${Date.now()}.${logoFile.name.split('.').pop()}`
      const bucket = adminStorage.bucket()
      const file = bucket.file(fileName)
      
      // Convert File to Buffer
      const arrayBuffer = await logoFile.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      
      // Upload to Firebase Storage
      await file.save(buffer, {
        metadata: {
          contentType: logoFile.type,
          metadata: {
            firebaseStorageDownloadTokens: Date.now().toString()
          }
        }
      })
      
      // Make file public
      await file.makePublic()
      
      // Get public URL
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`
      updateData.logo = publicUrl
      
      // Delete old logo if exists
      const companyDoc = await adminDb.collection('companies').doc(session.companyId).get()
      const oldLogo = companyDoc.data()?.logo
      
      if (oldLogo && oldLogo.includes('storage.googleapis.com')) {
        try {
          const oldFileName = oldLogo.split('/').pop()
          if (oldFileName) {
            const oldFile = bucket.file(`companies/${session.companyId}/${oldFileName}`)
            await oldFile.delete().catch(() => {})
          }
        } catch (error) {
          console.error('Error deleting old logo:', error)
        }
      }
    } else if (removeLogo) {
      // Remove logo
      updateData.logo = ''
      
      // Delete logo file if exists
      const companyDoc = await adminDb.collection('companies').doc(session.companyId).get()
      const oldLogo = companyDoc.data()?.logo
      
      if (oldLogo && oldLogo.includes('storage.googleapis.com')) {
        try {
          const oldFileName = oldLogo.split('/').pop()
          if (oldFileName) {
            const bucket = adminStorage.bucket()
            const oldFile = bucket.file(`companies/${session.companyId}/${oldFileName}`)
            await oldFile.delete().catch(() => {})
          }
        } catch (error) {
          console.error('Error deleting logo:', error)
        }
      }
    }
    
    // Update company document
    await adminDb.collection('companies').doc(session.companyId).update(updateData)
    
    // Get updated data
    const updatedDoc = await adminDb.collection('companies').doc(session.companyId).get()
    const updatedData = updatedDoc.data()
    
    return NextResponse.json({
      success: true,
      message: 'บันทึกการตั้งค่าสำเร็จ',
      data: {
        logo: updatedData?.logo || ''
      }
    })
    
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' },
      { status: 500 }
    )
  }
}