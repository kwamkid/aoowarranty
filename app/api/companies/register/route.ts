// app/api/companies/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { adminDb, adminStorage } from '@/lib/firebase-admin'
import { generateId, createSlug, isValidSlug } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const companyDataStr = formData.get('companyData') as string
    const logoFile = formData.get('logo') as File | null

    if (!companyDataStr) {
      return NextResponse.json({
        success: false,
        message: 'ข้อมูลบริษัทไม่ถูกต้อง'
      }, { status: 400 })
    }

    const companyData = JSON.parse(companyDataStr)
    
    // Validate required fields
    const requiredFields = ['name', 'email', 'phone', 'address', 'district', 'amphoe', 'province', 'postcode', 'adminName', 'adminPassword']
    for (const field of requiredFields) {
      if (!companyData[field]) {
        return NextResponse.json({
          success: false,
          message: `กรุณากรอก ${field}`
        }, { status: 400 })
      }
    }

    // Validate admin password strength
    const { adminPassword } = companyData
    if (adminPassword.length < 8) {
      return NextResponse.json({
        success: false,
        message: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'
      }, { status: 400 })
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(adminPassword)) {
      return NextResponse.json({
        success: false,
        message: 'รหัสผ่านต้องมีตัวอักษรเล็ก ใหญ่ และตัวเลข'
      }, { status: 400 })
    }

    // Check if company name or slug already exists
    const slug = companyData.slug || createSlug(companyData.name)
    
    // Validate slug format
    if (!slug || slug.length < 3 || slug.length > 50 || !/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json({
        success: false,
        message: 'ชื่อเว็บไซต์ไม่ถูกต้อง กรุณาใช้ตัวอังกฤษเล็ก ตัวเลข และ - เท่านั้น (3-50 ตัวอักษร)'
      }, { status: 400 })
    }
    
    const companiesRef = adminDb.collection('companies')
    
    const existingBySlug = await companiesRef.where('slug', '==', slug).get()
    if (!existingBySlug.empty) {
      return NextResponse.json({
        success: false,
        message: 'ชื่อบริษัทนี้ถูกใช้งานแล้ว กรุณาเปลี่ยนชื่อ'
      }, { status: 400 })
    }

    const existingByEmail = await companiesRef.where('email', '==', companyData.email).get()
    if (!existingByEmail.empty) {
      return NextResponse.json({
        success: false,
        message: 'อีเมลนี้ถูกใช้งานแล้ว'
      }, { status: 400 })
    }

    // Check if admin email already exists (using same email as company)
    const usersRef = adminDb.collection('users')
    const existingAdminEmail = await usersRef.where('email', '==', companyData.email).get()
    if (!existingAdminEmail.empty) {
      return NextResponse.json({
        success: false,
        message: 'อีเมลนี้ถูกใช้งานแล้ว'
      }, { status: 400 })
    }

    // Upload logo if provided
    let logoUrl = ''
    if (logoFile && logoFile.size > 0) {
      try {
        const bucket = adminStorage.bucket()
        const fileName = `companies/${slug}/logo-${Date.now()}.${logoFile.name.split('.').pop()}`
        const file = bucket.file(fileName)
        
        const arrayBuffer = await logoFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        
        await file.save(buffer, {
          metadata: {
            contentType: logoFile.type,
          },
        })

        // Make file publicly accessible
        await file.makePublic()
        logoUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`
        
      } catch (uploadError) {
        console.error('Logo upload error:', uploadError)
        // Continue without logo if upload fails
      }
    }

    // Create company document
    const companyId = generateId()
    const company = {
      name: companyData.name,
      slug,
      email: companyData.email,
      phone: companyData.phone,
      website: companyData.website || '',
      
      // Address
      address: companyData.address,
      district: companyData.district,
      amphoe: companyData.amphoe,
      province: companyData.province,
      postcode: companyData.postcode,
      
      // System fields
      logo: logoUrl,
      isActive: true,
      createdAt: new Date(),
      createdBy: 'system',
      
      // LINE Integration (will be set up later)
      lineChannelId: '',
      
      // Stats
      totalUsers: 0,
      totalWarranties: 0
    }

    // Save company to Firestore
    await companiesRef.doc(companyId).set(company)

    // Create admin user with provided credentials (using company email)
    const adminUser = {
      companyId,
      email: companyData.email, // ใช้อีเมลเดียวกับบริษัท
      name: companyData.adminName,
      role: 'admin',
      password: companyData.adminPassword, // In production, this should be hashed
      isActive: true,
      createdAt: new Date(),
      createdBy: 'system',
      lastLogin: null
    }

    const adminUserId = generateId()
    await usersRef.doc(adminUserId).set(adminUser)

    // Log the registration
    console.log('🎉 New company registered:', {
      id: companyId,
      name: company.name,
      slug: company.slug,
      email: companyData.email,
      adminName: companyData.adminName
    })

    return NextResponse.json({
      success: true,
      message: 'สมัครสมาชิกเรียบร้อยแล้ว',
      data: {
        companyId,
        companyName: company.name,
        slug: company.slug,
        subdomainUrl: `${slug}.${process.env.NEXT_PUBLIC_APP_URL?.replace(/https?:\/\//, '') || 'localhost:3000'}`,
        adminCredentials: {
          email: companyData.email,
          name: companyData.adminName
          // Don't return password in response for security
        }
      }
    })

  } catch (error: any) {
    console.error('Company registration error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสมัครสมาชิก',
      error: error.message
    }, { status: 500 })
  }
}