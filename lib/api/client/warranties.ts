// Client-side API functions for warranties

export interface CustomerInfo {
  name: string
  lineDisplayName: string
  phone: string
  email: string
  address: string
  district: string
  amphoe: string
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
  customerId: string
  customerInfo: CustomerInfo
  productInfo: ProductInfo
  purchaseDate: string
  warrantyStartDate: string
  warrantyExpiry: string
  receiptImage?: string
  status: 'active' | 'expired' | 'claimed'
  registrationDate: string | Date
  notes?: string
  claimHistory?: any[]
}

export interface WarrantyStats {
  total: number
  active: number
  expired: number
  claimed: number
  expiringSoon: number
}

// Fetch warranties for admin
export async function fetchWarranties(): Promise<Warranty[]> {
  const response = await fetch('/api/admin/warranties')
  
  if (!response.ok) {
    throw new Error('Failed to fetch warranties')
  }
  
  const result = await response.json()
  return result.data || []
}

// Fetch warranty statistics
export async function fetchWarrantyStats(): Promise<WarrantyStats> {
  const response = await fetch('/api/admin/warranties/stats')
  
  if (!response.ok) {
    throw new Error('Failed to fetch warranty stats')
  }
  
  const result = await response.json()
  return result.data
}

// Fetch single warranty
export async function fetchWarranty(id: string): Promise<Warranty> {
  const response = await fetch(`/api/admin/warranties/${id}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch warranty')
  }
  
  const result = await response.json()
  return result.data
}

// Update warranty status
export async function updateWarrantyStatus(
  id: string, 
  status: 'active' | 'expired' | 'claimed'
): Promise<Warranty> {
  const response = await fetch(`/api/admin/warranties/${id}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to update warranty status')
  }
  
  const result = await response.json()
  return result.data
}

// Helper functions
export function getDaysUntilExpiry(expiryDate: string): number {
  const expiry = new Date(expiryDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  expiry.setHours(0, 0, 0, 0)
  
  const diffTime = expiry.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays
}

export function isWarrantyActive(warranty: Warranty): boolean {
  if (warranty.status === 'claimed' || warranty.status === 'expired') {
    return false
  }
  
  const daysLeft = getDaysUntilExpiry(warranty.warrantyExpiry)
  return daysLeft > 0
}

export function getWarrantyStatus(warranty: Warranty): {
  status: 'active' | 'expired' | 'claimed' | 'expiring'
  daysLeft?: number
} {
  if (warranty.status === 'claimed') {
    return { status: 'claimed' }
  }
  
  const daysLeft = getDaysUntilExpiry(warranty.warrantyExpiry)
  
  if (daysLeft <= 0) {
    return { status: 'expired' }
  } else if (daysLeft <= 30) {
    return { status: 'expiring', daysLeft }
  } else {
    return { status: 'active', daysLeft }
  }
}