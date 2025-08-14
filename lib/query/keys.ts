// Query keys for React Query
// Using factory pattern for type safety and consistency

export const queryKeys = {
  all: ['warrantyhub'] as const,
  
  // Products
  products: {
    all: () => [...queryKeys.all, 'products'] as const,
    lists: () => [...queryKeys.products.all(), 'list'] as const,
    list: (filters?: { brandId?: string; search?: string }) => 
      [...queryKeys.products.lists(), filters] as const,
    details: () => [...queryKeys.products.all(), 'detail'] as const,
    detail: (id: string) => [...queryKeys.products.details(), id] as const,
  },
  
  // Brands
  brands: {
    all: () => [...queryKeys.all, 'brands'] as const,
    lists: () => [...queryKeys.brands.all(), 'list'] as const,
    list: (companyId?: string) => [...queryKeys.brands.lists(), { companyId }] as const,
    detail: (id: string) => [...queryKeys.brands.all(), 'detail', id] as const,
  },
  
  // Warranties
  warranties: {
    all: () => [...queryKeys.all, 'warranties'] as const,
    lists: () => [...queryKeys.warranties.all(), 'list'] as const,
    list: (filters?: any) => [...queryKeys.warranties.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.warranties.all(), 'detail', id] as const,
  },
  
  // Stats
  stats: {
    all: () => [...queryKeys.all, 'stats'] as const,
    dashboard: () => [...queryKeys.stats.all(), 'dashboard'] as const,
    products: () => [...queryKeys.stats.all(), 'products'] as const,
  },
} as const