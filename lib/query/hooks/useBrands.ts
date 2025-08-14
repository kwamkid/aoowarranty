import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions
} from '@tanstack/react-query'
import { queryKeys } from '../keys'
import { 
  fetchBrands, 
  fetchBrand, 
  createBrand,
  updateBrand,
  deleteBrand,
  Brand,
  BrandFormData 
} from '@/lib/api/client/brands'

// Hook to fetch brands list
export function useBrands(
  options?: Omit<UseQueryOptions<Brand[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<Brand[], Error>({
    queryKey: queryKeys.brands.lists(),
    queryFn: fetchBrands,
    staleTime: 5 * 60 * 1000, // Brands don't change often, cache for 5 minutes
    ...options,
  })
}

// Hook to fetch single brand
export function useBrand(
  id: string,
  options?: Omit<UseQueryOptions<Brand, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<Brand, Error>({
    queryKey: queryKeys.brands.detail(id),
    queryFn: () => fetchBrand(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}

// Hook to create brand
export function useCreateBrand(
  options?: UseMutationOptions<Brand, Error, BrandFormData>
) {
  const queryClient = useQueryClient()
  
  return useMutation<Brand, Error, BrandFormData>({
    mutationFn: createBrand,
    onSuccess: (newBrand) => {
      // Invalidate brands list to refetch
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.brands.lists() 
      })
      
      // Add the new brand to cache
      queryClient.setQueryData(
        queryKeys.brands.detail(newBrand.id),
        newBrand
      )
    },
    ...options,
  })
}

// Hook to update brand
export function useUpdateBrand(
  options?: UseMutationOptions<Brand, Error, { id: string; data: BrandFormData }>
) {
  const queryClient = useQueryClient()
  
  return useMutation<Brand, Error, { id: string; data: BrandFormData }>({
    mutationFn: ({ id, data }) => updateBrand(id, data),
    
    onSuccess: (updatedBrand) => {
      // Update specific brand in cache
      queryClient.setQueryData(
        queryKeys.brands.detail(updatedBrand.id),
        updatedBrand
      )
      
      // Invalidate lists to refetch
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.brands.lists() 
      })
    },
    
    ...options,
  })
}

// Hook to delete brand
export function useDeleteBrand(
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient()
  
  return useMutation<void, Error, string>({
    mutationFn: deleteBrand,
    
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: queryKeys.brands.detail(deletedId),
      })
      
      // Invalidate lists to refetch
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.brands.lists() 
      })
      
      // Also invalidate products as they depend on brands
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.all()
      })
    },
    
    ...options,
  })
}