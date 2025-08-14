'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Building2,
  MoreVertical,
  Package,
  Loader2,
  RefreshCw,
  X,
  Grid,
  List
} from 'lucide-react'
import DropdownMenu from '@/components/ui/DropdownMenu'
import { useDialog } from '@/hooks/useDialog'
import { useBrands, useDeleteBrand } from '@/lib/query/hooks/useBrands'

interface BrandsPageProps {
  tenant: string
}

// Brand Card Component
function BrandCard({ 
  brand, 
  tenant, 
  onDelete,
  isDeleting 
}: { 
  brand: any
  tenant: string
  onDelete: (id: string, name: string) => void
  isDeleting: boolean
}) {
  const router = useRouter()
  
  return (
    <div className="card hover:shadow-lg transition-shadow relative h-full">
      {isDeleting && (
        <div className="absolute inset-0 bg-white bg-opacity-75 rounded-xl flex items-center justify-center z-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      )}
      
      <div className="flex flex-col h-full">
        {/* Header Section */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4 min-w-0 flex-1">
            {/* Brand Logo */}
            <div className="w-16 h-16 rounded-lg bg-secondary-100 flex items-center justify-center overflow-hidden flex-shrink-0">
              {brand.logo ? (
                <img
                  src={brand.logo}
                  alt={brand.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <Building2 className="w-8 h-8 text-secondary-400" />
              )}
            </div>
            
            {/* Brand Info */}
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-secondary-900 truncate">
                {brand.name}
              </h3>
              <div className="flex items-center space-x-1 mt-1">
                <Package className="w-4 h-4 text-secondary-400 flex-shrink-0" />
                <span className="text-sm text-secondary-600">
                  {brand.productCount || 0} สินค้า
                </span>
              </div>
            </div>
          </div>
          
          {/* Actions Dropdown */}
          <DropdownMenu
            trigger={
              <button 
                className="p-1 hover:bg-secondary-100 rounded-lg transition-colors"
                disabled={isDeleting}
              >
                <MoreVertical className="w-5 h-5 text-secondary-600" />
              </button>
            }
            items={[
              {
                label: 'แก้ไข',
                icon: <Edit className="w-4 h-4" />,
                onClick: () => router.push(`/${tenant}/admin/brands/${brand.id}/edit`)
              },
              {
                label: 'ดูสินค้า',
                icon: <Package className="w-4 h-4" />,
                onClick: () => router.push(`/${tenant}/admin/products?brand=${brand.id}`)
              },
              {
                label: 'ลบ',
                icon: <Trash2 className="w-4 h-4" />,
                onClick: () => onDelete(brand.id, brand.name),
                className: 'text-red-600 hover:bg-red-50',
                disabled: (brand.productCount && brand.productCount > 0) || isDeleting
              }
            ]}
          />
        </div>
        
        {/* Description */}
        <div className="flex-1">
          {brand.description ? (
            <p className="text-sm text-secondary-600 line-clamp-3">
              {brand.description}
            </p>
          ) : (
            <p className="text-sm text-secondary-400 italic">
              ไม่มีคำอธิบาย
            </p>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-secondary-100">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            brand.isActive 
              ? 'bg-green-100 text-green-800' 
              : 'bg-secondary-100 text-secondary-600'
          }`}>
            {brand.isActive ? 'ใช้งาน' : 'ปิดใช้งาน'}
          </span>
          
          <Link
            href={`/${tenant}/admin/products?brand=${brand.id}`}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            ดูสินค้า →
          </Link>
        </div>
      </div>
    </div>
  )
}

// Skeleton Loader
function BrandsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="card animate-pulse">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-secondary-200 rounded-lg"></div>
              <div>
                <div className="h-5 bg-secondary-200 rounded w-32 mb-2"></div>
                <div className="h-4 bg-secondary-100 rounded w-20"></div>
              </div>
            </div>
            <div className="w-8 h-8 bg-secondary-100 rounded"></div>
          </div>
          <div className="h-12 bg-secondary-100 rounded mb-4"></div>
          <div className="flex justify-between items-center pt-4 border-t border-secondary-100">
            <div className="h-5 bg-secondary-100 rounded w-16"></div>
            <div className="h-4 bg-secondary-100 rounded w-20"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function BrandsClientPage({ tenant }: BrandsPageProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const { confirm, error: showError, success, DialogComponents } = useDialog()
  
  // React Query hooks
  const { 
    data: brands = [], 
    isLoading,
    isError,
    refetch,
    isFetching
  } = useBrands()
  
  const deleteProductMutation = useDeleteBrand({
    onSuccess: () => {
      success('ลบแบรนด์สำเร็จ')
    },
    onError: (error) => {
      showError('เกิดข้อผิดพลาดในการลบแบรนด์', error.message)
    }
  })
  
  // Filter brands based on search
  const filteredBrands = useMemo(() => {
    if (!searchTerm) return brands
    
    const searchLower = searchTerm.toLowerCase()
    return brands.filter(brand =>
      brand.name.toLowerCase().includes(searchLower) ||
      brand.description?.toLowerCase().includes(searchLower)
    )
  }, [brands, searchTerm])
  
  // Stats calculation
  const stats = useMemo(() => {
    const totalProducts = brands.reduce((sum, brand) => sum + (brand.productCount || 0), 0)
    const activeBrands = brands.filter(b => b.isActive).length
    const inactiveBrands = brands.length - activeBrands
    
    return {
      totalBrands: brands.length,
      totalProducts,
      activeBrands,
      inactiveBrands
    }
  }, [brands])
  
  // Handle delete brand
  const handleDelete = async (brandId: string, brandName: string) => {
    const confirmed = await confirm({
      title: 'ยืนยันการลบแบรนด์',
      message: `ต้องการลบแบรนด์ "${brandName}" หรือไม่?\n\nการดำเนินการนี้ไม่สามารถย้อนกลับได้`,
      type: 'danger',
      confirmText: 'ลบแบรนด์',
      cancelText: 'ยกเลิก',
      requireConfirmation: brandName
    })
    
    if (!confirmed) return
    
    deleteProductMutation.mutate(brandId)
  }
  
  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">จัดการแบรนด์</h1>
            <p className="text-sm text-secondary-600 mt-1">
              จัดการแบรนด์สินค้าที่จำหน่ายในร้าน
            </p>
          </div>
        </div>
        <BrandsSkeleton />
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
            ไม่สามารถโหลดข้อมูลแบรนด์ได้ กรุณาลองใหม่อีกครั้ง
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
          <h1 className="text-2xl font-bold text-secondary-900">จัดการแบรนด์</h1>
          <p className="text-sm text-secondary-600 mt-1">
            จัดการแบรนด์สินค้าที่จำหน่ายในร้าน
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
          
          <Link
            href={`/${tenant}/admin/brands/new`}
            className="btn-primary inline-flex items-center justify-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            เพิ่มแบรนด์ใหม่
          </Link>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">แบรนด์ทั้งหมด</p>
              <p className="text-2xl font-bold text-secondary-900">{stats.totalBrands}</p>
            </div>
            <Building2 className="w-8 h-8 text-primary-500" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">สินค้าทั้งหมด</p>
              <p className="text-2xl font-bold text-secondary-900">{stats.totalProducts}</p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">ใช้งาน</p>
              <p className="text-2xl font-bold text-green-600">{stats.activeBrands}</p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">ปิดใช้งาน</p>
              <p className="text-2xl font-bold text-secondary-600">{stats.inactiveBrands}</p>
            </div>
            <div className="w-8 h-8 bg-secondary-100 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-secondary-400 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Search Bar & View Mode */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
            <input
              type="text"
              placeholder="ค้นหาแบรนด์..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          
          {/* View Mode Toggle - Hidden for now as we only have grid */}
          {/* <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
              }`}
              title="มุมมองแบบตาราง"
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
              }`}
              title="มุมมองแบบรายการ"
            >
              <List className="w-5 h-5" />
            </button>
          </div> */}
        </div>
      </div>
      
      {/* Brands Grid */}
      {filteredBrands.length === 0 ? (
        <div className="card">
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-secondary-900 mb-2">
              {searchTerm ? 'ไม่พบแบรนด์ที่ค้นหา' : 'ยังไม่มีแบรนด์'}
            </h3>
            <p className="text-sm text-secondary-600 mb-6">
              {searchTerm ? 'ลองค้นหาด้วยคำอื่น' : 'เริ่มต้นด้วยการเพิ่มแบรนด์สินค้าที่คุณจำหน่าย'}
            </p>
            {!searchTerm && (
              <Link
                href={`/${tenant}/admin/brands/new`}
                className="btn-primary inline-flex items-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                เพิ่มแบรนด์แรก
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBrands.map((brand) => (
            <BrandCard
              key={brand.id}
              brand={brand}
              tenant={tenant}
              onDelete={handleDelete}
              isDeleting={deleteProductMutation.isPending && deleteProductMutation.variables === brand.id}
            />
          ))}
        </div>
      )}
      
      {/* Dialog Components */}
      {DialogComponents}
    </div>
  )
}