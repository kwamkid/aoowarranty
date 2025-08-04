// app/tenant/admin/(protected)/products/page.tsx
import { getTenantContext } from '@/lib/tenant-context'
import { adminDb } from '@/lib/firebase-admin'
import ProductsClientPage from './ProductsClientPage'

interface Product {
  id: string
  companyId: string
  brandId: string
  brandName?: string // Added for display
  name: string
  model: string
  warrantyYears: number
  warrantyMonths: number
  requiredFields: {
    serialNumber: boolean
    receiptImage: boolean
    purchaseLocation: boolean
  }
  description?: string
  image?: string
  isActive: boolean
  createdAt: string | Date
  warrantyCount?: number // Added to show usage
}

async function getProducts(companyId: string, brandId?: string): Promise<Product[]> {
  let query = adminDb
    .collection('products')
    .where('companyId', '==', companyId)
    .orderBy('name', 'asc')
  
  // Filter by brand if specified
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
  
  const products: Product[] = []
  
  for (const doc of productsSnapshot.docs) {
    const data = doc.data()
    
    // Count warranties for this product
    const warrantyCount = await adminDb
      .collection('warranties')
      .where('companyId', '==', companyId)
      .where('productId', '==', doc.id)
      .count()
      .get()
    
    // Convert Firestore Timestamp
    const createdAt = data.createdAt?.toDate?.() || data.createdAt || new Date()
    
    products.push({
      id: doc.id,
      companyId: data.companyId,
      brandId: data.brandId,
      brandName: brandsMap.get(data.brandId) || 'Unknown',
      name: data.name,
      model: data.model,
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
    })
  }
  
  return products
}

async function getBrands(companyId: string) {
  const brandsSnapshot = await adminDb
    .collection('brands')
    .where('companyId', '==', companyId)
    .where('isActive', '==', true)
    .orderBy('name', 'asc')
    .get()
  
  return brandsSnapshot.docs.map(doc => ({
    id: doc.id,
    name: doc.data().name
  }))
}

export default async function ProductsPage({
  searchParams
}: {
  searchParams: Promise<{ brand?: string }>
}) {
  const { company } = await getTenantContext()
  if (!company) return null
  
  // Await searchParams before using
  const params = await searchParams
  const brandId = params.brand
  
  let products: Product[] = []
  let brands: { id: string; name: string }[] = []
  let tenant = company.slug
  
  try {
    [products, brands] = await Promise.all([
      getProducts(company.id, brandId),
      getBrands(company.id)
    ])
  } catch (error) {
    console.error('Error fetching products:', error)
  }
  
  return (
    <ProductsClientPage 
      initialProducts={products} 
      brands={brands}
      selectedBrandId={brandId}
      tenant={tenant} 
    />
  )
}