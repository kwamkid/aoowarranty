// app/api/admin/warranties/stats/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { cookies } from 'next/headers'

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

// GET - Get warranty statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 })
    }
    
    // Get all warranties for stats calculation
    const warrantiesSnapshot = await adminDb
      .collection('warranties')
      .where('companyId', '==', session.companyId)
      .get()
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    let stats = {
      total: 0,
      active: 0,
      expired: 0,
      claimed: 0,
      expiringSoon: 0
    }
    
    warrantiesSnapshot.docs.forEach(doc => {
      const data = doc.data()
      stats.total++
      
      // Check status
      if (data.status === 'claimed') {
        stats.claimed++
      } else {
        const expiryDate = new Date(data.warrantyExpiry)
        expiryDate.setHours(0, 0, 0, 0)
        
        const diffTime = expiryDate.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        
        if (diffDays <= 0) {
          stats.expired++
        } else if (diffDays <= 30) {
          stats.expiringSoon++
          stats.active++
        } else {
          stats.active++
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      data: stats
    })
    
  } catch (error: any) {
    console.error('Error fetching warranty stats:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch warranty stats',
      error: error.message
    }, { status: 500 })
  }
}