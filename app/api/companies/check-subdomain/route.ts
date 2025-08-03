// app/api/companies/check-subdomain/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { isValidSlug } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')

    if (!slug) {
      return NextResponse.json({
        success: false,
        message: 'กรุณาระบุชื่อเว็บไซต์'
      }, { status: 400 })
    }

    // Validate slug format
    if (!isValidSlug(slug)) {
      return NextResponse.json({
        success: false,
        available: false,
        message: 'ชื่อเว็บไซต์ไม่ถูกต้อง กรุณาใช้ตัวอังกฤษเล็ก ตัวเลข และ - เท่านั้น'
      })
    }

    // Check if slug exists in database
    const companiesRef = adminDb.collection('companies')
    const existingCompany = await companiesRef.where('slug', '==', slug).get()

    const isAvailable = existingCompany.empty

    return NextResponse.json({
      success: true,
      available: isAvailable,
      slug,
      message: isAvailable 
        ? `✓ ${slug}.warrantyhub.com ใช้งานได้!`
        : `✗ ${slug}.warrantyhub.com ถูกใช้งานแล้ว`
    })

  } catch (error: any) {
    console.error('Check subdomain error:', error)
    
    return NextResponse.json({
      success: false,
      available: false,
      message: 'เกิดข้อผิดพลาดในการตรวจสอบ'
    }, { status: 500 })
  }
}