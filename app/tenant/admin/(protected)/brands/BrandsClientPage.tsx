'use client'

import { useState } from 'react'
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
  Loader2
} from 'lucide-react'
import { useLoading } from '@/components/providers/LoadingProvider'
import { useDialog } from '@/hooks/useDialog'

interface Brand {
  id: string
  companyId: string
  name: string
  logo?: string
  description?: string
  isActive: boolean
  createdAt: string | Date
  createdBy: string
  productCount: number
}

interface BrandsPageProps {
  initialBrands: Brand[]
  tenant: string
}

export default function BrandsClientPage({ initialBrands = [], tenant }: BrandsPageProps) {
  const [brands, setBrands] = useState<Brand[]>(initialBrands || [])
  const [searchTerm, setSearchTerm] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const router = useRouter()
  const { showLoading, hideLoading } = useLoading()
  const { confirm, error, success, DialogComponents } = useDialog()
  
  // Filter brands based on search
  const filteredBrands = brands.filter(brand =>
    brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    brand.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
// Handle delete brand
  const handleDelete = async (brandId: string, brandName: string) => {
    try {
      const confirmed = await confirm({
        title: 'ยืนยันการลบแบรนด์',
        message: `ต้องการลบแบรนด์ "${brandName}" หรือไม่?\n\nการดำเนินการนี้ไม่สามารถย้อนกลับได้`,
        type: 'danger',
        confirmText: 'ลบแบรนด์',
        cancelText: 'ยกเลิก',
        requireConfirmation: brandName // ต้องพิมพ์ชื่อแบรนด์เพื่อยืนยัน
      })
      
      if (!confirmed) return
      
      setDeleting(brandId)
      showLoading() // แสดง loading
      
      const response = await fetch(`/api/brands/${brandId}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (result.success) {
        // Remove from local state
        setBrands(brands.filter(b => b.id !== brandId))
        success('ลบแบรนด์สำเร็จ')
        // Refresh to get updated counts
        router.refresh()
      } else {
        error(result.message || 'เกิดข้อผิดพลาดในการลบแบรนด์')
      }
    } catch (err) {
      console.error('Delete error:', err)
      error('เกิดข้อผิดพลาดในการลบแบรนด์')
    } finally {
      setDeleting(null)
      hideLoading() // ซ่อน loading
    }
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
        
        <Link
          href={`/${tenant}/admin/brands/new`}
          className="btn-primary inline-flex items-center justify-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          เพิ่มแบรนด์ใหม่
        </Link>
      </div>
      
      {/* Search Bar */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
          <input
            type="text"
            placeholder="ค้นหาแบรนด์..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
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
            <div key={brand.id} className="card hover:shadow-lg transition-shadow relative h-full">
              {deleting === brand.id && (
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
                        <Image
                          src={brand.logo}
                          alt={brand.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
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
                          {brand.productCount} สินค้า
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions Dropdown */}
                  <div className="relative group flex-shrink-0">
                    <button className="p-1 hover:bg-secondary-100 rounded-lg transition-colors">
                      <MoreVertical className="w-5 h-5 text-secondary-600" />
                    </button>
                    
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-secondary-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                      <Link
                        href={`/${tenant}/admin/brands/${brand.id}/edit`}
                        className="flex items-center px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        แก้ไข
                      </Link>
                      <button
                        className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                        onClick={() => handleDelete(brand.id, brand.name)}
                        disabled={brand.productCount > 0}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        ลบ
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Description - Expandable Content */}
                <div className="flex-1">
                  {brand.description && (
                    <p className="text-sm text-secondary-600 line-clamp-3">
                      {brand.description}
                    </p>
                  )}
                </div>
                
                {/* Footer - Always at Bottom */}
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
          ))}
        </div>
      )}
      
      {/* Render Dialog Components */}
      {DialogComponents}
    </div>
  )
}