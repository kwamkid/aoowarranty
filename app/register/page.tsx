'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Upload, 
  Loader2, 
  CheckCircle,
  ArrowLeft,
  ExternalLink,
  X,
  Eye,
  EyeOff,
  User,
  Shield
} from 'lucide-react'
import { createSlug, isValidSlug } from '@/lib/utils'

// Validation Schema
const companySchema = z.object({
  name: z.string().min(2, 'ชื่อบริษัทต้องมีอย่างน้อย 2 ตัวอักษร'),
  email: z.string().email('กรุณากรอกอีเมลที่ถูกต้อง'),
  phone: z.string().min(9, 'กรุณากรอกเบอร์โทรศัพท์ที่ถูกต้อง'),
  website: z.string().url('กรุณากรอก URL ที่ถูกต้อง').optional().or(z.literal('')),
  
  // Admin Account fields
  adminName: z.string().min(2, 'กรุณากรอกชื่อผู้ดูแลระบบ'),
  adminPassword: z.string()
    .min(8, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'รหัสผ่านต้องมีตัวอักษรเล็ก ใหญ่ และตัวเลข'),
  confirmPassword: z.string(),
  
  // Address fields
  address: z.string().min(5, 'กรุณากรอกที่อยู่'),
  district: z.string().min(2, 'กรุณาเลือกแขวง/ตำบล'),
  amphoe: z.string().min(2, 'กรุณาเลือกเขต/อำเภอ'),
  province: z.string().min(2, 'กรุณาเลือกจังหวัด'),
  postcode: z.string().regex(/^\d{5}$/, 'รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก'),
}).refine((data) => data.adminPassword === data.confirmPassword, {
  message: "รหัสผ่านไม่ตรงกัน",
  path: ["confirmPassword"],
})

type CompanyFormData = z.infer<typeof companySchema>

