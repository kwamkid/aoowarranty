// types/index.ts

export interface Company {
  id: string
  name: string
  slug: string
  logo?: string
  
  // ข้อมูลบริษัท
  address: string
  amphoe: string
  district: string
  province: string
  postcode: string
  
  // ข้อมูลติดต่อ
  phone: string
  email: string
  website?: string
  
  // การตั้งค่า
  lineChannelId?: string
  isActive: boolean
  createdAt: Date
  createdBy: string
}

export interface Brand {
  id: string
  companyId: string
  name: string
  logo?: string
  description?: string
  isActive: boolean
  createdAt: Date
}

export interface Product {
  id: string
  companyId: string
  brandId: string
  name: string
  model: string
  
  // การตั้งค่าประกัน
  warrantyYears: number
  warrantyMonths?: number
  
  // Field ที่ต้องการให้กรอก
  requiredFields: {
    serialNumber: boolean
    receiptImage: boolean
    purchaseLocation: boolean
    [key: string]: boolean
  }
  
  // ข้อมูลเพิ่มเติม
  description?: string
  image?: string
  isActive: boolean
  createdAt: Date
}

export interface CustomerInfo {
  name: string
  lineDisplayName: string
  phone: string
  email: string
  
  // ที่อยู่
  address: string
  amphoe: string
  district: string
  province: string
  postcode: string
}

export interface ProductInfo {
  brandName: string
  productName: string
  model: string
  serialNumber?: string
  purchaseLocation?: string
}

export interface Warranty {
  id: string
  companyId: string
  productId: string
  
  // ข้อมูลลูกค้า
  customerId: string // LINE User ID
  customerInfo: CustomerInfo
  
  // ข้อมูลสินค้า
  productInfo: ProductInfo
  
  // ข้อมูลการซื้อ
  purchaseDate: string // YYYY-MM-DD
  warrantyStartDate: string
  warrantyExpiry: string
  
  // เอกสาร
  receiptImage?: string
  
  // สถานะ
  status: 'active' | 'expired' | 'claimed'
  registrationDate: Date
  
  // ข้อมูลเพิ่มเติม
  notes?: string
  claimHistory?: ClaimRecord[]
}

export interface ClaimRecord {
  id: string
  claimDate: Date
  description: string
  status: 'pending' | 'approved' | 'rejected'
  notes?: string
}

export interface AdminUser {
  id: string
  companyId: string
  email: string
  name: string
  role: 'admin' | 'manager' | 'viewer'
  generatedPassword?: string
  isActive: boolean
  lastLogin?: Date
  createdAt: Date
}

// Thailand Address Types
export interface ThailandAddress {
  district: string
  amphoe: string
  province: string
  zipcode: string
}

// Form Types
export interface CompanyRegistrationForm {
  name: string
  address: string
  amphoe: string
  district: string
  province: string
  postcode: string
  phone: string
  email: string
  website?: string
  logo?: File
}

export interface WarrantyRegistrationForm {
  // Customer Info
  customerName: string
  phone: string
  email: string
  address: string
  amphoe: string
  district: string
  province: string
  postcode: string
  
  // Product Info
  brandId: string
  productId: string
  serialNumber?: string
  purchaseLocation?: string
  purchaseDate: string
  receiptImage?: File
  notes?: string
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasNext: boolean
  hasPrev: boolean
}