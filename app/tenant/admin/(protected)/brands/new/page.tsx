'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  ArrowLeft, 
  Building2, 
  Upload, 
  Loader2,
  X,
  Info
} from 'lucide-react'
import { resizeImage, blobToFile, isValidImage, formatFileSize } from '@/lib/image-utils'
import { useLoadingRouter } from '@/hooks/useLoadingRouter'
import { useLoading } from '@/components/providers/LoadingProvider'

// Validation schema
const brandSchema = z.object({
  name: z.string().min(1, 'กรุณากรอกชื่อแบรนด์'),
  description: z.string().optional()
})

type BrandFormData = z.infer<typeof brandSchema>

export default function NewBrandPage() {
  const [loading, setLoading] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>('')
  const [resizing, setResizing] = useState(false)
  const [originalSize, setOriginalSize] = useState(0)
  const [resizedSize, setResizedSize] = useState(0)
  const router = useLoadingRouter()
  const { showLoading, hideLoading } = useLoading()
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<BrandFormData>({
    resolver: zodResolver(brandSchema)
  })
  
  // Get tenant from URL
  const getTenant = () => {
    if (typeof window === 'undefined') return ''
    const pathSegments = window.location.pathname.split('/')
    return pathSegments[1] // e.g., "abc-shop"
  }
  
  const [tenant, setTenant] = useState('')
  
  // Set tenant on client side
  useEffect(() => {
    setTenant(getTenant())
  }, [])
  
  // Handle logo upload with resize
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validate file type
    if (!isValidImage(file)) {
      alert('กรุณาเลือกไฟล์รูปภาพ (JPG, PNG, WebP)')
      return
    }
    
    // Store original size
    setOriginalSize(file.size)
    setResizing(true)
    
    try {
      // Resize image to max 500x500 with 80% quality
      const resizedBlob = await resizeImage(file, 500, 500, 0.8)
      const resizedFile = blobToFile(resizedBlob, file.name)
      
      setResizedSize(resizedFile.size)
      setLogoFile(resizedFile)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(resizedFile)
      
    } catch (error) {
      console.error('Error resizing image:', error)
      alert('เกิดข้อผิดพลาดในการประมวลผลรูปภาพ')
    } finally {
      setResizing(false)
    }
  }
  
  // Remove logo
  const removeLogo = () => {
    setLogoFile(null)
    setLogoPreview('')
    setOriginalSize(0)
    setResizedSize(0)
  }
  
  // Submit form
  const onSubmit = async (data: BrandFormData) => {
    setLoading(true)
    showLoading() // แสดง Shield Loading
    
    try {
      const formData = new FormData()
      formData.append('name', data.name)
      if (data.description) {
        formData.append('description', data.description)
      }
      if (logoFile) {
        formData.append('logo', logoFile)
      }
      
      const response = await fetch(`/api/brands`, {
        method: 'POST',
        body: formData
      })
      
      const result = await response.json()
      
      if (result.success) {
        router.push(`/${tenant}/admin/brands`)
      } else {
        hideLoading() // ซ่อน loading ถ้า error
        alert(result.message || 'เกิดข้อผิดพลาดในการเพิ่มแบรนด์')
      }
    } catch (error) {
      hideLoading() // ซ่อน loading ถ้า error
      alert('เกิดข้อผิดพลาดในการเพิ่มแบรนด์')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="max-w-2xl">
      {/* Page Header */}
      <div className="mb-6">
        <Link 
          href={`/${tenant}/admin/brands`}
          className="inline-flex items-center text-sm text-secondary-600 hover:text-secondary-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          กลับ
        </Link>
        
        <h1 className="text-2xl font-bold text-secondary-900">เพิ่มแบรนด์ใหม่</h1>
        <p className="text-sm text-secondary-600 mt-1">
          เพิ่มแบรนด์สินค้าที่คุณจำหน่ายในร้าน
        </p>
      </div>
      
      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card">
          <div className="space-y-6">
            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                โลโก้แบรนด์
              </label>
              
              <div className="flex items-start space-x-4">
                {logoPreview ? (
                  <div className="relative">
                    <div className="w-24 h-24 rounded-lg overflow-hidden border-2 border-secondary-200">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-lg border-2 border-dashed border-secondary-300 flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-secondary-400" />
                  </div>
                )}
                
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                    disabled={resizing}
                  />
                  <label
                    htmlFor="logo-upload"
                    className={`btn-outline cursor-pointer inline-flex items-center ${
                      resizing ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {resizing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        กำลังประมวลผล...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        เลือกรูปภาพ
                      </>
                    )}
                  </label>
                  <p className="text-xs text-secondary-500 mt-2">
                    รองรับไฟล์ JPG, PNG, WebP - ระบบจะย่อขนาดอัตโนมัติ
                  </p>
                  
                  {/* Show file size info */}
                  {originalSize > 0 && resizedSize > 0 && (
                    <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                        <div className="text-xs text-blue-700">
                          <p>ขนาดต้นฉบับ: {formatFileSize(originalSize)}</p>
                          <p>ขนาดหลังย่อ: {formatFileSize(resizedSize)} 
                            <span className="text-green-600 ml-1">
                              (-{Math.round((1 - resizedSize / originalSize) * 100)}%)
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Brand Name */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                ชื่อแบรนด์ *
              </label>
              <input
                type="text"
                {...register('name')}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="เช่น Samsung, Apple, Xiaomi"
              />
              {errors.name && (
                <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
              )}
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
                placeholder="รายละเอียดเกี่ยวกับแบรนด์นี้ (ไม่บังคับ)"
              />
            </div>
          </div>
        </div>
        
        {/* Submit Buttons */}
        <div className="flex items-center justify-end space-x-4">
          <Link
            href={`/${tenant}/admin/brands`}
            className="btn-outline"
          >
            ยกเลิก
          </Link>
          
          <button
            type="submit"
            disabled={loading || resizing}
            className="btn-primary flex items-center"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              <>
                <Building2 className="w-5 h-5 mr-2" />
                เพิ่มแบรนด์
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}