// app/api/admin/warranties/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { cookies } from 'next/headers'
import { Warranty } from '@/types'

// Get admin session
async function getAdminSession() {
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

// GET - List warranties for admin
export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '200')
    const status = searchParams.get('status')
    const brandName = searchParams.get('brand')
    
    // Start with base query
    let query = adminDb
      .collection('warranties')
      .where('companyId', '==', session.companyId)
      .orderBy('registrationDate', 'desc')
      .limit(limit)
    
    // Get warranties
    const warrantiesSnapshot = await query.get()
    
    // Process warranties and check status
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    let warranties = warrantiesSnapshot.docs.map(doc => {
      const data = doc.data()
      const registrationDate = data.registrationDate?.toDate?.() || data.registrationDate || new Date()
      
      // Check and update warranty status
      const expiryDate = new Date(data.warrantyExpiry)
      expiryDate.setHours(0, 0, 0, 0)
      
      let warrantyStatus = data.status
      if (warrantyStatus !== 'claimed' && expiryDate < today) {
        warrantyStatus = 'expired'
      }
      
      return {
        id: doc.id,
        ...data,
        registrationDate: registrationDate instanceof Date ? registrationDate.toISOString() : registrationDate,
        status: warrantyStatus
      } as Warranty & { registrationDate: string }
    })
    
    // Apply filters
    if (status && status !== 'all') {
      warranties = warranties.filter(w => {
        if (status === 'expiring') {
          const expiryDate = new Date(w.warrantyExpiry)
          const diffTime = expiryDate.getTime() - today.getTime()
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          return diffDays > 0 && diffDays <= 30 && w.status === 'active'
        }
        return w.status === status
      })
    }
    
    if (brandName && brandName !== 'all') {
      warranties = warranties.filter(w => w.productInfo.brandName === brandName)
    }
    
    // Set cache headers
    const headers = {
      'Cache-Control': 'private, max-age=10, stale-while-revalidate=30',
    }
    
    return NextResponse.json({
      success: true,
      data: warranties,
      count: warranties.length
    }, { headers })
    
  } catch (error: any) {
    console.error('Error fetching warranties:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch warranties',
      error: error.message
    }, { status: 500 })
  }
}