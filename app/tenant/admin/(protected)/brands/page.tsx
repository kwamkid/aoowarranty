// app/tenant/admin/(protected)/brands/page.tsx
import { getTenantContext } from '@/lib/tenant-context'
import { adminDb } from '@/lib/firebase-admin'
import BrandsClientPage from './BrandsClientPage'

interface Brand {
  id: string
  companyId: string
  name: string
  logo?: string
  description?: string
  isActive: boolean
  createdAt: string | Date // Changed to accept string
  createdBy: string
  productCount: number
}

async function getBrands(companyId: string): Promise<Brand[]> {
  const brandsSnapshot = await adminDb
    .collection('brands')
    .where('companyId', '==', companyId)
    .orderBy('name', 'asc')
    .get()
  
  const brands: Brand[] = []
  for (const doc of brandsSnapshot.docs) {
    const data = doc.data()
    
    // Count products for each brand
    const productsCount = await adminDb
      .collection('products')
      .where('companyId', '==', companyId)
      .where('brandId', '==', doc.id)
      .count()
      .get()
    
    // Convert Firestore Timestamp to ISO string
    const createdAt = data.createdAt?.toDate?.() || data.createdAt || new Date()
    
    brands.push({
      id: doc.id,
      companyId: data.companyId,
      name: data.name,
      logo: data.logo || '',
      description: data.description || '',
      isActive: data.isActive !== false, // default true
      createdAt: createdAt instanceof Date ? createdAt.toISOString() : createdAt,
      createdBy: data.createdBy || '',
      productCount: productsCount.data().count
    })
  }
  
  return brands
}

export default async function BrandsPage() {
  const { company } = await getTenantContext()
  if (!company) return null
  
  let brands: Brand[] = []
  let tenant = company.slug
  
  try {
    brands = await getBrands(company.id)
  } catch (error) {
    console.error('Error fetching brands:', error)
    brands = []
  }
  
  return <BrandsClientPage initialBrands={brands} tenant={tenant} />
}