'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
  X
} from 'lucide-react'
import DropdownMenu from '@/components/ui/DropdownMenu'

interface Product {
  id: string
  companyId: string
  brandId: string
  brandName?: string
  name: string
  model: string
  warrantyYears: number
  warrantyMonths: number
  requiredFields: {
    serialNumber: boolean
    receiptImage: boolean
    purchaseLocation: boolean
  }
  description?: string
  image?: string
  isActive: boolean
  createdAt: string | Date
  warrantyCount?: number
}

interface ProductsPageProps {
  initialProducts: Product[]
  brands: { id: string; name: string }[]
  selectedBrandId?: string
  tenant: string
}

export default function ProductsClientPage({ 
  initialProducts = [], 
  brands = [],
  selectedBrandId,
  tenant 
}: ProductsPageProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts || [])
  const [searchTerm, setSearchTerm] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [selectedBrand, setSelectedBrand] = useState<string>(selectedBrandId || '')
  const router = useRouter()
  
  // Filter products based on search and brand
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.brandName?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesBrand = !selectedBrand || product.brandId === selectedBrand
    
    return matchesSearch && matchesBrand
  })
  
  // Get warranty period display
  const getWarrantyPeriod = (years: number, months: number) => {
    const parts = []
    if (years > 0) parts.push(`${years} ปี`)
    if (months > 0) parts.push(`${months} เดือน`)
    return parts.join(' ') || 'ไม่ระบุ'
  }
  
  // Handle brand filter
  const handleBrandFilter = (brandId: string) => {
    setSelectedBrand(brandId)
    if (brandId) {
      router.push(`/${tenant}/admin/products?brand=${brandId}`)
    } else {
      router.push(`/${tenant}/admin/products`)
    }
  }
  
  // Handle delete product
  const handleDelete = async (productId: string, productName: string) => {
    if (!confirm(`ต้องการลบสินค้า "${productName}" หรือไม่?\n\nการดำเนินการนี้ไม่สามารถย้อนกลับได้`)) {
      return
    }
    
    setDeleting(productId)
    
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (result.success) {
        // Remove from local state
        setProducts(products.filter(p => p.id !== productId))
        // Refresh to get updated counts
        router.refresh()
      } else {
        alert(result.message || 'เกิดข้อผิดพลาดในการลบสินค้า')
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการลบสินค้า')
    } finally {
      setDeleting(null)
    }
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
        
        <Link
          href={`/${tenant}/admin/products/new`}
          className="btn-primary inline-flex items-center justify-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          เพิ่มสินค้าใหม่
        </Link>
      </div>
      
      {/* Search Bar */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
          <input
            type="text"
            placeholder="ค้นหาสินค้า..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
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
            ทั้งหมด ({products.length})
          </button>
          
          {brands.map(brand => {
            const count = products.filter(p => p.brandId === brand.id).length
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
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full relative">
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
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-secondary-50 transition-colors relative">
                    {deleting === product.id && (
                      <td colSpan={6} className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                      </td>
                    )}
                    
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
                    
                    {/* Brand with Pill */}
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
                          <button className="p-1 hover:bg-secondary-100 rounded-lg transition-colors">
                            <MoreVertical className="w-5 h-5 text-secondary-600" />
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
                            onClick: () => handleDelete(product.id, product.name),
                            className: 'text-red-600 hover:bg-red-50',
                            disabled: product.warrantyCount && product.warrantyCount > 0
                          }
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}