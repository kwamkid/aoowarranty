// Client-side API functions for brands

export interface Brand {
  id: string
  companyId: string
  name: string
  logo?: string
  description?: string
  isActive: boolean
  createdAt: Date | string
  createdBy?: string
  productCount?: number
}

export interface BrandFormData {
  name: string
  description?: string
  logo?: File
  isActive?: boolean
  removeLogo?: boolean
}

// Fetch all brands
export async function fetchBrands(): Promise<Brand[]> {
  const response = await fetch('/api/brands')
  
  if (!response.ok) {
    throw new Error('Failed to fetch brands')
  }
  
  const result = await response.json()
  return result.data || []
}

// Fetch single brand
export async function fetchBrand(id: string): Promise<Brand> {
  const response = await fetch(`/api/brands/${id}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch brand')
  }
  
  const result = await response.json()
  return result.data
}

// Create new brand
export async function createBrand(data: BrandFormData): Promise<Brand> {
  const formData = new FormData()
  
  formData.append('name', data.name)
  formData.append('description', data.description || '')
  
  if (data.logo) {
    formData.append('logo', data.logo)
  }
  
  const response = await fetch('/api/brands', {
    method: 'POST',
    body: formData,
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to create brand')
  }
  
  const result = await response.json()
  return result.data
}

// Update brand
export async function updateBrand(
  id: string,
  data: BrandFormData
): Promise<Brand> {
  const formData = new FormData()
  
  formData.append('name', data.name)
  formData.append('description', data.description || '')
  formData.append('isActive', (data.isActive ?? true).toString())
  
  if (data.removeLogo) {
    formData.append('removeLogo', 'true')
  } else if (data.logo) {
    formData.append('logo', data.logo)
  }
  
  const response = await fetch(`/api/brands/${id}`, {
    method: 'PUT',
    body: formData,
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to update brand')
  }
  
  const result = await response.json()
  return result.data
}

// Delete brand
export async function deleteBrand(id: string): Promise<void> {
  const response = await fetch(`/api/brands/${id}`, {
    method: 'DELETE',
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to delete brand')
  }
}