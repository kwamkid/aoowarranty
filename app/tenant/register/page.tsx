// app/tenant/register/page.tsx
import { getTenantContext } from '@/lib/tenant-context'
import { requireCustomerAuth } from '@/lib/customer-auth'
import { adminDb } from '@/lib/firebase-admin'
import RegisterForm from './RegisterForm'
import CustomerHeader from '@/components/customer/CustomerHeader'

// Get active brands and products
async function getBrandsAndProducts(companyId: string) {
  // Get brands
  const brandsSnapshot = await adminDb
    .collection('brands')
    .where('companyId', '==', companyId)
    .where('isActive', '==', true)
    .orderBy('name', 'asc')
    .get()
  
  const brands = brandsSnapshot.docs.map(doc => ({
    id: doc.id,
    name: doc.data().name,
    logo: doc.data().logo || ''
  }))
  
  // Get products
  const productsSnapshot = await adminDb
    .collection('products')
    .where('companyId', '==', companyId)
    .where('isActive', '==', true)
    .orderBy('name', 'asc')
    .get()
  
  const products = productsSnapshot.docs.map(doc => ({
    id: doc.id,
    brandId: doc.data().brandId,
    name: doc.data().name,
    model: doc.data().model || '',
    warrantyYears: doc.data().warrantyYears || 0,
    warrantyMonths: doc.data().warrantyMonths || 0,
    requiredFields: doc.data().requiredFields || {
      serialNumber: true,
      receiptImage: true,
      purchaseLocation: false
    },
    image: doc.data().image || ''
  }))
  
  return { brands, products }
}

export default async function CustomerRegisterPage() {
  const { company, tenant } = await getTenantContext()
  
  if (!company || !tenant) {
    return null
  }
  
  // Check customer authentication
  const session = await requireCustomerAuth(tenant)
  
  // Get brands and products
  const { brands, products } = await getBrandsAndProducts(company.id)
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
      {/* Shared Header */}
      <CustomerHeader 
        company={{
          name: company.name,
          logo: company.logo
        }}
        tenant={tenant}
        isLoggedIn={true}
        session={{
          displayName: session.displayName,
          pictureUrl: session.pictureUrl
        }}
      />
      
      {/* Main Content */}
      <main className="px-4 py-6 max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-secondary-900 mb-6">
            ลงทะเบียนประกันสินค้า
          </h2>
          
          {brands.length === 0 || products.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-secondary-600">
                ยังไม่มีสินค้าให้ลงทะเบียน กรุณาติดต่อเจ้าหน้าที่
              </p>
            </div>
          ) : (
            <RegisterForm 
              brands={brands} 
              products={products}
              customerInfo={{
                customerId: session.customerId,
                displayName: session.displayName,
                email: session.email || ''
              }}
              companyId={company.id}
              tenant={tenant}
            />
          )}
        </div>
      </main>
    </div>
  )
}