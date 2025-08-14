// Client-side API functions for products

export interface Product {
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

export interface ProductFormData {
  brandId: string
  name: string
  model?: string
  warrantyYears: number
  warrantyMonths: number
  description?: string
  isActive?: boolean
  requiredFields: {
    serialNumber: boolean
    receiptImage: boolean
    purchaseLocation: boolean
  }
}

// Fetch products with optional filters
export async function fetchProducts(filters?: {
  brandId?: string
  search?: string
}): Promise<Product[]> {
  const params = new URLSearchParams()
  
  if (filters?.brandId) {
    params.append('brand', filters.brandId)
  }
  
  if (filters?.search) {
    params.append('search', filters.search)
  }
  
  const url = `/api/products${params.toString() ? `?${params}` : ''}`
  const response = await fetch(url)
  
  if (!response.ok) {
    throw new Error('Failed to fetch products')
  }
  
  const result = await response.json()
  return result.data || []
}

// Fetch single product
export async function fetchProduct(id: string): Promise<Product> {
  const response = await fetch(`/api/products/${id}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch product')
  }
  
  const result = await response.json()
  return result.data
}

// Create new product
export async function createProduct(data: ProductFormData): Promise<Product> {
  const formData = new FormData()
  
  // Append all fields to FormData
  formData.append('brandId', data.brandId)
  formData.append('name', data.name)
  formData.append('model', data.model || '')
  formData.append('warrantyYears', data.warrantyYears.toString())
  formData.append('warrantyMonths', data.warrantyMonths.toString())
  formData.append('description', data.description || '')
  formData.append('isActive', (data.isActive ?? true).toString())
  formData.append('requiredFields', JSON.stringify(data.requiredFields))
  
  const response = await fetch('/api/products', {
    method: 'POST',
    body: formData,
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to create product')
  }
  
  const result = await response.json()
  return result.data
}

// Update product
export async function updateProduct(
  id: string,
  data: ProductFormData
): Promise<Product> {
  const formData = new FormData()
  
  // Append all fields to FormData
  formData.append('brandId', data.brandId)
  formData.append('name', data.name)
  formData.append('model', data.model || '')
  formData.append('warrantyYears', data.warrantyYears.toString())
  formData.append('warrantyMonths', data.warrantyMonths.toString())
  formData.append('description', data.description || '')
  formData.append('isActive', (data.isActive ?? true).toString())
  formData.append('requiredFields', JSON.stringify(data.requiredFields))
  
  const response = await fetch(`/api/products/${id}`, {
    method: 'PUT',
    body: formData,
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to update product')
  }
  
  const result = await response.json()
  return result.data
}

// Delete product
export async function deleteProduct(id: string): Promise<void> {
  const response = await fetch(`/api/products/${id}`, {
    method: 'DELETE',
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to delete product')
  }
}