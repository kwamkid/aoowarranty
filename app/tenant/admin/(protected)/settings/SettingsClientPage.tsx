'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  Settings, 
  Building2, 
  Upload, 
  Loader2,
  X,
  Save,
  Info,
  MapPin,
  Phone,
  Mail,
  Globe,
  MessageSquare,
  Check,
  AlertCircle
} from 'lucide-react'
import { resizeImage, blobToFile, isValidImage, formatFileSize } from '@/lib/image-utils'
import { useDialog } from '@/hooks/useDialog'

// Validation schema
const settingsSchema = z.object({
  name: z.string().min(1, 'กรุณากรอกชื่อบริษัท'),
  address: z.string().min(1, 'กรุณากรอกที่อยู่'),
  district: z.string().min(1, 'กรุณากรอกตำบล/แขวง'),
  amphoe: z.string().min(1, 'กรุณากรอกอำเภอ/เขต'),
  province: z.string().min(1, 'กรุณากรอกจังหวัด'),
  postcode: z.string().regex(/^\d{5}$/, 'รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก'),
  phone: z.string().min(1, 'กรุณากรอกเบอร์โทรศัพท์'),
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง'),
  website: z.string().optional(),
  lineChannelId: z.string().optional()
})

type SettingsFormData = z.infer<typeof settingsSchema>

interface SettingsPageProps {
  initialData: {
    id: string
    name: string
    slug: string
    logo: string
    address: string
    district: string
    amphoe: string
    province: string
    postcode: string
    phone: string
    email: string
    website: string
    lineChannelId: string
  }
  tenant: string
}

