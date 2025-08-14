'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  ArrowLeft, 
  Package, 
  Loader2,
  Calendar,
  CheckSquare,
  Save,
  Shield,
  CheckCircle
} from 'lucide-react'
import { useLoading } from '@/components/providers/LoadingProvider'
import { useDialog } from '@/hooks/useDialog'

// Validation schema
const productSchema = z.object({
  brandId: z.string().min(1, 'กรุณาเลือกแบรนด์'),
  name: z.string().min(1, 'กรุณากรอกชื่อสินค้า'),
  model: z.string().optional(),
  warrantyYears: z.number().min(0, 'ระยะเวลาประกันไม่ถูกต้อง'),
  warrantyMonths: z.number().min(0).max(11, 'เดือนต้องอยู่ระหว่าง 0-11'),
  description: z.string().optional(),
  isActive: z.boolean(),
  // Required fields
  requireSerialNumber: z.boolean(),
  requireReceiptImage: z.boolean(),
  requirePurchaseLocation: z.boolean()
})

type ProductFormData = z.infer<typeof productSchema>

interface Product {
  id: string
  companyId: string
  brandId: string
  name: string
  model?: string
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
}

interface EditProductClientPageProps {
  initialProduct: Product
  brands: { id: string; name: string }[]
  tenant: string
  productId: string
}

