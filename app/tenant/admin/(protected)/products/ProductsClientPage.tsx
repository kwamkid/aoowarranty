'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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
  Filter,
  Building2,
  FileText
} from 'lucide-react'

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
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Filter products based on search
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.brandName?.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  // Get warranty period display
  const getWarrantyPeriod = (years: number, months: number) => {
    const parts = []
    if (years > 0) parts.push(`${years} ปี`)
    if (months > 0) parts.push(`${months} เดือน`)
    return parts.join(' ') || 'ไม่ระบุ'
  }
  
  // Handle brand filter
  const handleBrandFilter = (brandId: string) => {
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
      const response = await fetch(`/${tenant}/api/products/${productId}`, {
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
      
      {/* Filters Bar */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
            <input
              type="text"
              placeholder="ค้นหาสินค้า..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          
          {/* Brand Filter */}
          <div className="sm:w-48">
            <select
              value={selectedBrandId || ''}
              onChange={(e) => handleBrandFilter(e.target.value)}
              className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">ทุกแบรนด์</option>
              {brands.map(brand => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="card">
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-secondary-900 mb-2">
              {searchTerm || selectedBrandId ? 'ไม่พบสินค้าที่ค้นหา' : 'ยังไม่มีสินค้า'}
            </h3>
            <p className="text-sm text-secondary-600 mb-6">
              {searchTerm || selectedBrandId ? 'ลองค้นหาด้วยคำอื่น' : 'เริ่มต้นด้วยการเพิ่มสินค้าในระบบ'}
            </p>
            {!searchTerm && !selectedBrandId && (
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="card hover:shadow-lg transition-shadow relative">
              {deleting === product.id && (
                <div className="absolute inset-0 bg-white bg-opacity-75 rounded-xl flex items-center justify-center z-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                </div>
              )}
              
              <div className="space-y-4">
                {/* Product Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Product Image */}
                    <div className="w-20 h-20 rounded-lg bg-secondary-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {product.image ? (
                        <Image
                          src={product.image}
                          alt={product.name}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-10 h-10 text-secondary-400" />
                      )}
                    </div>
                    
                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-secondary-900 truncate">
                        {product.name}
                      </h3>
                      <p className="text-sm text-secondary-600 mt-1">
                        รุ่น: {product.model}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Building2 className="w-4 h-4 text-secondary-400" />
                        <span className="text-sm text-secondary-600">
                          {product.brandName}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions Dropdown */}
                  <div className="relative group">
                    <button className="p-1 hover:bg-secondary-100 rounded-lg transition-colors">
                      <MoreVertical className="w-5 h-5 text-secondary-600" />
                    </button>
                    
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-secondary-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                      <Link
                        href={`/${tenant}/admin/products/${product.id}/edit`}
                        className="flex items-center px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        แก้ไข
                      </Link>
                      <button
                        className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                        onClick={() => handleDelete(product.id, product.name)}
                        disabled={product.warrantyCount && product.warrantyCount > 0}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        ลบ
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Warranty Info */}
                <div className="bg-secondary-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="w-4 h-4 text-secondary-500" />
                    <span className="text-secondary-700">
                      ประกัน: {getWarrantyPeriod(product.warrantyYears, product.warrantyMonths)}
                    </span>
                  </div>
                </div>
                
                {/* Registration Count */}
                <div className="flex items-center justify-between pt-4 border-t border-secondary-100">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-secondary-400" />
                    <span className="text-sm text-secondary-600">
                      {product.warrantyCount || 0} การลงทะเบียน
                    </span>
                  </div>
                  
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    product.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-secondary-100 text-secondary-600'
                  }`}>
                    {product.isActive ? 'ใช้งาน' : 'ปิดใช้งาน'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}