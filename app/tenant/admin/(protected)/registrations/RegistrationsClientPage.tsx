'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Search, 
  Eye, 
  Download,
  FileText,
  Calendar,
  Shield,
  Clock,
  User,
  Phone,
  Package,
  Filter,
  ChevronDown,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { formatDate, isWarrantyActive, getDaysUntilExpiry } from '@/lib/utils'
import { exportWarrantiesToExcel, exportFilteredWarranties } from '@/lib/excel-export'

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
  registrationDate: string
  notes?: string
}

interface RegistrationsPageProps {
  initialWarranties: Warranty[]
  tenant: string
}

export default function RegistrationsClientPage({ 
  initialWarranties = [], 
  tenant 
}: RegistrationsPageProps) {
  const [warranties] = useState<Warranty[]>(initialWarranties || [])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'claimed'>('all')
  const [brandFilter, setBrandFilter] = useState<string>('all')
  const [isExporting, setIsExporting] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const router = useRouter()
  
  // Get unique brands for filter
  const uniqueBrands = Array.from(new Set(warranties.map(w => w.productInfo.brandName)))
  
  // Filter warranties
  const filteredWarranties = warranties.filter(warranty => {
    // Search filter
    const matchesSearch = 
      warranty.customerInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warranty.customerInfo.phone.includes(searchTerm) ||
      warranty.productInfo.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warranty.productInfo.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warranty.customerInfo.lineDisplayName.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || warranty.status === statusFilter
    
    // Brand filter
    const matchesBrand = brandFilter === 'all' || warranty.productInfo.brandName === brandFilter
    
    return matchesSearch && matchesStatus && matchesBrand
  })
  
  // Handle export
  const handleExport = async (type: 'all' | 'filtered') => {
    setIsExporting(true)
    setShowExportMenu(false)
    
    try {
      // หา company name จาก warranty data หรือใช้ tenant
      const companyName = tenant || 'Company'
      
      if (type === 'all') {
        // Export ข้อมูลทั้งหมด
        exportWarrantiesToExcel(warranties, companyName)
      } else {
        // Export เฉพาะข้อมูลที่กรองแล้ว
        const filters = {
          status: statusFilter !== 'all' ? statusFilter : undefined,
          brandName: brandFilter !== 'all' ? brandFilter : undefined
        }
        exportFilteredWarranties(filteredWarranties, companyName, filters)
      }
    } catch (error) {
      console.error('Export error:', error)
    } finally {
      setIsExporting(false)
    }
  }
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.export-dropdown')) {
        setShowExportMenu(false)
      }
    }
    
    if (showExportMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showExportMenu])
  
  // Get status badge
  const getStatusBadge = (warranty: Warranty) => {
    const daysLeft = getDaysUntilExpiry(warranty.warrantyExpiry)
    
    if (warranty.status === 'claimed') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          เคลมแล้ว
        </span>
      )
    } else if (warranty.status === 'expired') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          หมดอายุ
        </span>
      )
    } else if (daysLeft <= 30) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          ใกล้หมดอายุ ({daysLeft} วัน)
        </span>
      )
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          ใช้งานได้
        </span>
      )
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">ข้อมูลการลงทะเบียน</h1>
          <p className="text-sm text-secondary-600 mt-1">
            ข้อมูลลูกค้าที่ลงทะเบียนรับประกันสินค้า
          </p>
        </div>
        
        <div className="relative export-dropdown">
          <button 
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={isExporting || warranties.length === 0}
            className="btn-primary inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                กำลังส่งออก...
              </>
            ) : (
              <>
                <Download className="w-5 h-5 mr-2" />
                Export Excel
                <ChevronDown className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
          
          {/* Dropdown Menu */}
          {showExportMenu && !isExporting && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-secondary-200 rounded-lg shadow-lg z-10">
              <button
                onClick={() => handleExport('all')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-secondary-50 flex items-center"
              >
                <FileText className="w-4 h-4 mr-2 text-secondary-500" />
                <div>
                  <div className="font-medium">ส่งออกทั้งหมด</div>
                  <div className="text-xs text-secondary-500">
                    {warranties.length} รายการ
                  </div>
                </div>
              </button>
              
              {(statusFilter !== 'all' || brandFilter !== 'all' || searchTerm) && (
                <>
                  <div className="border-t border-secondary-100" />
                  <button
                    onClick={() => handleExport('filtered')}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-secondary-50 flex items-center"
                  >
                    <Filter className="w-4 h-4 mr-2 text-secondary-500" />
                    <div>
                      <div className="font-medium">ส่งออกที่กรองแล้ว</div>
                      <div className="text-xs text-secondary-500">
                        {filteredWarranties.length} รายการ
                      </div>
                    </div>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อ, เบอร์โทร, สินค้า, Serial Number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          
          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">ทุกสถานะ</option>
              <option value="active">ใช้งานได้</option>
              <option value="expired">หมดอายุ</option>
              <option value="claimed">เคลมแล้ว</option>
            </select>
          </div>
          
          {/* Brand Filter */}
          <div>
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">ทุกแบรนด์</option>
              {uniqueBrands.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">ทั้งหมด</p>
              <p className="text-2xl font-bold text-secondary-900">{warranties.length}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">ใช้งานได้</p>
              <p className="text-2xl font-bold text-green-600">
                {warranties.filter(w => w.status === 'active').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">ใกล้หมดอายุ</p>
              <p className="text-2xl font-bold text-orange-600">
                {warranties.filter(w => {
                  const days = getDaysUntilExpiry(w.warrantyExpiry)
                  return days > 0 && days <= 30
                }).length}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-orange-500" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">หมดอายุ</p>
              <p className="text-2xl font-bold text-red-600">
                {warranties.filter(w => w.status === 'expired').length}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>
      
      {/* Table */}
      {filteredWarranties.length === 0 ? (
        <div className="card">
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-secondary-900 mb-2">
              {searchTerm || statusFilter !== 'all' || brandFilter !== 'all' 
                ? 'ไม่พบข้อมูลที่ค้นหา' 
                : 'ยังไม่มีการลงทะเบียน'}
            </h3>
            <p className="text-sm text-secondary-600">
              {searchTerm || statusFilter !== 'all' || brandFilter !== 'all'
                ? 'ลองเปลี่ยนตัวกรองค้นหา'
                : 'รอลูกค้าลงทะเบียนประกันสินค้า'}
            </p>
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-secondary-200">
                  <th className="text-left px-4 py-3 text-sm font-medium text-secondary-700">วันที่ลงทะเบียน</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-secondary-700">ข้อมูลลูกค้า</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-secondary-700">สินค้า</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-secondary-700">ระยะประกัน</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-secondary-700">สถานะ</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-secondary-700">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {filteredWarranties.map((warranty) => (
                  <tr key={warranty.id} className="hover:bg-secondary-50 transition-colors">
                    {/* Registration Date */}
                    <td className="px-4 py-4">
                      <div className="text-sm">
                        <p className="font-medium text-secondary-900">
                          {formatDate(warranty.registrationDate, 'dd/MM/yyyy')}
                        </p>
                        <p className="text-xs text-secondary-500">
                          {formatDate(warranty.registrationDate, 'HH:mm')} น.
                        </p>
                      </div>
                    </td>
                    
                    {/* Customer Info */}
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-secondary-900">
                            {warranty.customerInfo.name}
                          </p>
                          <p className="text-xs text-secondary-500 flex items-center">
                            <Phone className="w-3 h-3 mr-1" />
                            {warranty.customerInfo.phone}
                          </p>
                          <p className="text-xs text-secondary-500">
                            LINE: {warranty.customerInfo.lineDisplayName}
                          </p>
                        </div>
                      </div>
                    </td>
                    
                    {/* Product Info */}
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium text-secondary-900">
                          {warranty.productInfo.productName}
                        </p>
                        <p className="text-xs text-secondary-500">
                          {warranty.productInfo.brandName} 
                          {warranty.productInfo.model && ` - ${warranty.productInfo.model}`}
                        </p>
                        {warranty.productInfo.serialNumber && (
                          <p className="text-xs text-secondary-500">
                            SN: {warranty.productInfo.serialNumber}
                          </p>
                        )}
                      </div>
                    </td>
                    
                    {/* Warranty Period */}
                    <td className="px-4 py-4 text-center">
                      <div className="text-sm">
                        <p className="font-medium text-secondary-900">
                          {formatDate(warranty.purchaseDate, 'dd/MM/yyyy')}
                        </p>
                        <p className="text-xs text-secondary-500">
                          ถึง {formatDate(warranty.warrantyExpiry, 'dd/MM/yyyy')}
                        </p>
                      </div>
                    </td>
                    
                    {/* Status */}
                    <td className="px-4 py-4 text-center">
                      {getStatusBadge(warranty)}
                    </td>
                    
                    {/* Actions */}
                    <td className="px-4 py-4 text-right">
                      <Link
                        href={`/${tenant}/admin/registrations/${warranty.id}`}
                        className="text-primary-600 hover:text-primary-700 font-medium text-sm inline-flex items-center"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        ดูรายละเอียด
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Summary */}
      {filteredWarranties.length > 0 && (
        <div className="text-center text-sm text-secondary-600">
          แสดง {filteredWarranties.length} จาก {warranties.length} รายการ
        </div>
      )}
    </div>
  )
}