// Loading Overlay Component
function LoadingOverlay({ show, text }: { show: boolean; text: string }) {
  if (!show) return null
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 animate-scale-in">
        <div className="flex flex-col items-center space-y-4">
          {/* Animated Shield */}
          <div className="relative">
            <div className="absolute inset-0 blur-xl bg-primary-400 opacity-30 animate-pulse rounded-full" />
            <Shield className="w-16 h-16 text-primary-500 relative z-10 animate-spin-slow" />
          </div>
          
          {/* Loading Text */}
          <div className="text-center space-y-2">
            <p className="text-lg font-medium text-secondary-900">{text}</p>
            <p className="text-sm text-secondary-600">กรุณารอสักครู่...</p>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-secondary-200 rounded-full h-1.5 overflow-hidden">
            <div className="bg-primary-500 h-full rounded-full animate-progress" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function EditProductClientPage({ 
  initialProduct, 
  brands, 
  tenant,
  productId 
}: EditProductClientPageProps) {
  const [loading, setLoading] = useState(false)
  const [loadingText, setLoadingText] = useState('กำลังบันทึกข้อมูล')
  const router = useRouter()
  const { showLoading, hideLoading } = useLoading()
  const { error, success, DialogComponents } = useDialog()
  
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty }
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      brandId: initialProduct.brandId,
      name: initialProduct.name,
      model: initialProduct.model || '',
      warrantyYears: initialProduct.warrantyYears,
      warrantyMonths: initialProduct.warrantyMonths,
      description: initialProduct.description || '',
      isActive: initialProduct.isActive,
      requireSerialNumber: initialProduct.requiredFields.serialNumber,
      requireReceiptImage: initialProduct.requiredFields.receiptImage,
      requirePurchaseLocation: initialProduct.requiredFields.purchaseLocation
    }
  })
  
  // Submit form
  const onSubmit = async (data: ProductFormData) => {
    setLoading(true)
    setLoadingText('กำลังบันทึกข้อมูล')
    showLoading()
    
    try {
      // Simulate processing steps for better UX
      await new Promise(resolve => setTimeout(resolve, 500))
      setLoadingText('กำลังตรวจสอบข้อมูล...')
      
      const formData = new FormData()
      formData.append('brandId', data.brandId)
      formData.append('name', data.name)
      formData.append('model', data.model || '')
      formData.append('warrantyYears', data.warrantyYears.toString())
      formData.append('warrantyMonths', data.warrantyMonths.toString())
      formData.append('description', data.description || '')
      formData.append('isActive', data.isActive.toString())
      
      // Required fields
      formData.append('requiredFields', JSON.stringify({
        serialNumber: data.requireSerialNumber,
        receiptImage: data.requireReceiptImage,
        purchaseLocation: data.requirePurchaseLocation
      }))
      
      setLoadingText('กำลังอัพเดทข้อมูลสินค้า...')
      
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        body: formData
      })
      
      const result = await response.json()
      
      if (result.success) {
        setLoadingText('บันทึกสำเร็จ!')
        await success('บันทึกข้อมูลสำเร็จ', 'ข้อมูลสินค้าได้รับการอัพเดทเรียบร้อยแล้ว')
        
        // Small delay to show success state
        await new Promise(resolve => setTimeout(resolve, 500))
        
        router.push(`/${tenant}/admin/products`)
        router.refresh()
      } else {
        throw new Error(result.message || 'เกิดข้อผิดพลาดในการแก้ไขสินค้า')
      }
    } catch (err) {
      console.error('Update error:', err)
      hideLoading()
      setLoading(false)
      
      await error(
        'เกิดข้อผิดพลาดในการแก้ไขสินค้า',
        err instanceof Error ? err.message : 'กรุณาลองใหม่อีกครั้ง'
      )
    }
  }
  
  return (
    <>
      {/* Loading Overlay */}
      <LoadingOverlay show={loading} text={loadingText} />
      
      <div className="max-w-3xl">
        {/* Page Header */}
        <div className="mb-6">
          <Link 
            href={`/${tenant}/admin/products`}
            className="inline-flex items-center text-sm text-secondary-600 hover:text-secondary-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            กลับ
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-secondary-900">แก้ไขสินค้า</h1>
              <p className="text-sm text-secondary-600 mt-1">
                แก้ไขข้อมูลสินค้าและการตั้งค่าประกัน
              </p>
            </div>
            
            {isDirty && (
              <div className="flex items-center text-sm text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg">
                <div className="w-2 h-2 bg-amber-500 rounded-full mr-2 animate-pulse" />
                มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก
              </div>
            )}
          </div>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info Card */}
          <div className="card">
            <h2 className="text-lg font-semibold text-secondary-900 mb-6 flex items-center">
              <Package className="w-5 h-5 mr-2 text-primary-500" />
              ข้อมูลสินค้า
            </h2>
            
            <div className="space-y-6">
              {/* Brand Selection */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  แบรนด์ *
                </label>
                <select
                  {...register('brandId')}
                  disabled={loading}
                  className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-secondary-50 disabled:cursor-not-allowed"
                >
                  <option value="">เลือกแบรนด์</option>
                  {brands.map(brand => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
                {errors.brandId && (
                  <p className="text-red-600 text-sm mt-1">{errors.brandId.message}</p>
                )}
              </div>
              
              {/* Product Name */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  ชื่อสินค้า *
                </label>
                <input
                  type="text"
                  {...register('name')}
                  disabled={loading}
                  className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-secondary-50 disabled:cursor-not-allowed"
                  placeholder="เช่น Galaxy S24, iPhone 15 Pro"
                />
                {errors.name && (
                  <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>
              
              {/* Model */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  รุ่น/Model
                </label>
                <input
                  type="text"
                  {...register('model')}
                  disabled={loading}
                  className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-secondary-50 disabled:cursor-not-allowed"
                  placeholder="เช่น SM-S921, A2848 (ไม่บังคับ)"
                />
              </div>
              
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  คำอธิบาย
                </label>
                <textarea
                  {...register('description')}
                  disabled={loading}
                  rows={3}
                  className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-secondary-50 disabled:cursor-not-allowed"
                  placeholder="รายละเอียดเพิ่มเติมเกี่ยวกับสินค้า (ไม่บังคับ)"
                />
              </div>
              
              {/* Active Status */}
              <div>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('isActive')}
                    disabled={loading}
                    className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500 disabled:cursor-not-allowed"
                  />
                  <span className="text-sm font-medium text-secondary-700">
                    เปิดใช้งานสินค้านี้
                  </span>
                </label>
                <p className="text-xs text-secondary-500 mt-1 ml-7">
                  หากปิดใช้งาน จะไม่สามารถเลือกสินค้านี้เมื่อลงทะเบียนประกัน
                </p>
              </div>
            </div>
          </div>
          
          {/* Warranty Settings Card */}
          <div className="card">
            <h2 className="text-lg font-semibold text-secondary-900 mb-6 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-primary-500" />
              ระยะเวลาประกัน
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  จำนวนปี *
                </label>
                <input
                  type="number"
                  {...register('warrantyYears', { valueAsNumber: true })}
                  disabled={loading}
                  min="0"
                  max="10"
                  className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-secondary-50 disabled:cursor-not-allowed"
                />
                {errors.warrantyYears && (
                  <p className="text-red-600 text-sm mt-1">{errors.warrantyYears.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  จำนวนเดือน
                </label>
                <input
                  type="number"
                  {...register('warrantyMonths', { valueAsNumber: true })}
                  disabled={loading}
                  min="0"
                  max="11"
                  className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-secondary-50 disabled:cursor-not-allowed"
                />
                {errors.warrantyMonths && (
                  <p className="text-red-600 text-sm mt-1">{errors.warrantyMonths.message}</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Required Fields Card */}
          <div className="card">
            <h2 className="text-lg font-semibold text-secondary-900 mb-6 flex items-center">
              <CheckSquare className="w-5 h-5 mr-2 text-primary-500" />
              ข้อมูลที่ต้องการเมื่อลงทะเบียน
            </h2>
            
            <div className="space-y-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('requireSerialNumber')}
                  disabled={loading}
                  className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500 disabled:cursor-not-allowed"
                />
                <div>
                  <span className="text-sm font-medium text-secondary-700">
                    Serial Number / หมายเลขเครื่อง
                  </span>
                  <p className="text-xs text-secondary-500">
                    ลูกค้าต้องกรอก Serial Number เมื่อลงทะเบียน
                  </p>
                </div>
              </label>
              
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('requireReceiptImage')}
                  disabled={loading}
                  className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500 disabled:cursor-not-allowed"
                />
                <div>
                  <span className="text-sm font-medium text-secondary-700">
                    รูปใบเสร็จ
                  </span>
                  <p className="text-xs text-secondary-500">
                    ลูกค้าต้องอัพโหลดรูปใบเสร็จเมื่อลงทะเบียน
                  </p>
                </div>
              </label>
              
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('requirePurchaseLocation')}
                  disabled={loading}
                  className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500 disabled:cursor-not-allowed"
                />
                <div>
                  <span className="text-sm font-medium text-secondary-700">
                    สถานที่ซื้อ
                  </span>
                  <p className="text-xs text-secondary-500">
                    ลูกค้าต้องระบุสถานที่ซื้อสินค้า
                  </p>
                </div>
              </label>
            </div>
          </div>
          
          {/* Submit Buttons */}
          <div className="flex items-center justify-end space-x-4">
            <Link
              href={`/${tenant}/admin/products`}
              className={`btn-outline ${loading ? 'pointer-events-none opacity-50' : ''}`}
            >
              ยกเลิก
            </Link>
            
            <button
              type="submit"
              disabled={loading || !isDirty}
              className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  บันทึกการเปลี่ยนแปลง
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      
      {/* Dialog Components */}
      {DialogComponents}
      
      {/* Add styles for animations */}
      <style jsx>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes progress {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
        
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
        
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
        
        .animate-progress {
          animation: progress 2s ease-out infinite;
        }
      `}</style>
    </>
  )
}