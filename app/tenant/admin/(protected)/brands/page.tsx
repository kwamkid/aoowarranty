// app/tenant/admin/(protected)/brands/page.tsx
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
import { getTenantContext } from '@/lib/tenant-context'
import { adminDb } from '@/lib/firebase-admin'
import BrandsClientPage from './BrandsClientPage'
import { queryKeys } from '@/lib/query/keys'

// Server-side data fetching function
async function fetchBrandsServer(companyId: string) {
  try {
    // Get brands
    const brandsSnapshot = await adminDb
      .collection('brands')
      .where('companyId', '==', companyId)
      .orderBy('name', 'asc')
      .get()
    
    // Get all products for counting
    const productsSnapshot = await adminDb
      .collection('products')
      .where('companyId', '==', companyId)
      .select('brandId')
      .get()
    
    // Count products per brand
    const productCounts = new Map<string, number>()
    productsSnapshot.docs.forEach(doc => {
      const brandId = doc.data().brandId
      productCounts.set(brandId, (productCounts.get(brandId) || 0) + 1)
    })
    
    // Process brands
    const brands = brandsSnapshot.docs.map(doc => {
      const data = doc.data()
      const createdAt = data.createdAt?.toDate?.() || data.createdAt || new Date()
      
      return {
        id: doc.id,
        companyId: data.companyId,
        name: data.name,
        description: data.description || '',
        logo: data.logo || '',
        isActive: data.isActive !== false,
        createdAt: createdAt instanceof Date ? createdAt.toISOString() : createdAt,
        createdBy: data.createdBy || '',
        productCount: productCounts.get(doc.id) || 0
      }
    })
    
    return brands
  } catch (error) {
    console.error('Error fetching brands:', error)
    return []
  }
}

export default async function BrandsPage() {
  const { company } = await getTenantContext()
  if (!company) return null
  
  // Create query client for server-side
  const queryClient = new QueryClient()
  
  // Prefetch brands data
  await queryClient.prefetchQuery({
    queryKey: queryKeys.brands.lists(),
    queryFn: () => fetchBrandsServer(company.id),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
  
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BrandsClientPage tenant={company.slug} />
    </HydrationBoundary>
  )
}