export default function CompanyRegistrationPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>('')
  const [generatedSlug, setGeneratedSlug] = useState('')
  const [subdomainUrl, setSubdomainUrl] = useState('')
  
  // Subdomain checking states
  const [subdomainStatus, setSubdomainStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle')
  const [subdomainMessage, setSubdomainMessage] = useState('')
  const [checkTimeout, setCheckTimeout] = useState<NodeJS.Timeout | null>(null)
  
  // Password visibility states
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema)
  })

  const companyName = watch('name')

  // Check subdomain availability
  const checkSubdomainAvailability = async (slug: string) => {
    if (!slug || slug.length < 3) {
      setSubdomainStatus('idle')
      setSubdomainMessage('')
      return
    }

    if (!isValidSlug(slug)) {
      setSubdomainStatus('invalid')
      setSubdomainMessage('ชื่อเว็บไซต์ต้องเป็นตัวอังกฤษเล็ก ตัวเลข และ - เท่านั้น')
      return
    }

    setSubdomainStatus('checking')
    setSubdomainMessage('กำลังตรวจสอบ...')

    try {
      const response = await fetch(`/api/companies/check-subdomain?slug=${encodeURIComponent(slug)}`)
      const result = await response.json()

      if (result.success) {
        if (result.available) {
          setSubdomainStatus('available')
          setSubdomainMessage(result.message)
        } else {
          setSubdomainStatus('taken')
          setSubdomainMessage(result.message)
        }
      } else {
        setSubdomainStatus('invalid')
        setSubdomainMessage(result.message)
      }
    } catch (error) {
      setSubdomainStatus('invalid')
      setSubdomainMessage('เกิดข้อผิดพลาดในการตรวจสอบ')
    }
  }

  // Handle subdomain change with debounce
  const handleSubdomainChange = (value: string) => {
    const cleanValue = value.toLowerCase().replace(/[^a-z0-9-]/g, '')
    setGeneratedSlug(cleanValue)
    
    // Update current domain
    const currentDomain = typeof window !== 'undefined' ? window.location.host : 'localhost:3000'
    setSubdomainUrl(`${cleanValue}.${currentDomain}`)

    // Clear previous timeout
    if (checkTimeout) {
      clearTimeout(checkTimeout)
    }

    // Set new timeout for checking (debounce)
    const newTimeout = setTimeout(() => {
      checkSubdomainAvailability(cleanValue)
    }, 500)
    
    setCheckTimeout(newTimeout)
  }

  // Auto-generate slug when company name changes
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    setValue('name', name)
    
    if (name.length > 2) {
      const slug = createSlug(name)
      handleSubdomainChange(slug)
    } else {
      setGeneratedSlug('')
      setSubdomainUrl('')
      setSubdomainStatus('idle')
      setSubdomainMessage('')
    }
  }

  // Handle logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB
        alert('ไฟล์รูปภาพต้องมีขนาดไม่เกิน 5MB')
        return
      }
      
      setLogoFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Submit form
  const onSubmit = async (data: CompanyFormData) => {
    // Validate subdomain before submitting
    if (subdomainStatus !== 'available') {
      alert('กรุณาเลือกชื่อเว็บไซต์ที่ใช้งานได้')
      return
    }

    setLoading(true)
    
    try {
      // Prepare form data
      const formData = new FormData()
      formData.append('companyData', JSON.stringify({
        ...data,
        slug: generatedSlug
      }))
      
      if (logoFile) {
        formData.append('logo', logoFile)
      }

      // Submit to API
      const response = await fetch('/api/companies/register', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        setSuccess(true)
      } else {
        // Handle race condition case
        if (result.message.includes('ถูกใช้งานแล้ว')) {
          alert('😅 อุ๊ปส์! มีคนใช้ชื่อเว็บไซต์นี้ไปก่อนหน้าคุณนิดเดียว กรุณาเลือกชื่อใหม่')
          // Recheck subdomain status
          checkSubdomainAvailability(generatedSlug)
        } else {
          throw new Error(result.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก')
        }
      }

    } catch (error: any) {
      alert(error.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-soft-lg border border-secondary-100 p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-secondary-900 mb-3">
              สมัครสมาชิกสำเร็จ! 🎉
            </h1>
            
            <p className="text-secondary-600 mb-6 leading-relaxed">
              ระบบได้สร้างบัญชีของ <strong>{companyName}</strong> เรียบร้อยแล้ว<br />
              คุณสามารถเข้าสู่ระบบจัดการได้ทันที
            </p>
            
            <div className="bg-secondary-50 p-4 rounded-xl mb-6">
              <p className="text-sm text-secondary-600 mb-2">เว็บไซต์ของคุณ:</p>
              <a 
                href={`http://${subdomainUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 font-medium flex items-center justify-center space-x-2 text-sm break-all"
              >
                <span>{subdomainUrl}</span>
                <ExternalLink className="w-4 h-4 flex-shrink-0" />
              </a>
            </div>
            
            <div className="space-y-3">
              <Link href="/" className="btn-primary w-full">
                กลับหน้าแรก
              </Link>
              <Link href={`http://${subdomainUrl}/admin`} className="btn-outline w-full">
                เข้าสู่ระบบจัดการ
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Mobile-First Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-secondary-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2 text-secondary-600 hover:text-secondary-900">
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">กลับหน้าแรก</span>
            </Link>
            <div className="flex items-center space-x-3">
              <Image
                src="/logo.svg"
                alt="AooWarranty"
                width={32}
                height={32}
                className="h-8 w-auto"
              />
              <h1 className="text-lg sm:text-xl font-bold text-secondary-900">สมัครใช้งาน AooWarranty</h1>
            </div>
            <div className="w-16"></div> {/* Spacer for balance */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Company Info Card */}
          <div className="bg-white rounded-2xl shadow-soft border border-secondary-100 p-6">
            <h2 className="text-xl font-semibold text-secondary-900 mb-6 flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-primary-500" />
              <span>ข้อมูลบริษัท</span>
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  ชื่อบริษัท/ร้าน *
                </label>
                <input
                  type="text"
                  {...register('name')}
                  onChange={handleNameChange}
                  className="input-primary"
                  placeholder="ชื่อบริษัทหรือร้านค้า"
                />
                {errors.name && (
                  <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              {/* Subdomain Field */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  ชื่อเว็บไซต์ (Subdomain) *
                </label>
                <div className="flex flex-col sm:flex-row">
                  <input
                    type="text"
                    value={generatedSlug}
                    onChange={(e) => handleSubdomainChange(e.target.value)}
                    className={`input-primary sm:rounded-r-none flex-1 ${
                      subdomainStatus === 'available' ? 'border-green-500 focus:ring-green-500' :
                      subdomainStatus === 'taken' || subdomainStatus === 'invalid' ? 'border-red-500 focus:ring-red-500' :
                      'border-secondary-300'
                    }`}
                    placeholder="company-name"
                    pattern="[a-z0-9-]+"
                    minLength={3}
                    maxLength={50}
                  />
                  <span className="bg-secondary-100 border border-l-0 sm:border-l border-secondary-300 px-3 py-3 sm:rounded-r-lg text-secondary-600 text-sm flex items-center justify-center mt-2 sm:mt-0 rounded-lg sm:rounded-l-none">
                    .{typeof window !== 'undefined' ? window.location.host : 'localhost:3000'}
                  </span>
                </div>
                
                {/* Status Messages */}
                <div className="mt-2 min-h-[24px]">
                  {subdomainStatus === 'checking' && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#6b7280' }} />
                      <span style={{ color: '#374151' }}>{subdomainMessage}</span>
                    </div>
                  )}
                  
                  {subdomainStatus === 'available' && (
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="w-4 h-4" style={{ color: '#16a34a' }} />
                      <span style={{ color: '#15803d', fontWeight: 500 }}>{subdomainMessage}</span>
                    </div>
                  )}
                  
                  {(subdomainStatus === 'taken' || subdomainStatus === 'invalid') && (
                    <div className="flex items-center space-x-2 text-sm">
                      <X className="w-4 h-4" style={{ color: '#dc2626' }} />
                      <span style={{ color: '#b91c1c', fontWeight: 500 }}>{subdomainMessage}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    อีเมล *
                  </label>
                  <input
                    type="email"
                    {...register('email')}
                    className="input-primary"
                    placeholder="admin@company.com"
                  />
                  {errors.email && (
                    <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-1" />
                    เบอร์โทรศัพท์ *
                  </label>
                  <input
                    type="tel"
                    {...register('phone')}
                    className="input-primary"
                    placeholder="02-xxx-xxxx"
                  />
                  {errors.phone && (
                    <p className="text-red-600 text-sm mt-1">{errors.phone.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  <Globe className="w-4 h-4 inline mr-1" />
                  เว็บไซต์ (ถ้ามี)
                </label>
                <input
                  type="url"
                  {...register('website')}
                  className="input-primary"
                  placeholder="https://company.com"
                />
                {errors.website && (
                  <p className="text-red-600 text-sm mt-1">{errors.website.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Admin Account Card */}
          <div className="bg-white rounded-2xl shadow-soft border border-secondary-100 p-6">
            <h2 className="text-xl font-semibold text-secondary-900 mb-6 flex items-center space-x-2">
              <Shield className="w-5 h-5 text-primary-500" />
              <span>ข้อมูลบัญชีผู้ดูแลระบบ</span>
            </h2>
            
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <div className="flex items-start space-x-3">
                <User className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-amber-800">ข้อมูลสำคัญ</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    บัญชีนี้จะเป็นผู้ดูแลระบบหลัก สามารถจัดการข้อมูลบริษัท แบรนด์ สินค้า และผู้ใช้งานทั้งหมด<br />
                    <strong>อีเมลที่ใช้จะเป็นอีเมลเดียวกันกับอีเมลบริษัทข้างต้น</strong>
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  ชื่อผู้ดูแลระบบ *
                </label>
                <input
                  type="text"
                  {...register('adminName')}
                  className="input-primary"
                  placeholder="ชื่อ-นามสกุล ผู้ดูแลระบบ"
                />
                {errors.adminName && (
                  <p className="text-red-600 text-sm mt-1">{errors.adminName.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    รหัสผ่าน *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      {...register('adminPassword')}
                      className="input-primary pr-10"
                      placeholder="อย่างน้อย 8 ตัวอักษร"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-secondary-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-secondary-400" />
                      )}
                    </button>
                  </div>
                  {errors.adminPassword && (
                    <p className="text-red-600 text-sm mt-1">{errors.adminPassword.message}</p>
                  )}
                  <p className="text-xs text-secondary-500 mt-1">
                    ต้องมีตัวอักษรเล็ก ใหญ่ และตัวเลข
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    ยืนยันรหัสผ่าน *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      {...register('confirmPassword')}
                      className="input-primary pr-10"
                      placeholder="กรอกรหัสผ่านอีกครั้ง"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4 text-secondary-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-secondary-400" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-600 text-sm mt-1">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Address Card */}
          <div className="bg-white rounded-2xl shadow-soft border border-secondary-100 p-6">
            <h2 className="text-xl font-semibold text-secondary-900 mb-6 flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-primary-500" />
              <span>ที่อยู่บริษัท</span>
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  ที่อยู่ *
                </label>
                <textarea
                  {...register('address')}
                  rows={3}
                  className="input-primary resize-none"
                  placeholder="บ้านเลขที่ ซอย ถนน"
                />
                {errors.address && (
                  <p className="text-red-600 text-sm mt-1">{errors.address.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    แขวง/ตำบล *
                  </label>
                  <input
                    type="text"
                    {...register('district')}
                    className="input-primary"
                    placeholder="แขวง/ตำบล"
                  />
                  {errors.district && (
                    <p className="text-red-600 text-sm mt-1">{errors.district.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    เขต/อำเภอ *
                  </label>
                  <input
                    type="text"
                    {...register('amphoe')}
                    className="input-primary"
                    placeholder="เขต/อำเภอ"
                  />
                  {errors.amphoe && (
                    <p className="text-red-600 text-sm mt-1">{errors.amphoe.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    จังหวัด *
                  </label>
                  <input
                    type="text"
                    {...register('province')}
                    className="input-primary"
                    placeholder="จังหวัด"
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
                    className="input-primary"
                    placeholder="10100"
                    maxLength={5}
                  />
                  {errors.postcode && (
                    <p className="text-red-600 text-sm mt-1">{errors.postcode.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Logo Upload Card */}
          <div className="bg-white rounded-2xl shadow-soft border border-secondary-100 p-6">
            <h2 className="text-xl font-semibold text-secondary-900 mb-6">
              โลโก้บริษัท (ถ้ามี)
            </h2>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
              {logoPreview ? (
                <div className="w-20 h-20 rounded-xl overflow-hidden border border-secondary-200 flex-shrink-0">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-xl border-2 border-dashed border-secondary-300 flex items-center justify-center flex-shrink-0">
                  <Upload className="w-8 h-8 text-secondary-400" />
                </div>
              )}
              
              <div className="flex-1 w-full sm:w-auto">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logo-upload"
                />
                <label
                  htmlFor="logo-upload"
                  className="btn-outline cursor-pointer inline-block w-full sm:w-auto text-center"
                >
                  เลือกไฟล์รูปภาพ
                </label>
                <p className="text-sm text-secondary-500 mt-2">
                  รองรับไฟล์ JPG, PNG ขนาดไม่เกิน 5MB
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="bg-white rounded-2xl shadow-soft border border-secondary-100 p-6">
            <button
              type="submit"
              disabled={loading || subdomainStatus !== 'available'}
              className={`w-full btn-primary text-lg py-4 flex items-center justify-center space-x-3 ${
                subdomainStatus !== 'available' ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>กำลังสมัครสมาชิก...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>สมัครสมาชิก</span>
                </>
              )}
            </button>
            
            {subdomainStatus !== 'available' && generatedSlug && (
              <p className="text-center text-sm text-amber-600 mt-3">
                กรุณาตรวจสอบชื่อเว็บไซต์ให้ถูกต้องก่อนสมัครสมาชิก
              </p>
            )}
          </div>

          {/* Preview Card - Mobile Optimized */}
          {companyName && generatedSlug && subdomainStatus === 'available' && (
            <div className="bg-white rounded-2xl shadow-soft border border-secondary-100 p-6">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                ตัวอย่างเว็บไซต์ของคุณ
              </h3>
              
              <div className="bg-secondary-50 p-4 rounded-xl mb-4">
                <p className="text-sm text-secondary-600 mb-1">URL ของคุณ:</p>
                <p className="font-mono text-sm text-primary-600 break-all">
                  {subdomainUrl}
                </p>
              </div>
              
              <div className="border border-secondary-200 rounded-xl p-4">
                <div className="flex items-center space-x-3 mb-3">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="w-8 h-8 rounded object-cover" />
                  ) : (
                    <div className="w-8 h-8 bg-secondary-300 rounded"></div>
                  )}
                  <h4 className="font-semibold text-secondary-900">{companyName}</h4>
                </div>
                <p className="text-sm text-secondary-600 mb-3">
                  ระบบลงทะเบียนรับประกันสินค้า
                </p>
                <button className="btn-primary w-full text-sm py-2">
                  ลงทะเบียนรับประกัน
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}