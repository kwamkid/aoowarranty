// app/tenant/warranty/[id]/page.tsx
import { getTenantContext } from '@/lib/tenant-context'
import { requireCustomerAuth, canAccessWarranty } from '@/lib/customer-auth'
import { adminDb } from '@/lib/firebase-admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { 
  Shield, 
  Calendar, 
  Package, 
  MapPin, 
  Phone, 
  Mail,
  Download,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  FileText,
  Building2
} from 'lucide-react'
import { formatDate, isWarrantyActive, getDaysUntilExpiry } from '@/lib/utils'
import CustomerHeader from '@/components/customer/CustomerHeader'

// Define warranty type
interface WarrantyData {
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
  status: string
  registrationDate: any
  notes?: string
  claimHistory?: any[]
}

async function getWarranty(warrantyId: string, companyId: string): Promise<WarrantyData | null> {
  try {
    const warrantyDoc = await adminDb.collection('warranties').doc(warrantyId).get()
    
    if (!warrantyDoc.exists) {
      return null
    }
    
    const data = warrantyDoc.data()
    if (!data || data.companyId !== companyId) {
      return null
    }
    
    return {
      id: warrantyDoc.id,
      ...data
    } as WarrantyData
  } catch (error) {
    console.error('Error fetching warranty:', error)
    return null
  }
}

