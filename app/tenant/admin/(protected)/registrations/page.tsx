// app/tenant/admin/(protected)/registrations/page.tsx
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
import { getTenantContext } from '@/lib/tenant-context'
import { adminDb } from '@/lib/firebase-admin'
import RegistrationsClientPage from './RegistrationsClientPage'
import { queryKeys } from '@/lib/query/keys'

// Server-side data fetching function
async function fetchWarrantiesServer(companyId: string) {
  try {
    const warrantiesSnapshot = await adminDb
      .collection('warranties')
      .where('companyId', '==', companyId)
      .orderBy('registrationDate', 'desc')
      .limit(200)
      .get()
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const warranties = warrantiesSnapshot.docs.map(doc => {
      const data = doc.data()
      const registrationDate = data.registrationDate?.toDate?.() || data.registrationDate || new Date()
      
      // Check warranty status
      const expiryDate = new Date(data.warrantyExpiry)
      expiryDate.setHours(0, 0, 0, 0)
      
      let status = data.status
      if (status !== 'claimed' && expiryDate < today) {
        status = 'expired'
      }
      
      return {
        id: doc.id,
        companyId: data.companyId,
        productId: data.productId,
        customerId: data.customerId,
        customerInfo: data.customerInfo,
        productInfo: data.productInfo,
        purchaseDate: data.purchaseDate,
        warrantyStartDate: data.warrantyStartDate,
        warrantyExpiry: data.warrantyExpiry,
        receiptImage: data.receiptImage || '',
        status: status,
        registrationDate: registrationDate instanceof Date ? registrationDate.toISOString() : registrationDate,
        notes: data.notes || ''
      }
    })
    
    return warranties
  } catch (error) {
    console.error('Error fetching warranties:', error)
    return []
  }
}

export default async function RegistrationsPage() {
  const { company } = await getTenantContext()
  if (!company) return null
  
  // Create query client for server-side
  const queryClient = new QueryClient()
  
  // Prefetch warranties data
  await queryClient.prefetchQuery({
    queryKey: queryKeys.warranties.lists(),
    queryFn: () => fetchWarrantiesServer(company.id),
    staleTime: 30 * 1000, // 30 seconds
  })
  
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <RegistrationsClientPage tenant={company.slug} />
    </HydrationBoundary>
  )
}