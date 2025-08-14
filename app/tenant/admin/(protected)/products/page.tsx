// app/tenant/admin/(protected)/products/page.tsx
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
import { getTenantContext } from '@/lib/tenant-context'
import { adminDb } from '@/lib/firebase-admin'
import ProductsClientPage from './ProductsClientPage'
import { queryKeys } from '@/lib/query/keys'
import { headers } from 'next/headers'

// Server-side data fetching functions
async function fetchProductsServer(companyId: string, brandId?: string) {
  try {
    let query = adminDb
      .collection('products')
      .where('companyId', '==', companyId)
      .orderBy('name', 'asc')
    
    if (brandId) {
      query = query.where('brandId', '==', brandId)
    }
    
    const productsSnapshot = await query.get()
    
    // Get all brands for mapping
    const brandsSnapshot = await adminDb
      .collection('brands')
      .where('companyId', '==', companyId)
      .get()
    
    const brandsMap = new Map()
    brandsSnapshot.docs.forEach(doc => {
      brandsMap.set(doc.id, doc.data().name)
    })
    
    const products = await Promise.all(
      productsSnapshot.docs.map(async (doc) => {
        const data = doc.data()
        
        // Get warranty count
        const warrantyCount = await adminDb
          .collection('warranties')
          .where('companyId', '==', companyId)
          .where('productId', '==', doc.id)
          .count()
          .get()
        
        const createdAt = data.createdAt?.toDate?.() || data.createdAt || new Date()
        
        return {
          id: doc.id,
          companyId: data.companyId,
          brandId: data.brandId,
          brandName: brandsMap.get(data.brandId) || 'Unknown',
          name: data.name,
          model: data.model || '',
          warrantyYears: data.warrantyYears || 0,
          warrantyMonths: data.warrantyMonths || 0,
          requiredFields: data.requiredFields || {
            serialNumber: true,
            receiptImage: true,
            purchaseLocation: false
          },
          description: data.description || '',
          image: data.image || '',
          isActive: data.isActive !== false,
          createdAt: createdAt instanceof Date ? createdAt.toISOString() : createdAt,
          warrantyCount: warrantyCount.data().count
        }
      })
    )
    
    return products
  } catch (error) {
    console.error('Error fetching products:', error)
    return []
  }
}

async function fetchBrandsServer(companyId: string) {
  try {
    const brandsSnapshot = await adminDb
      .collection('brands')
      .where('companyId', '==', companyId)
      .where('isActive', '==', true)
      .orderBy('name', 'asc')
      .get()
    
    return brandsSnapshot.docs.map(doc => {
      const data = doc.data()
      const createdAt = data.createdAt?.toDate?.() || data.createdAt || new Date()
      
      return {
        id: doc.id,
        companyId: data.companyId,
        name: data.name,
        logo: data.logo || '',
        description: data.description || '',
        isActive: data.isActive !== false,
        createdAt: createdAt instanceof Date ? createdAt.toISOString() : createdAt
      }
    })
  } catch (error) {
    console.error('Error fetching brands:', error)
    return []
  }
}

export default async function ProductsPage({
  searchParams
}: {
  searchParams: Promise<{ brand?: string }>
}) {
  const { company } = await getTenantContext()
  if (!company) return null
  
  const params = await searchParams
  const brandId = params.brand
  
  // Create query client for server-side
  const queryClient = new QueryClient()
  
  // Prefetch data in parallel
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.products.list({ brandId }),
      queryFn: () => fetchProductsServer(company.id, brandId),
      staleTime: 60 * 1000, // 1 minute
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.brands.lists(),
      queryFn: () => fetchBrandsServer(company.id),
      staleTime: 5 * 60 * 1000, // 5 minutes
    })
  ])
  
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductsClientPage tenant={company.slug} />
    </HydrationBoundary>
  )
}