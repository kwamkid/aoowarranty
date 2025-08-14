'use client'

import { useState, useMemo, useCallback } from 'react'
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
  XCircle,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { getDaysUntilExpiry, getWarrantyStatus } from '@/lib/api/client/warranties'
import { exportWarrantiesToExcel, exportFilteredWarranties } from '@/lib/excel-export'
import { useWarranties } from '@/lib/query/hooks/useWarranties'
import { useDialog } from '@/hooks/useDialog'

interface RegistrationsPageProps {
  tenant: string
}

const ITEMS_PER_PAGE_OPTIONS = [20, 50, 100, 200]
const DEFAULT_ITEMS_PER_PAGE = 50

// Skeleton loader
function RegistrationsSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="animate-pulse">
        <div className="grid grid-cols-6 gap-4 px-4 py-3 border-b border-secondary-200">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-4 bg-secondary-200 rounded"></div>
          ))}
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="grid grid-cols-6 gap-4 px-4 py-4 border-b border-secondary-100">
            {[1, 2, 3, 4, 5, 6].map((j) => (
              <div key={j} className="h-4 bg-secondary-100 rounded"></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// Status Badge Component
function StatusBadge({ warranty }: { warranty: any }) {
  const { status, daysLeft } = getWarrantyStatus(warranty)
  
  if (status === 'claimed') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
        <AlertCircle className="w-3 h-3 mr-1" />
        เคลมแล้ว
      </span>
    )
  } else if (status === 'expired') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <XCircle className="w-3 h-3 mr-1" />
        หมดอายุ
      </span>
    )
  } else if (status === 'expiring') {
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

// Pagination Component
function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange,
  itemsPerPage,
  totalItems,
  onItemsPerPageChange 
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  itemsPerPage: number
  totalItems: number
  onItemsPerPageChange: (items: number) => void
}) {
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)
  
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-secondary-200">
      <div className="flex items-center gap-2 text-sm text-secondary-600">
        <span>แสดง</span>
        <select
          value={itemsPerPage}
          onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          className="px-3 py-1 border border-secondary-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          {ITEMS_PER_PAGE_OPTIONS.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <span>รายการ</span>
      </div>
      
      <div className="text-sm text-secondary-600">
        แสดง {startItem}-{endItem} จาก {totalItems} รายการ
      </div>
      
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-1 rounded hover:bg-secondary-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="หน้าแรก"
        >
          <ChevronsLeft className="w-5 h-5" />
        </button>
        
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1 rounded hover:bg-secondary-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="หน้าก่อนหน้า"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-1 mx-2">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNumber
            if (totalPages <= 5) {
              pageNumber = i + 1
            } else if (currentPage <= 3) {
              pageNumber = i + 1
            } else if (currentPage >= totalPages - 2) {
              pageNumber = totalPages - 4 + i
            } else {
              pageNumber = currentPage - 2 + i
            }
            
            return (
              <button
                key={i}
                onClick={() => onPageChange(pageNumber)}
                className={`min-w-[32px] h-8 px-2 rounded text-sm font-medium transition-colors ${
                  currentPage === pageNumber
                    ? 'bg-primary-500 text-white'
                    : 'hover:bg-secondary-100 text-secondary-700'
                }`}
              >
                {pageNumber}
              </button>
            )
          })}
        </div>
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1 rounded hover:bg-secondary-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="หน้าถัดไป"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-1 rounded hover:bg-secondary-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="หน้าสุดท้าย"
        >
          <ChevronsRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

