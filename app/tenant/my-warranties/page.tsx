// app/tenant/my-warranties/page.tsx
import { getTenantContext } from '@/lib/tenant-context'
import { requireCustomerAuth } from '@/lib/customer-auth'
import { adminDb } from '@/lib/firebase-admin'
import Link from 'next/link'
import { 
  Shield, 
  Plus, 
  Calendar, 
  Package, 
  CheckCircle,
  AlertTriangle,
  FileText
} from 'lucide-react'
import { formatDate, isWarrantyActive, getDaysUntilExpiry, getTimeUntilExpiry } from '@/lib/utils'
import CustomerHeader from '@/components/customer/CustomerHeader'

async function getCustomerWarranties(customerId: string, companyId: string) {
  try {
    const warrantiesSnapshot = await adminDb
      .collection('warranties')
      .where('customerId', '==', customerId)
      .where('companyId', '==', companyId)
      .orderBy('registrationDate', 'desc')
      .get()
    
    return warrantiesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Error fetching warranties:', error)
    return []
  }
}

export default async function MyWarrantiesPage() {
  const { company, tenant } = await getTenantContext()
  
  if (!company || !tenant) {
    return null
  }
  
  // Check customer authentication
  const session = await requireCustomerAuth(tenant)
  
  // Get customer's warranties
  const warranties = await getCustomerWarranties(session.customerId, company.id)
  
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
      <main className="px-4 py-6 max-w-4xl mx-auto">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-secondary-900">ประกันของฉัน</h1>
          <p className="text-sm text-secondary-600 mt-1">
            รายการประกันสินค้าที่ลงทะเบียนไว้ทั้งหมด
          </p>
        </div>
        
        {/* Show Add New Button only if there are warranties */}
        {warranties.length > 0 && (
          <Link
            href={`/${tenant}/register`}
            className="btn-primary inline-flex items-center mb-6"
          >
            <Plus className="w-5 h-5 mr-2" />
            ลงทะเบียนประกันใหม่
          </Link>
        )}
        
        {/* Warranties List */}
        {warranties.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <FileText className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-secondary-900 mb-2">
              ยังไม่มีประกันที่ลงทะเบียน
            </h3>
            <p className="text-sm text-secondary-600 mb-6">
              เริ่มต้นด้วยการลงทะเบียนประกันสินค้าของคุณ
            </p>
            <Link
              href={`/${tenant}/register`}
              className="btn-primary inline-flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              ลงทะเบียนประกันแรก
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {warranties.map((warranty: any) => {
              const isActive = isWarrantyActive(warranty.warrantyExpiry)
              const daysUntilExpiry = getDaysUntilExpiry(warranty.warrantyExpiry)
              const timeUntilExpiry = getTimeUntilExpiry(warranty.warrantyExpiry)
              const isNearExpiry = isActive && daysUntilExpiry <= 30
              
              return (
                <Link
                  key={warranty.id}
                  href={`/${tenant}/warranty/${warranty.id}`}
                  className="block bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="p-4 sm:p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Product Info */}
                        <div className="flex items-start space-x-3">
                          <div className="w-12 h-12 rounded-lg bg-secondary-100 flex items-center justify-center flex-shrink-0">
                            <Package className="w-6 h-6 text-secondary-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-secondary-900">
                              {warranty.productInfo.productName}
                            </h3>
                            <p className="text-sm text-secondary-600">
                              {warranty.productInfo.brandName}
                              {warranty.productInfo.model && ` - ${warranty.productInfo.model}`}
                            </p>
                            {warranty.productInfo.serialNumber && (
                              <p className="text-xs text-secondary-500 mt-1 font-mono">
                                S/N: {warranty.productInfo.serialNumber}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* Dates */}
                        <div className="mt-4 flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center space-x-1 text-secondary-600">
                            <Calendar className="w-4 h-4" />
                            <span>ซื้อ: {formatDate(warranty.purchaseDate, 'dd/MM/yy')}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-secondary-600">
                            <Shield className="w-4 h-4" />
                            <span>หมดประกัน: {formatDate(warranty.warrantyExpiry, 'dd/MM/yy')}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Status Badge */}
                      <div className="ml-4 flex-shrink-0">
                        {isActive ? (
                          isNearExpiry ? (
                            <div className="flex flex-col items-center">
                              <AlertTriangle className="w-6 h-6 text-orange-500 mb-1" />
                              <span className="text-xs text-orange-600 font-medium text-center">
                                {timeUntilExpiry}
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center">
                              <CheckCircle className="w-6 h-6 text-green-500 mb-1" />
                              <span className="text-xs text-green-600 font-medium">
                                ใช้งานได้
                              </span>
                            </div>
                          )
                        ) : (
                          <div className="flex flex-col items-center">
                            <AlertTriangle className="w-6 h-6 text-red-500 mb-1" />
                            <span className="text-xs text-red-600 font-medium">
                              หมดอายุ
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Customer Name */}
                    <div className="mt-4 pt-4 border-t border-secondary-100">
                      <p className="text-xs text-secondary-500">
                        ลงทะเบียนโดย: {warranty.customerInfo.name}
                      </p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}