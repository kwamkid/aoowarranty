// lib/tenant-context.ts
import { headers } from 'next/headers'
import { adminDb } from './firebase-admin'
import type { Company } from '@/types'

/**
 * Get tenant information from headers (Server Component)
 */
export async function getTenantFromHeaders() {
  const headersList = await headers()
  const tenant = headersList.get('x-tenant') || ''
  const tenantHost = headersList.get('x-tenant-host') || 'production'
  
  return { 
    slug: tenant, 
    isLocalhost: tenantHost === 'localhost' 
  }
}

/**
 * Get company data by slug (using Admin SDK)
 */
export async function getCompanyBySlug(slug: string): Promise<Company | null> {
  if (!slug) return null
  
  try {
    const companiesRef = adminDb.collection('companies')
    const snapshot = await companiesRef
      .where('slug', '==', slug)
      .where('isActive', '==', true)
      .limit(1)
      .get()
    
    if (snapshot.empty) return null
    
    const doc = snapshot.docs[0]
    const data = doc.data()
    
    // Helper to convert Firestore Timestamp to Date string
    const convertTimestamp = (timestamp: any): Date => {
      if (timestamp && typeof timestamp === 'object' && '_seconds' in timestamp) {
        // It's a Firestore Timestamp
        return new Date(timestamp._seconds * 1000)
      } else if (timestamp instanceof Date) {
        return timestamp
      } else if (typeof timestamp === 'string') {
        return new Date(timestamp)
      } else {
        return new Date()
      }
    }
    
    // Convert Firestore data to Company type with proper serialization
    const company: Company = {
      id: doc.id,
      name: data.name,
      slug: data.slug,
      logo: data.logo || '',
      address: data.address,
      amphoe: data.amphoe,
      district: data.district,
      province: data.province,
      postcode: data.postcode,
      phone: data.phone,
      email: data.email,
      website: data.website || '',
      lineChannelId: data.lineChannelId || '',
      isActive: data.isActive,
      createdAt: convertTimestamp(data.createdAt),
      createdBy: data.createdBy,
      totalUsers: data.totalUsers || 0,
      totalWarranties: data.totalWarranties || 0
    }
    
    return company
  } catch (error) {
    console.error('Error fetching company:', error)
    return null
  }
}

/**
 * Get tenant context with company data
 */
export async function getTenantContext() {
  const { slug } = await getTenantFromHeaders()
  
  if (!slug) {
    return { 
      tenant: null, 
      company: null,
      isMainSite: true 
    }
  }
  
  const company = await getCompanyBySlug(slug)
  
  return {
    tenant: slug,
    company,
    isMainSite: false
  }
}

/**
 * Build tenant URL for navigation
 */
export function buildTenantUrl(tenant: string, path: string = '') {
  const isLocal = process.env.NODE_ENV === 'development'
  
  if (isLocal) {
    // Localhost pattern: localhost:3000/{tenant}/path
    return `http://localhost:3000/${tenant}${path}`
  } else {
    // Production pattern: {tenant}.warrantyhub.com/path
    const domain = process.env.NEXT_PUBLIC_APP_URL?.replace(/https?:\/\//, '') || 'warrantyhub.com'
    return `https://${tenant}.${domain}${path}`
  }
}

/**
 * Check if current user has access to tenant (using Admin SDK)
 */
export async function checkTenantAccess(userId: string, tenantSlug: string): Promise<boolean> {
  try {
    // Get company by slug
    const company = await getCompanyBySlug(tenantSlug)
    if (!company) return false
    
    // Check if user belongs to this company
    const userDoc = await adminDb.collection('users').doc(userId).get()
    if (!userDoc.exists) return false
    
    const userData = userDoc.data()
    return userData?.companyId === company.id
  } catch (error) {
    console.error('Error checking tenant access:', error)
    return false
  }
}