export default function RegistrationsClientPage({ tenant }: RegistrationsPageProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'claimed' | 'expiring'>('all')
  const [brandFilter, setBrandFilter] = useState<string>('all')
  const [isExporting, setIsExporting] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE)
  const { error: showError, DialogComponents } = useDialog()
  
  // React Query
  const { 
    data: warranties = [], 
    isLoading,
    isError,
    refetch,
    isFetching
  } = useWarranties()
  
  // Get unique brands
  const uniqueBrands = useMemo(() => {
    return Array.from(new Set(warranties.map(w => w.productInfo.brandName))).sort()
  }, [warranties])
  
  // Filter warranties
  const filteredWarranties = useMemo(() => {
    let filtered = warranties
    
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(warranty => 
        warranty.customerInfo.name.toLowerCase().includes(searchLower) ||
        warranty.customerInfo.phone.includes(searchTerm) ||
        warranty.productInfo.productName.toLowerCase().includes(searchLower) ||
        warranty.productInfo.serialNumber?.toLowerCase().includes(searchLower) ||
        warranty.customerInfo.lineDisplayName.toLowerCase().includes(searchLower)
      )
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(warranty => {
        const { status } = getWarrantyStatus(warranty)
        return status === statusFilter
      })
    }
    
    // Brand filter
    if (brandFilter !== 'all') {
      filtered = filtered.filter(warranty => warranty.productInfo.brandName === brandFilter)
    }
    
    return filtered
  }, [warranties, searchTerm, statusFilter, brandFilter])
  
  // Pagination
  const totalItems = filteredWarranties.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  
  const paginatedWarranties = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredWarranties.slice(startIndex, endIndex)
  }, [filteredWarranties, currentPage, itemsPerPage])
  
  // Reset pagination when filters change
  const resetPagination = useCallback(() => {
    setCurrentPage(1)
  }, [])
  
  // Handle search
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    resetPagination()
  }
  
  // Handle filter changes
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value as any)
    resetPagination()
  }
  
  const handleBrandFilterChange = (value: string) => {
    setBrandFilter(value)
    resetPagination()
  }
  
  // Handle items per page change
  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items)
    setCurrentPage(1)
  }
  
  // Stats calculation
  const stats = useMemo(() => {
    const activeCount = warranties.filter(w => {
      const { status } = getWarrantyStatus(w)
      return status === 'active'
    }).length
    
    const expiringCount = warranties.filter(w => {
      const { status } = getWarrantyStatus(w)
      return status === 'expiring'
    }).length
    
    const expiredCount = warranties.filter(w => w.status === 'expired').length
    const claimedCount = warranties.filter(w => w.status === 'claimed').length
    
    return {
      total: warranties.length,
      active: activeCount,
      expiring: expiringCount,
      expired: expiredCount,
      claimed: claimedCount
    }
  }, [warranties])
  
  // Handle export
  const handleExport = async (type: 'all' | 'filtered') => {
    setIsExporting(true)
    setShowExportMenu(false)
    
    try {
      const companyName = tenant || 'Company'
      
      if (type === 'all') {
        exportWarrantiesToExcel(warranties, companyName)
      } else {
        const filters = {
          status: statusFilter !== 'all' ? statusFilter : undefined,
          brandName: brandFilter !== 'all' ? brandFilter : undefined
        }
        exportFilteredWarranties(filteredWarranties, companyName, filters)
      }
    } catch (error) {
      console.error('Export error:', error)
      showError('เกิดข้อผิดพลาดในการส่งออกข้อมูล')
    } finally {
      setIsExporting(false)
    }
  }
  
  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">ข้อมูลการลงทะเบียน</h1>
            <p className="text-sm text-secondary-600 mt-1">
              ข้อมูลลูกค้าที่ลงทะเบียนรับประกันสินค้า
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-20 bg-secondary-100 rounded"></div>
            </div>
          ))}
        </div>
        
        <RegistrationsSkeleton />
      </div>
    )
  }
  
  // Error state
  if (isError) {
    return (
      <div className="card">
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-secondary-900 mb-2">
            เกิดข้อผิดพลาดในการโหลดข้อมูล
          </h3>
          <p className="text-sm text-secondary-600 mb-6">
            ไม่สามารถโหลดข้อมูลการลงทะเบียนได้ กรุณาลองใหม่อีกครั้ง
          </p>
          <button
            onClick={() => refetch()}
            className="btn-primary inline-flex items-center"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            ลองใหม่
          </button>
        </div>
      </div>
    )
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
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="btn-outline inline-flex items-center"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw className={`w-5 h-5 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          
          <div className="relative export-dropdown">
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={isExporting || warranties.length === 0}
              className="btn-primary inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
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
            
            {/* Export Dropdown Menu */}
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
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">ทั้งหมด</p>
              <p className="text-2xl font-bold text-secondary-900">{stats.total}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">ใช้งานได้</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">ใกล้หมดอายุ</p>
              <p className="text-2xl font-bold text-orange-600">{stats.expiring}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-orange-500" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">หมดอายุ</p>
              <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">เคลมแล้ว</p>
              <p className="text-2xl font-bold text-purple-600">{stats.claimed}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-purple-500" />
          </div>
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
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              {searchTerm && (
                <button
                  onClick={() => handleSearchChange('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
          
          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">ทุกสถานะ</option>
              <option value="active">ใช้งานได้</option>
              <option value="expiring">ใกล้หมดอายุ</option>
              <option value="expired">หมดอายุ</option>
              <option value="claimed">เคลมแล้ว</option>
            </select>
          </div>
          
          {/* Brand Filter */}
          <div>
            <select
              value={brandFilter}
              onChange={(e) => handleBrandFilterChange(e.target.value)}
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
        <div className="card p-0 overflow-hidden">
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
                {paginatedWarranties.map((warranty) => (
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
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
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
                      <StatusBadge warranty={warranty} />
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
          
          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={totalItems}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          )}
        </div>
      )}
      
      {/* Dialog Components */}
      {DialogComponents}
    </div>
  )
}