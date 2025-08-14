'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Package,
  MoreVertical,
  Calendar,
  Loader2,
  FileText,
  X,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react'
import DropdownMenu from '@/components/ui/DropdownMenu'
import { useDialog } from '@/hooks/useDialog'
import { useProducts, useDeleteProduct } from '@/lib/query/hooks/useProducts'
import { useBrands } from '@/lib/query/hooks/useBrands'

interface ProductsPageProps {
  tenant: string
}

// Items per page options
const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100]
const DEFAULT_ITEMS_PER_PAGE = 20

// Skeleton loader component
function ProductsSkeleton() {
  return (
    <div className="card">
      <div className="animate-pulse">
        <div className="space-y-3">
          {/* Table header skeleton */}
          <div className="grid grid-cols-6 gap-4 px-4 py-3 border-b border-secondary-200">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-4 bg-secondary-200 rounded"></div>
            ))}
          </div>
          {/* Table rows skeleton */}
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="grid grid-cols-6 gap-4 px-4 py-4">
              {[1, 2, 3, 4, 5, 6].map((j) => (
                <div key={j} className="h-4 bg-secondary-100 rounded"></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Pagination component
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
      {/* Items per page selector */}
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
      
      {/* Page info */}
      <div className="text-sm text-secondary-600">
        แสดง {startItem}-{endItem} จาก {totalItems} รายการ
      </div>
      
      {/* Pagination buttons */}
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
        
        {/* Page numbers */}
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

export default function ProductsClientPage({ tenant }: ProductsPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE)
  const { confirm, error: showError, success, DialogComponents } = useDialog()
  
  // Get selected brand from URL
  const selectedBrand = searchParams.get('brand') || ''
  
  // React Query hooks
  const { 
    data: allProducts = [], 
    isLoading: productsLoading,
    isError: productsError,
    refetch: refetchProducts,
    isFetching: productsFetching
  } = useProducts() // ดึงสินค้าทั้งหมดไม่ filter by brand
  
  const { 
    data: brands = [], 
    isLoading: brandsLoading 
  } = useBrands()
  
  const deleteProductMutation = useDeleteProduct({
    onSuccess: () => {
      success('ลบสินค้าสำเร็จ')
    },
    onError: (error) => {
      showError('เกิดข้อผิดพลาดในการลบสินค้า', error.message)
    }
  })
  
  // Filter products based on brand selection and search
  const filteredProducts = useMemo(() => {
    let filtered = allProducts
    
    // Filter by selected brand
    if (selectedBrand) {
      filtered = filtered.filter(product => product.brandId === selectedBrand)
    }
    
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchLower) ||
        product.model?.toLowerCase().includes(searchLower) ||
        product.brandName?.toLowerCase().includes(searchLower)
      )
    }
    
    return filtered
  }, [allProducts, selectedBrand, searchTerm])
  
  // Calculate brand counts from ALL products (not filtered)
  const brandCounts = useMemo(() => {
    const counts = new Map<string, number>()
    allProducts.forEach(product => {
      const count = counts.get(product.brandId) || 0
      counts.set(product.brandId, count + 1)
    })
    return counts
  }, [allProducts])
  
  // Pagination calculations
  const totalItems = filteredProducts.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  
  // Reset to page 1 when filters change
  const resetPagination = useCallback(() => {
    setCurrentPage(1)
  }, [])
  
  // Get paginated products
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredProducts.slice(startIndex, endIndex)
  }, [filteredProducts, currentPage, itemsPerPage])
  
  // Handle search change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    resetPagination()
  }
  
  // Handle brand filter (ไม่ต้อง refetch data)
  const handleBrandFilter = (brandId: string) => {
    const params = new URLSearchParams(searchParams)
    if (brandId) {
      params.set('brand', brandId)
    } else {
      params.delete('brand')
    }
    // ใช้ replace แทน push เพื่อไม่เพิ่ม history
    router.replace(`/${tenant}/admin/products?${params.toString()}`, { scroll: false })
    resetPagination()
  }
  
  // Handle items per page change
  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items)
    setCurrentPage(1)
  }
  
  // Get warranty period display
  const getWarrantyPeriod = (years: number, months: number) => {
    const parts = []
    if (years > 0) parts.push(`${years} ปี`)
    if (months > 0) parts.push(`${months} เดือน`)
    return parts.join(' ') || 'ไม่ระบุ'
  }
  
  // Handle delete product
  const handleDelete = async (productId: string, productName: string, productModel?: string) => {
    const displayName = productModel ? `${productName} - ${productModel}` : productName
    
    const confirmed = await confirm({
      title: 'ยืนยันการลบสินค้า',
      message: `ต้องการลบสินค้า "${displayName}" หรือไม่?\n\nการดำเนินการนี้ไม่สามารถย้อนกลับได้`,
      type: 'danger',
      confirmText: 'ลบสินค้า',
      cancelText: 'ยกเลิก',
      requireConfirmation: productName
    })
    
    if (!confirmed) return
    
    deleteProductMutation.mutate(productId)
  }
  
  // Loading state
  if (productsLoading || brandsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">จัดการสินค้า</h1>
            <p className="text-sm text-secondary-600 mt-1">
              จัดการข้อมูลสินค้าและระยะเวลาประกัน
            </p>
          </div>
        </div>
        <ProductsSkeleton />
      </div>
    )
  }
  
  // Error state
  if (productsError) {
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
            ไม่สามารถโหลดข้อมูลสินค้าได้ กรุณาลองใหม่อีกครั้ง
          </p>
          <button
            onClick={() => refetchProducts()}
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
          <h1 className="text-2xl font-bold text-secondary-900">จัดการสินค้า</h1>
          <p className="text-sm text-secondary-600 mt-1">
            จัดการข้อมูลสินค้าและระยะเวลาประกัน
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetchProducts()}
            disabled={productsFetching}
            className="btn-outline inline-flex items-center"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw className={`w-5 h-5 ${productsFetching ? 'animate-spin' : ''}`} />
          </button>
          
          <Link
            href={`/${tenant}/admin/products/new`}
            className="btn-primary inline-flex items-center justify-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            เพิ่มสินค้าใหม่
          </Link>
        </div>
      </div>
      
      {/* Search Bar */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
          <input
            type="text"
            placeholder="ค้นหาสินค้า..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
      
      {/* Brand Filter Pills */}
      <div className="card">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleBrandFilter('')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              !selectedBrand 
                ? 'bg-primary-500 text-white' 
                : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
            }`}
          >
            ทั้งหมด ({allProducts.length})
          </button>
          
          {brands.map(brand => {
            const count = brandCounts.get(brand.id) || 0
            return (
              <button
                key={brand.id}
                onClick={() => handleBrandFilter(brand.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center ${
                  selectedBrand === brand.id 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                }`}
              >
                {brand.name} ({count})
                {selectedBrand === brand.id && (
                  <X 
                    className="w-4 h-4 ml-2" 
                    onClick={(e) => {
                      e.stopPropagation()
                      handleBrandFilter('')
                    }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>
      
      {/* Products Table */}
      {filteredProducts.length === 0 ? (
        <div className="card">
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-secondary-900 mb-2">
              {searchTerm || selectedBrand ? 'ไม่พบสินค้าที่ค้นหา' : 'ยังไม่มีสินค้า'}
            </h3>
            <p className="text-sm text-secondary-600 mb-6">
              {searchTerm || selectedBrand ? 'ลองค้นหาด้วยคำอื่น' : 'เริ่มต้นด้วยการเพิ่มสินค้าในระบบ'}
            </p>
            {!searchTerm && !selectedBrand && (
              <Link
                href={`/${tenant}/admin/products/new`}
                className="btn-primary inline-flex items-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                เพิ่มสินค้าแรก
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="card p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-secondary-200">
                  <th className="text-left px-4 py-3 text-sm font-medium text-secondary-700">สินค้า</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-secondary-700">แบรนด์</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-secondary-700">ประกัน</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-secondary-700 hidden md:table-cell">ลงทะเบียน</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-secondary-700">สถานะ</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-secondary-700">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {paginatedProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-secondary-50 transition-colors">
                    {/* Product Name & Model */}
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium text-secondary-900">
                          {product.name}
                        </p>
                        {product.model && (
                          <p className="text-xs text-secondary-500">
                            รุ่น: {product.model}
                          </p>
                        )}
                      </div>
                    </td>
                    
                    {/* Brand */}
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {product.brandName}
                      </span>
                    </td>
                    
                    {/* Warranty */}
                    <td className="px-4 py-4">
                      <div className="flex items-center text-sm">
                        <Calendar className="w-4 h-4 text-secondary-400 mr-1" />
                        <span className="text-secondary-700">
                          {getWarrantyPeriod(product.warrantyYears, product.warrantyMonths)}
                        </span>
                      </div>
                    </td>
                    
                    {/* Registration Count */}
                    <td className="px-4 py-4 text-center hidden md:table-cell">
                      <div className="flex items-center justify-center text-sm">
                        <FileText className="w-4 h-4 text-secondary-400 mr-1" />
                        <span className="text-secondary-700">
                          {product.warrantyCount || 0}
                        </span>
                      </div>
                    </td>
                    
                    {/* Status */}
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-secondary-100 text-secondary-600'
                      }`}>
                        {product.isActive ? 'ใช้งาน' : 'ปิดใช้งาน'}
                      </span>
                    </td>
                    
                    {/* Actions */}
                    <td className="px-4 py-4 text-right">
                      <DropdownMenu
                        trigger={
                          <button 
                            className="p-1 hover:bg-secondary-100 rounded-lg transition-colors"
                            disabled={deleteProductMutation.isPending}
                          >
                            {deleteProductMutation.isPending && deleteProductMutation.variables === product.id ? (
                              <Loader2 className="w-5 h-5 text-secondary-600 animate-spin" />
                            ) : (
                              <MoreVertical className="w-5 h-5 text-secondary-600" />
                            )}
                          </button>
                        }
                        items={[
                          {
                            label: 'แก้ไข',
                            icon: <Edit className="w-4 h-4" />,
                            onClick: () => router.push(`/${tenant}/admin/products/${product.id}/edit`)
                          },
                          {
                            label: 'ลบ',
                            icon: <Trash2 className="w-4 h-4" />,
                            onClick: () => handleDelete(product.id, product.name, product.model),
                            className: 'text-red-600 hover:bg-red-50',
                            disabled: (product.warrantyCount && product.warrantyCount > 0) || deleteProductMutation.isPending
                          }
                        ]}
                      />
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