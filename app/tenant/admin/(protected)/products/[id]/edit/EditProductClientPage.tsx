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
  Upload, 
  Loader2,
  X,
  Calendar,
  CheckSquare,
  Save
} from 'lucide-react'

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

export default function EditProductClientPage({ 
  initialProduct, 
  brands, 
  tenant,
  productId 
}: EditProductClientPageProps) {
  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>(initialProduct.image || '')
  const [currentImage] = useState<string>(initialProduct.image || '')
  const router = useRouter()
  
  const {
    register,
    handleSubmit,
    formState: { errors }
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
  
  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('ไฟล์รูปภาพต้องมีขนาดไม่เกิน 5MB')
        return
      }
      
      setImageFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }
  
  // Remove image
  const removeImage = () => {
    setImageFile(null)
    setImagePreview('')
  }
  
  // Submit form
  const onSubmit = async (data: ProductFormData) => {
    setLoading(true)
    
    try {
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
      
      if (imageFile) {
        formData.append('image', imageFile)
      } else if (!imagePreview && currentImage) {
        // Image was removed
        formData.append('removeImage', 'true')
      }
      
      const response = await fetch(`/${tenant}/api/products/${productId}`, {
        method: 'PUT',
        body: formData
      })
      
      const result = await response.json()
      
      if (result.success) {
        router.push(`/${tenant}/admin/products`)
        router.refresh()
      } else {
        alert(result.message || 'เกิดข้อผิดพลาดในการแก้ไขสินค้า')
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการแก้ไขสินค้า')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="max-w-3xl">
      {/* Page Header */}
      <div className="mb-6">
        <Link 
          href={`/${tenant}/admin/products`}
          className="inline-flex items-center text-sm text-secondary-600 hover:text-secondary-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          กลับ
        </Link>
        
        <h1 className="text-2xl font-bold text-secondary-900">แก้ไขสินค้า</h1>
        <p className="text-sm text-secondary-600 mt-1">
          แก้ไขข้อมูลสินค้าและการตั้งค่าประกัน
        </p>
      </div>
      
      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info Card */}
        <div className="card">
          <h2 className="text-lg font-semibold text-secondary-900 mb-6">
            ข้อมูลสินค้า
          </h2>
          
          <div className="space-y-6">
            {/* Product Image */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                รูปภาพสินค้า
              </label>
              
              <div className="flex items-start space-x-4">
                {imagePreview ? (
                  <div className="relative">
                    <div className="w-32 h-32 rounded-lg overflow-hidden border-2 border-secondary-200">
                      <img
                        src={imagePreview}
                        alt="Product preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-lg border-2 border-dashed border-secondary-300 flex items-center justify-center">
                    <Package className="w-10 h-10 text-secondary-400" />
                  </div>
                )}
                
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="btn-outline cursor-pointer inline-flex items-center"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    เลือกรูปภาพ
                  </label>
                  <p className="text-xs text-secondary-500 mt-2">
                    รองรับไฟล์ JPG, PNG ขนาดไม่เกิน 5MB
                  </p>
                </div>
              </div>
            </div>
            
            {/* Brand Selection */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                แบรนด์ *
              </label>
              <select
                {...register('brandId')}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                rows={3}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="รายละเอียดเพิ่มเติมเกี่ยวกับสินค้า (ไม่บังคับ)"
              />
            </div>
            
            {/* Active Status */}
            <div>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  {...register('isActive')}
                  className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
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
                min="0"
                max="10"
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                min="0"
                max="11"
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                {...register('requireSerialNumber')}
                className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
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
            
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                {...register('requireReceiptImage')}
                className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
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
            
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                {...register('requirePurchaseLocation')}
                className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
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
            className="btn-outline"
          >
            ยกเลิก
          </Link>
          
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center"
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
  )
}