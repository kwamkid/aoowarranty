import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions
} from '@tanstack/react-query'
import { queryKeys } from '../keys'
import { 
  fetchProducts, 
  fetchProduct, 
  createProduct, 
  updateProduct, 
  deleteProduct,
  Product,
  ProductFormData 
} from '@/lib/api/client/products'

// Hook to fetch products list
export function useProducts(
  filters?: { brandId?: string; search?: string },
  options?: Omit<UseQueryOptions<Product[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<Product[], Error>({
    queryKey: queryKeys.products.list(filters),
    queryFn: () => fetchProducts(filters),
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
    ...options,
  })
}

// Hook to fetch single product
export function useProduct(
  id: string,
  options?: Omit<UseQueryOptions<Product, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<Product, Error>({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => fetchProduct(id),
    enabled: !!id,
    ...options,
  })
}

// Hook to create product
export function useCreateProduct(
  options?: UseMutationOptions<Product, Error, ProductFormData>
) {
  const queryClient = useQueryClient()
  
  return useMutation<Product, Error, ProductFormData>({
    mutationFn: createProduct,
    onSuccess: (newProduct) => {
      // Invalidate products list to refetch
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.products.lists() 
      })
      
      // Optionally, add the new product to cache immediately
      queryClient.setQueryData(
        queryKeys.products.detail(newProduct.id),
        newProduct
      )
    },
    ...options,
  })
}

// Hook to update product with optimistic update
export function useUpdateProduct(
  options?: UseMutationOptions<Product, Error, { id: string; data: ProductFormData }>
) {
  const queryClient = useQueryClient()
  
  return useMutation<Product, Error, { id: string; data: ProductFormData }, { previousProduct?: Product }>({
    mutationFn: ({ id, data }) => updateProduct(id, data),
    
    // Optimistic update
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.products.detail(id) 
      })
      
      // Snapshot previous value
      const previousProduct = queryClient.getQueryData<Product>(
        queryKeys.products.detail(id)
      )
      
      // Optimistically update to new value
      if (previousProduct) {
        queryClient.setQueryData<Product>(
          queryKeys.products.detail(id),
          {
            ...previousProduct,
            ...data,
          }
        )
      }
      
      return { previousProduct }
    },
    
    // On error, rollback
    onError: (err, { id }, context) => {
      if (context?.previousProduct) {
        queryClient.setQueryData(
          queryKeys.products.detail(id),
          context.previousProduct
        )
      }
    },
    
    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.products.all() 
      })
    },
    
    ...options,
  })
}

// Hook to delete product
export function useDeleteProduct(
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient()
  
  return useMutation<void, Error, string>({
    mutationFn: deleteProduct,
    
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: queryKeys.products.detail(deletedId),
      })
      
      // Invalidate lists to refetch
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.products.lists() 
      })
    },
    
    ...options,
  })
}

// Prefetch product data
export function usePrefetchProduct(id: string) {
  const queryClient = useQueryClient()
  
  return () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.products.detail(id),
      queryFn: () => fetchProduct(id),
      staleTime: 2 * 60 * 1000,
    })
  }
}