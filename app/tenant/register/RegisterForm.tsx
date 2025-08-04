'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  Package, 
  Calendar, 
  Upload, 
  MapPin, 
  Phone, 
  Mail,
  Loader2,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react'
import { calculateWarrantyExpiry } from '@/lib/utils'

// Form validation schema
const registerSchema = z.object({
  // Customer Info
  customerName: z.string().min(1, 'กรุณากรอกชื่อ-นามสกุล'),
  phone: z.string().min(10, 'กรุณากรอกเบอร์โทรศัพท์'),
  email: z.string().email('กรุณากรอกอีเมลที่ถูกต้อง').optional().or(z.literal('')),
  
  // Address
  address: z.string().min(1, 'กรุณากรอกที่อยู่'),
  district: z.string().min(1, 'กรุณากรอกแขวง/ตำบล'),
  amphoe: z.string().min(1, 'กรุณากรอกเขต/อำเภอ'),
  province: z.string().min(1, 'กรุณากรอกจังหวัด'),
  postcode: z.string().length(5, 'รหัสไปรษณีย์ต้องมี 5 หลัก'),
  
  // Product Info
  brandId: z.string().min(1, 'กรุณาเลือกแบรนด์'),
  productId: z.string().min(1, 'กรุณาเลือกสินค้า'),
  serialNumber: z.string().optional(),
  purchaseLocation: z.string().optional(),
  purchaseDate: z.string().min(1, 'กรุณาเลือกวันที่ซื้อ'),
  
  // Additional
  notes: z.string().optional()
})

type RegisterFormData = z.infer<typeof registerSchema>

interface RegisterFormProps {
  brands: Array<{ id: string; name: string; logo: string }>
  products: Array<{
    id: string
    brandId: string
    name: string
    model: string
    warrantyYears: number
    warrantyMonths: number
    requiredFields: {
      serialNumber: boolean
      receiptImage: boolean
      purchaseLocation: boolean
    }
    image: string
  }>
  customerInfo: {
    customerId: string
    displayName: string
    email: string
  }
  companyId: string
  tenant: string
}

