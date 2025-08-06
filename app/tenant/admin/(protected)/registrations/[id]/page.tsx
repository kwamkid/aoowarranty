// app/tenant/admin/(protected)/registrations/[id]/page.tsx
import { getTenantContext } from '@/lib/tenant-context'
import { adminDb } from '@/lib/firebase-admin'
import { notFound } from 'next/navigation'
import WarrantyDetailClientPage from './WarrantyDetailClientPage'

async function getWarranty(warrantyId: string, companyId: string) {
  try {
    const warrantyDoc = await adminDb.collection('warranties').doc(warrantyId).get()
    
    if (!warrantyDoc.exists) {
      return null
    }
    
    const data = warrantyDoc.data()
    if (!data || data.companyId !== companyId) {
      return null
    }
    
    // Convert Firestore Timestamp
    const registrationDate = data.registrationDate?.toDate?.() || data.registrationDate || new Date()
    
    // Check warranty status
    const expiryDate = new Date(data.warrantyExpiry)
    const today = new Date()
    const status = data.status === 'claimed' ? 'claimed' : 
                   expiryDate < today ? 'expired' : 'active'
    
    return {
      id: warrantyDoc.id,
      ...data,
      status,
      registrationDate: registrationDate instanceof Date ? registrationDate.toISOString() : registrationDate
    }
  } catch (error) {
    console.error('Error fetching warranty:', error)
    return null
  }
}

export default async function WarrantyDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { company } = await getTenantContext()
  if (!company) {
    notFound()
  }
  
  // Await params
  const { id: warrantyId } = await params
  
  // Fetch warranty data
  const warranty = await getWarranty(warrantyId, company.id)
  
  if (!warranty) {
    notFound()
  }
  
  return (
    <WarrantyDetailClientPage
      warranty={warranty}
      tenant={company.slug}
    />
  )
}