export default async function WarrantyDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { company, tenant } = await getTenantContext()
  
  if (!company || !tenant) {
    notFound()
  }
  
  // Check customer authentication
  const session = await requireCustomerAuth(tenant)
  
  // Await params
  const { id: warrantyId } = await params
  
  // Get warranty data
  const warranty = await getWarranty(warrantyId, company.id)
  
  if (!warranty) {
    notFound()
  }
  
  // Check if customer can access this warranty
  const canAccess = await canAccessWarranty(session, warranty.customerId)
  if (!canAccess) {
    notFound()
  }
  
  // Calculate warranty status
  const isActive = isWarrantyActive(warranty.warrantyExpiry)
  const daysUntilExpiry = getDaysUntilExpiry(warranty.warrantyExpiry)
  const isNearExpiry = isActive && daysUntilExpiry <= 30
  
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
        {/* Page Title with Back Button */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Link 
              href={`/${tenant}/my-warranties`}
              className="p-2 -ml-2 hover:bg-secondary-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5 text-secondary-600" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-secondary-900">ใบรับประกันสินค้า</h1>
              <p className="text-xs text-secondary-600">#{warrantyId}</p>
            </div>
          </div>
          
          {/* Download Button */}
          <button className="btn-primary text-sm py-2 px-3">
            <Download className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">ดาวน์โหลด</span>
          </button>
        </div>
        
        {/* Status Card */}
        <div className={`rounded-xl p-4 mb-6 ${
          isActive ? (isNearExpiry ? 'bg-orange-50 border border-orange-200' : 'bg-green-50 border border-green-200')
                  : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {isActive ? (
                isNearExpiry ? (
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                ) : (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                )
              ) : (
                <AlertTriangle className="w-6 h-6 text-red-600" />
              )}
              <div>
                <p className={`font-semibold ${
                  isActive ? (isNearExpiry ? 'text-orange-900' : 'text-green-900')
                          : 'text-red-900'
                }`}>
                  {isActive ? (isNearExpiry ? 'ประกันใกล้หมดอายุ' : 'ประกันยังใช้งานได้')
                           : 'ประกันหมดอายุแล้ว'}
                </p>
                <p className={`text-sm ${
                  isActive ? (isNearExpiry ? 'text-orange-700' : 'text-green-700')
                          : 'text-red-700'
                }`}>
                  {isActive ? `เหลืออีก ${daysUntilExpiry} วัน` 
                           : `หมดอายุเมื่อ ${formatDate(warranty.warrantyExpiry, 'dd/MM/yyyy')}`}
                </p>
              </div>
            </div>
            <Shield className={`w-8 h-8 ${
              isActive ? (isNearExpiry ? 'text-orange-500' : 'text-green-500')
                      : 'text-red-400'
            }`} />
          </div>
        </div>
        
        {/* Product Info */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center">
            <Package className="w-5 h-5 mr-2 text-primary-500" />
            ข้อมูลสินค้า
          </h2>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm text-secondary-600">แบรนด์</p>
              <p className="font-medium text-secondary-900">{warranty.productInfo.brandName}</p>
            </div>
            
            <div>
              <p className="text-sm text-secondary-600">ชื่อสินค้า</p>
              <p className="font-medium text-secondary-900">{warranty.productInfo.productName}</p>
            </div>
            
            {warranty.productInfo.model && (
              <div>
                <p className="text-sm text-secondary-600">รุ่น/Model</p>
                <p className="font-medium text-secondary-900">{warranty.productInfo.model}</p>
              </div>
            )}
            
            {warranty.productInfo.serialNumber && (
              <div>
                <p className="text-sm text-secondary-600">Serial Number</p>
                <p className="font-medium text-secondary-900 font-mono">
                  {warranty.productInfo.serialNumber}
                </p>
              </div>
            )}
            
            {warranty.productInfo.purchaseLocation && (
              <div>
                <p className="text-sm text-secondary-600">สถานที่ซื้อ</p>
                <p className="font-medium text-secondary-900">{warranty.productInfo.purchaseLocation}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Warranty Period */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-primary-500" />
            ระยะเวลาประกัน
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-secondary-600">วันที่ซื้อ</p>
              <p className="font-medium text-secondary-900">
                {formatDate(warranty.purchaseDate, 'dd/MM/yyyy')}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-secondary-600">วันที่เริ่มประกัน</p>
              <p className="font-medium text-secondary-900">
                {formatDate(warranty.warrantyStartDate, 'dd/MM/yyyy')}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-secondary-600">วันหมดประกัน</p>
              <p className="font-medium text-secondary-900">
                {formatDate(warranty.warrantyExpiry, 'dd/MM/yyyy')}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-secondary-600">วันที่ลงทะเบียน</p>
              <p className="font-medium text-secondary-900">
                {formatDate(warranty.registrationDate, 'dd/MM/yyyy')}
              </p>
            </div>
          </div>
        </div>
        
        {/* Customer Info */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center">
            <Phone className="w-5 h-5 mr-2 text-primary-500" />
            ข้อมูลลูกค้า
          </h2>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm text-secondary-600">ชื่อ-นามสกุล</p>
              <p className="font-medium text-secondary-900">{warranty.customerInfo.name}</p>
            </div>
            
            <div>
              <p className="text-sm text-secondary-600">เบอร์โทรศัพท์</p>
              <p className="font-medium text-secondary-900">{warranty.customerInfo.phone}</p>
            </div>
            
            {warranty.customerInfo.email && (
              <div>
                <p className="text-sm text-secondary-600">อีเมล</p>
                <p className="font-medium text-secondary-900">{warranty.customerInfo.email}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Address */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-primary-500" />
            ที่อยู่สำหรับการรับประกัน
          </h2>
          
          <p className="text-secondary-900">
            {warranty.customerInfo.address}<br />
            {warranty.customerInfo.district} {warranty.customerInfo.amphoe}<br />
            {warranty.customerInfo.province} {warranty.customerInfo.postcode}
          </p>
        </div>
        
        {/* Receipt Image */}
        {warranty.receiptImage && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-primary-500" />
              ใบเสร็จรับเงิน
            </h2>
            
            <a 
              href={warranty.receiptImage} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block"
            >
              <img 
                src={warranty.receiptImage} 
                alt="Receipt"
                className="w-full rounded-lg border border-secondary-200 hover:opacity-90 transition-opacity"
              />
            </a>
          </div>
        )}
        
        {/* Notes */}
        {warranty.notes && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">
              หมายเหตุ
            </h2>
            <p className="text-secondary-700">{warranty.notes}</p>
          </div>
        )}
        
        {/* Company Info */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center">
            <Building2 className="w-5 h-5 mr-2 text-primary-500" />
            ข้อมูลผู้ให้บริการ
          </h2>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm text-secondary-600">บริษัท/ร้านค้า</p>
              <p className="font-medium text-secondary-900">{company.name}</p>
            </div>
            
            <div>
              <p className="text-sm text-secondary-600">ที่อยู่</p>
              <p className="text-secondary-900">
                {company.address}<br />
                {company.district} {company.amphoe}<br />
                {company.province} {company.postcode}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-secondary-600">เบอร์โทรศัพท์</p>
              <p className="font-medium text-secondary-900">{company.phone}</p>
            </div>
            
            {company.email && (
              <div>
                <p className="text-sm text-secondary-600">อีเมล</p>
                <p className="font-medium text-secondary-900">{company.email}</p>
              </div>
            )}
            
            {company.website && (
              <div>
                <p className="text-sm text-secondary-600">เว็บไซต์</p>
                <a 
                  href={company.website} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary-600 hover:text-primary-700"
                >
                  {company.website}
                </a>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}