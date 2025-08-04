// app/tenant/register/page.tsx
import { getTenantContext } from '@/lib/tenant-context'
import { requireCustomerAuth } from '@/lib/customer-auth'
import { adminDb } from '@/lib/firebase-admin'
import RegisterForm from './RegisterForm'

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
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-secondary-200 sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {company.logo ? (
                <img 
                  src={company.logo} 
                  alt={company.name}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-600 font-bold text-sm">
                    {company.name.charAt(0)}
                  </span>
                </div>
              )}
              <div>
                <h1 className="text-base font-bold text-secondary-900">{company.name}</h1>
                <p className="text-xs text-secondary-600">ลงทะเบียนรับประกัน</p>
              </div>
            </div>
            
            {/* User Info */}
            <div className="flex items-center space-x-2">
              {session.pictureUrl && (
                <img 
                  src={session.pictureUrl} 
                  alt={session.displayName}
                  className="h-8 w-8 rounded-full"
                />
              )}
              <span className="text-sm text-secondary-700 hidden sm:block">
                {session.displayName}
              </span>
            </div>
          </div>
        </div>
      </header>
      
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