export default function SettingsClientPage({ initialData, tenant }: SettingsPageProps) {
  const [loading, setLoading] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>(initialData.logo)
  const [currentLogo, setCurrentLogo] = useState<string>(initialData.logo)
  const [resizing, setResizing] = useState(false)
  const [originalSize, setOriginalSize] = useState(0)
  const [resizedSize, setResizedSize] = useState(0)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const router = useRouter()
  const { success, error, DialogComponents } = useDialog()
  
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty }
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: initialData.name,
      address: initialData.address,
      district: initialData.district,
      amphoe: initialData.amphoe,
      province: initialData.province,
      postcode: initialData.postcode,
      phone: initialData.phone,
      email: initialData.email,
      website: initialData.website,
      lineChannelId: initialData.lineChannelId
    }
  })
  
  // Handle logo upload with resize
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validate file type
    if (!isValidImage(file)) {
      error('กรุณาเลือกไฟล์รูปภาพ (JPG, PNG, WebP)')
      return
    }
    
    // Store original size
    setOriginalSize(file.size)
    setResizing(true)
    
    try {
      // Resize image to max 300x300 for logo (smaller than brand/product)
      const resizedBlob = await resizeImage(file, 300, 300, 0.8)
      const resizedFile = blobToFile(resizedBlob, file.name)
      
      setResizedSize(resizedFile.size)
      setLogoFile(resizedFile)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(resizedFile)
      
    } catch (err) {
      console.error('Error resizing image:', err)
      error('เกิดข้อผิดพลาดในการประมวลผลรูปภาพ')
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
  const onSubmit = async (data: SettingsFormData) => {
    setLoading(true)
    setSaveStatus('saving')
    
    try {
      const formData = new FormData()
      
      // Add all form fields
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString())
        }
      })
      
      // Add logo if changed
      if (logoFile) {
        formData.append('logo', logoFile)
      } else if (!logoPreview && currentLogo) {
        // Logo was removed
        formData.append('removeLogo', 'true')
      }
      
      const response = await fetch('/api/companies/settings', {
        method: 'PUT',
        body: formData
      })
      
      const result = await response.json()
      
      if (result.success) {
        setSaveStatus('saved')
        success('บันทึกการตั้งค่าสำเร็จ')
        
        // Update current logo
        if (result.data?.logo) {
          setCurrentLogo(result.data.logo)
        }
        
        // Refresh to update header logo
        setTimeout(() => {
          router.refresh()
          setSaveStatus('idle')
        }, 2000)
      } else {
        setSaveStatus('error')
        error(result.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล')
      }
    } catch (err) {
      setSaveStatus('error')
      error('เกิดข้อผิดพลาดในการบันทึกข้อมูล')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">ตั้งค่าระบบ</h1>
        <p className="text-sm text-secondary-600 mt-1">
          จัดการข้อมูลบริษัทและการตั้งค่าต่างๆ
        </p>
      </div>
      
      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Company Logo Card */}
        <div className="card">
          <h2 className="text-lg font-semibold text-secondary-900 mb-6 flex items-center">
            <Building2 className="w-5 h-5 mr-2 text-primary-500" />
            โลโก้บริษัท
          </h2>
          
          <div>
            <div className="flex items-start space-x-6">
              {logoPreview ? (
                <div className="relative">
                  <div className="w-32 h-32 rounded-lg overflow-hidden border-2 border-secondary-200">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-full h-full object-contain bg-secondary-50"
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
                <div className="w-32 h-32 rounded-lg border-2 border-dashed border-secondary-300 flex items-center justify-center bg-secondary-50">
                  <Building2 className="w-10 h-10 text-secondary-400" />
                </div>
              )}
              
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logo-upload"
                  disabled={resizing || loading}
                />
                <label
                  htmlFor="logo-upload"
                  className={`btn-outline cursor-pointer inline-flex items-center ${
                    resizing || loading ? 'opacity-50 cursor-not-allowed' : ''
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
                  รองรับไฟล์ JPG, PNG, WebP - ขนาดแนะนำ 300x300 พิกเซล
                </p>
                <p className="text-xs text-secondary-500">
                  ระบบจะย่อขนาดอัตโนมัติเพื่อประหยัดพื้นที่
                </p>
                
                {/* Show file size info */}
                {originalSize > 0 && resizedSize > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div className="text-xs text-blue-700">
                        <p>ขนาดต้นฉบับ: {formatFileSize(originalSize)}</p>
                        <p>ขนาดหลังย่อ: {formatFileSize(resizedSize)} 
                          <span className="text-green-600 ml-1 font-medium">
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
        </div>
        
        {/* Company Info Card */}
        <div className="card">
          <h2 className="text-lg font-semibold text-secondary-900 mb-6 flex items-center">
            <Building2 className="w-5 h-5 mr-2 text-primary-500" />
            ข้อมูลบริษัท
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                ชื่อบริษัท/ร้านค้า *
              </label>
              <input
                type="text"
                {...register('name')}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              {errors.name && (
                <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Subdomain
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={initialData.slug}
                    disabled
                    className="flex-1 px-4 py-2 bg-secondary-100 border border-secondary-300 rounded-lg text-secondary-600"
                  />
                  <span className="text-sm text-secondary-500">.aoowarranty.com</span>
                </div>
                <p className="text-xs text-secondary-500 mt-1">
                  ไม่สามารถเปลี่ยนแปลงได้
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Address Card */}
        <div className="card">
          <h2 className="text-lg font-semibold text-secondary-900 mb-6 flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-primary-500" />
            ที่อยู่บริษัท
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                ที่อยู่ *
              </label>
              <input
                type="text"
                {...register('address')}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="เลขที่ ถนน ซอย"
              />
              {errors.address && (
                <p className="text-red-600 text-sm mt-1">{errors.address.message}</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  ตำบล/แขวง *
                </label>
                <input
                  type="text"
                  {...register('district')}
                  className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                {errors.district && (
                  <p className="text-red-600 text-sm mt-1">{errors.district.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  อำเภอ/เขต *
                </label>
                <input
                  type="text"
                  {...register('amphoe')}
                  className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                {errors.amphoe && (
                  <p className="text-red-600 text-sm mt-1">{errors.amphoe.message}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  จังหวัด *
                </label>
                <input
                  type="text"
                  {...register('province')}
                  className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                {errors.province && (
                  <p className="text-red-600 text-sm mt-1">{errors.province.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  รหัสไปรษณีย์ *
                </label>
                <input
                  type="text"
                  {...register('postcode')}
                  maxLength={5}
                  className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="10110"
                />
                {errors.postcode && (
                  <p className="text-red-600 text-sm mt-1">{errors.postcode.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Contact Card */}
        <div className="card">
          <h2 className="text-lg font-semibold text-secondary-900 mb-6 flex items-center">
            <Phone className="w-5 h-5 mr-2 text-primary-500" />
            ข้อมูลติดต่อ
          </h2>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  เบอร์โทรศัพท์ *
                </label>
                <input
                  type="text"
                  {...register('phone')}
                  className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="02-xxx-xxxx, 08x-xxx-xxxx"
                />
                {errors.phone && (
                  <p className="text-red-600 text-sm mt-1">{errors.phone.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  อีเมล *
                </label>
                <input
                  type="email"
                  {...register('email')}
                  className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="info@company.com"
                />
                {errors.email && (
                  <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                <Globe className="w-4 h-4 inline mr-1" />
                เว็บไซต์
              </label>
              <input
                type="url"
                {...register('website')}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="https://www.company.com"
              />
            </div>
          </div>
        </div>
        
        {/* LINE Integration Card */}
        <div className="card">
          <h2 className="text-lg font-semibold text-secondary-900 mb-6 flex items-center">
            <MessageSquare className="w-5 h-5 mr-2 text-green-500" />
            การเชื่อมต่อ LINE
          </h2>
          
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              LINE Channel ID
            </label>
            <input
              type="text"
              {...register('lineChannelId')}
              className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="1234567890"
            />
            <p className="text-xs text-secondary-500 mt-1">
              สำหรับการเชื่อมต่อ LINE Login (ไม่บังคับ)
            </p>
          </div>
        </div>
        
        {/* Submit Button */}
        <div className="flex items-center justify-end space-x-4">
          <button
            type="submit"
            disabled={loading || resizing || !isDirty}
            className={`btn-primary flex items-center ${
              (!isDirty || loading) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                กำลังบันทึก...
              </>
            ) : saveStatus === 'saved' ? (
              <>
                <Check className="w-5 h-5 mr-2" />
                บันทึกแล้ว
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                บันทึกการเปลี่ยนแปลง
              </>
            )}
          </button>
        </div>
        
        {/* Save Status Message */}
        {!isDirty && saveStatus === 'idle' && (
          <div className="flex items-center justify-center text-sm text-secondary-500">
            <AlertCircle className="w-4 h-4 mr-1" />
            ไม่มีการเปลี่ยนแปลงที่ต้องบันทึก
          </div>
        )}
      </form>
      
      {/* Render Dialog Components */}
      {DialogComponents}
    </div>
  )
}