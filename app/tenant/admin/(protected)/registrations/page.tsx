// app/tenant/admin/(protected)/registrations/page.tsx
import { getTenantContext } from '@/lib/tenant-context'
import { adminDb } from '@/lib/firebase-admin'
import RegistrationsClientPage from './RegistrationsClientPage'

interface Warranty {
  id: string
  companyId: string
  productId: string
  customerId: string
  customerInfo: {
    name: string
    lineDisplayName: string
    phone: string
    email: string
    address: string
    district: string
    amphoe: string
    province: string
    postcode: string
  }
  productInfo: {
    brandName: string
    productName: string
    model: string
    serialNumber?: string
    purchaseLocation?: string
  }
  purchaseDate: string
  warrantyStartDate: string
  warrantyExpiry: string
  receiptImage?: string
  status: 'active' | 'expired' | 'claimed'
  registrationDate: Date
  notes?: string
}

async function getWarranties(companyId: string): Promise<Warranty[]> {
  const warrantiesSnapshot = await adminDb
    .collection('warranties')
    .where('companyId', '==', companyId)
    .orderBy('registrationDate', 'desc')
    .limit(100) // Limit for performance
    .get()
  
  const warranties: Warranty[] = []
  
  for (const doc of warrantiesSnapshot.docs) {
    const data = doc.data()
    
    // Convert Firestore Timestamp to Date
    const registrationDate = data.registrationDate?.toDate?.() || data.registrationDate || new Date()
    
    // Check warranty status
    const expiryDate = new Date(data.warrantyExpiry)
    const today = new Date()
    const status = data.status === 'claimed' ? 'claimed' : 
                   expiryDate < today ? 'expired' : 'active'
    
    warranties.push({
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
      registrationDate: registrationDate instanceof Date ? registrationDate : new Date(registrationDate),
      notes: data.notes || ''
    })
  }
  
  return warranties
}

export default async function RegistrationsPage() {
  const { company } = await getTenantContext()
  if (!company) return null
  
  let warranties: Warranty[] = []
  let tenant = company.slug
  
  try {
    warranties = await getWarranties(company.id)
  } catch (error) {
    console.error('Error fetching warranties:', error)
    warranties = []
  }
  
  // Serialize warranty data
  const serializedWarranties = warranties.map(warranty => ({
    ...warranty,
    registrationDate: warranty.registrationDate.toISOString()
  }))
  
  return <RegistrationsClientPage initialWarranties={serializedWarranties} tenant={tenant} />
}