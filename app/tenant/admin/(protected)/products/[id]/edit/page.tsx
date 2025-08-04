// app/tenant/admin/(protected)/products/[id]/edit/page.tsx
import { getTenantContext } from '@/lib/tenant-context'
import { adminDb } from '@/lib/firebase-admin'
import { notFound } from 'next/navigation'
import EditProductClientPage from './EditProductClientPage'

interface Product {
  id: string
  companyId: string
  brandId: string
  name: string
  model?: string
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
}

async function getProduct(productId: string, companyId: string): Promise<Product | null> {
  try {
    const productDoc = await adminDb.collection('products').doc(productId).get()
    
    if (!productDoc.exists) {
      return null
    }
    
    const data = productDoc.data()
    if (!data || data.companyId !== companyId) {
      return null
    }
    
    return {
      id: productDoc.id,
      companyId: data.companyId,
      brandId: data.brandId,
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
      isActive: data.isActive !== false
    }
  } catch (error) {
    console.error('Error fetching product:', error)
    return null
  }
}

async function getBrands(companyId: string) {
  try {
    const brandsSnapshot = await adminDb
      .collection('brands')
      .where('companyId', '==', companyId)
      .orderBy('name', 'asc')
      .get()
    
    return brandsSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name
    }))
  } catch (error) {
    console.error('Error fetching brands:', error)
    return []
  }
}

export default async function EditProductPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { company } = await getTenantContext()
  if (!company) {
    notFound()
  }
  
  // Await params
  const { id: productId } = await params
  
  // Fetch product data
  const product = await getProduct(productId, company.id)
  
  if (!product) {
    notFound()
  }
  
  // Fetch brands
  const brands = await getBrands(company.id)
  
  return (
    <EditProductClientPage
      initialProduct={product}
      brands={brands}
      tenant={company.slug}
      productId={productId}
    />
  )
}