export default function RegisterForm({ 
  brands, 
  products, 
  customerInfo,
  companyId,
  tenant 
}: RegisterFormProps) {
  const [loading, setLoading] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptPreview, setReceiptPreview] = useState('')
  const [warrantyExpiry, setWarrantyExpiry] = useState('')
  const router = useRouter()
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      customerName: customerInfo.displayName,
      email: customerInfo.email,
      purchaseDate: new Date().toISOString().split('T')[0]
    }
  })
  
  // Watch for changes
  const watchProduct = watch('productId')
  const watchPurchaseDate = watch('purchaseDate')
  
  // Filter products by selected brand
  const filteredProducts = selectedBrand ? products.filter(p => p.brandId === selectedBrand) : []
  
  // Update warranty expiry when product or date changes
  useEffect(() => {
    if (selectedProduct && watchPurchaseDate) {
      const expiry = calculateWarrantyExpiry(
        watchPurchaseDate,
        selectedProduct.warrantyYears,
        selectedProduct.warrantyMonths
      )
      setWarrantyExpiry(expiry)
    }
  }, [selectedProduct, watchPurchaseDate])
  
  // Handle brand change
  const handleBrandChange = (brandId: string) => {
    setSelectedBrand(brandId)
    setValue('productId', '') // Reset product selection
    setSelectedProduct(null)
    setWarrantyExpiry('') // Clear warranty expiry
  }
  
  // Handle product change
  const handleProductChange = (productId: string) => {
    const product = products.find(p => p.id === productId)
    setSelectedProduct(product)
    
    // Clear warranty expiry if no product selected
    if (!product) {
      setWarrantyExpiry('')
    }
  }
  
  // Handle receipt upload
  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('ไฟล์รูปภาพต้องมีขนาดไม่เกิน 5MB')
        return
      }
      
      setReceiptFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setReceiptPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }
  
  // Submit form
  const onSubmit = async (data: RegisterFormData) => {
    // Check required fields
    if (selectedProduct?.requiredFields.receiptImage && !receiptFile) {
      alert('กรุณาอัพโหลดรูปใบเสร็จ')
      return
    }
    
    if (selectedProduct?.requiredFields.serialNumber && !data.serialNumber) {
      alert('กรุณากรอก Serial Number')
      return
    }
    
    if (selectedProduct?.requiredFields.purchaseLocation && !data.purchaseLocation) {
      alert('กรุณากรอกสถานที่ซื้อ')
      return
    }
    
    setLoading(true)
    
    try {
      const formData = new FormData()
      
      // Add all form data
      formData.append('warrantyData', JSON.stringify({
        ...data,
        customerId: customerInfo.customerId,
        companyId,
        warrantyExpiry
      }))
      
      // Add receipt image if exists
      if (receiptFile) {
        formData.append('receipt', receiptFile)
      }
      
      const response = await fetch(`/${tenant}/api/warranties`, {
        method: 'POST',
        body: formData
      })
      
      const result = await response.json()
      
      if (result.success) {
        // Redirect to warranty detail page
        router.push(`/${tenant}/warranty/${result.data.id}`)
      } else {
        alert(result.message || 'เกิดข้อผิดพลาดในการลงทะเบียน')
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการลงทะเบียน')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Product Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-secondary-900 flex items-center">
          <Package className="w-5 h-5 mr-2 text-primary-500" />
          ข้อมูลสินค้า
        </h3>
        
        {/* Brand Selection */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            แบรนด์ *
          </label>
          <select
            {...register('brandId')}
            onChange={(e) => handleBrandChange(e.target.value)}
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
        
        {/* Product Selection */}
        {selectedBrand && (
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              สินค้า *
            </label>
            {filteredProducts.length > 0 ? (
              <>
                <select
                  {...register('productId')}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">เลือกสินค้า</option>
                  {filteredProducts.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} {product.model && `- ${product.model}`}
                    </option>
                  ))}
                </select>
                {errors.productId && (
                  <p className="text-red-600 text-sm mt-1">{errors.productId.message}</p>
                )}
              </>
            ) : (
              <p className="text-sm text-red-600">
                ไม่มีสินค้าในแบรนด์นี้
              </p>
            )}
          </div>
        )}
        
        {/* Product Details */}
        {selectedProduct && (
          <div className="bg-secondary-50 p-4 rounded-lg">
            <div className="flex items-start space-x-4">
              {selectedProduct.image && (
                <img 
                  src={selectedProduct.image} 
                  alt={selectedProduct.name}
                  className="w-20 h-20 rounded-lg object-cover"
                />
              )}
              <div className="flex-1">
                <h4 className="font-semibold text-secondary-900">
                  {selectedProduct.name}
                </h4>
                {selectedProduct.model && (
                  <p className="text-sm text-secondary-600">
                    รุ่น: {selectedProduct.model}
                  </p>
                )}
                <p className="text-sm text-primary-600 mt-1">
                  ประกัน: {selectedProduct.warrantyYears > 0 || selectedProduct.warrantyMonths > 0 ? (
                    <>
                      {selectedProduct.warrantyYears > 0 && `${selectedProduct.warrantyYears} ปี`}
                      {selectedProduct.warrantyMonths > 0 && ` ${selectedProduct.warrantyMonths} เดือน`}
                    </>
                  ) : (
                    <span className="text-secondary-500">ไม่ระบุ</span>
                  )}
                </p>
              </div>
            </div>
            
            {/* Required Fields Info */}
            <div className="mt-3 space-y-1">
              <p className="text-xs font-medium text-secondary-700">ข้อมูลที่ต้องกรอก:</p>
              <div className="flex flex-wrap gap-2">
                {selectedProduct.requiredFields.serialNumber && (
                  <span className="text-xs bg-white px-2 py-1 rounded">
                    Serial Number
                  </span>
                )}
                {selectedProduct.requiredFields.receiptImage && (
                  <span className="text-xs bg-white px-2 py-1 rounded">
                    รูปใบเสร็จ
                  </span>
                )}
                {selectedProduct.requiredFields.purchaseLocation && (
                  <span className="text-xs bg-white px-2 py-1 rounded">
                    สถานที่ซื้อ
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Serial Number */}
        {selectedProduct?.requiredFields.serialNumber && (
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Serial Number *
            </label>
            <input
              type="text"
              {...register('serialNumber')}
              className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="กรอก Serial Number"
            />
          </div>
        )}
        
        {/* Purchase Location */}
        {selectedProduct?.requiredFields.purchaseLocation && (
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              สถานที่ซื้อ *
            </label>
            <input
              type="text"
              {...register('purchaseLocation')}
              className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="ชื่อร้านค้าที่ซื้อสินค้า"
            />
          </div>
        )}
        
        {/* Purchase Date */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            วันที่ซื้อ *
          </label>
          <input
            type="date"
            {...register('purchaseDate')}
            max={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          {errors.purchaseDate && (
            <p className="text-red-600 text-sm mt-1">{errors.purchaseDate.message}</p>
          )}
          
          {/* Warranty Expiry Display */}
          {warrantyExpiry && selectedProduct && (
            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700 flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                ประกันจะหมดอายุวันที่: {new Date(warrantyExpiry).toLocaleDateString('th-TH', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          )}
        </div>
        
        {/* Receipt Upload */}
        {selectedProduct?.requiredFields.receiptImage && (
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              รูปใบเสร็จ *
            </label>
            {receiptPreview ? (
              <div className="relative inline-block">
                <img 
                  src={receiptPreview} 
                  alt="Receipt"
                  className="w-full max-w-xs rounded-lg border border-secondary-200"
                />
                <button
                  type="button"
                  onClick={() => {
                    setReceiptFile(null)
                    setReceiptPreview('')
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleReceiptUpload}
                  className="hidden"
                  id="receipt-upload"
                />
                <label
                  htmlFor="receipt-upload"
                  className="btn-outline cursor-pointer inline-flex items-center"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  เลือกรูปภาพ
                </label>
                <p className="text-xs text-secondary-500 mt-2">
                  รองรับไฟล์ JPG, PNG ขนาดไม่เกิน 5MB
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Customer Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-secondary-900 flex items-center">
          <Phone className="w-5 h-5 mr-2 text-primary-500" />
          ข้อมูลติดต่อ
        </h3>
        
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            ชื่อ-นามสกุล *
          </label>
          <input
            type="text"
            {...register('customerName')}
            className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="กรอกชื่อ-นามสกุล"
          />
          {errors.customerName && (
            <p className="text-red-600 text-sm mt-1">{errors.customerName.message}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            เบอร์โทรศัพท์ *
          </label>
          <input
            type="tel"
            {...register('phone')}
            className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="08X-XXX-XXXX"
          />
          {errors.phone && (
            <p className="text-red-600 text-sm mt-1">{errors.phone.message}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            อีเมล
          </label>
          <input
            type="email"
            {...register('email')}
            className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="email@example.com"
          />
          {errors.email && (
            <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>
      </div>
      
      {/* Address */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-secondary-900 flex items-center">
          <MapPin className="w-5 h-5 mr-2 text-primary-500" />
          ที่อยู่สำหรับการรับประกัน
        </h3>
        
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            ที่อยู่ *
          </label>
          <input
            type="text"
            {...register('address')}
            className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="บ้านเลขที่ ถนน ซอย"
          />
          {errors.address && (
            <p className="text-red-600 text-sm mt-1">{errors.address.message}</p>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              แขวง/ตำบล *
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
              เขต/อำเภอ *
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
        
        <div className="grid grid-cols-2 gap-4">
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
      
      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-secondary-700 mb-2">
          หมายเหตุเพิ่มเติม
        </label>
        <textarea
          {...register('notes')}
          rows={3}
          className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          placeholder="ข้อมูลเพิ่มเติม (ถ้ามี)"
        />
      </div>
      
      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => router.push(`/${tenant}`)}
          className="btn-outline"
        >
          ยกเลิก
        </button>
        
        <button
          type="submit"
          disabled={loading || !selectedProduct}
          className="btn-primary flex items-center"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              กำลังลงทะเบียน...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5 mr-2" />
              ลงทะเบียนประกัน
            </>
          )}
        </button>
      </div>
    </form>
  )
}