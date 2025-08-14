import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions
} from '@tanstack/react-query'
import { queryKeys } from '../keys'
import { 
  fetchWarranties,
  fetchWarrantyStats,
  fetchWarranty,
  updateWarrantyStatus,
  Warranty,
  WarrantyStats
} from '@/lib/api/client/warranties'

// Hook to fetch warranties list
export function useWarranties(
  options?: Omit<UseQueryOptions<Warranty[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<Warranty[], Error>({
    queryKey: queryKeys.warranties.lists(),
    queryFn: fetchWarranties,
    staleTime: 30 * 1000, // 30 seconds - warranties can change frequently
    ...options,
  })
}

// Hook to fetch warranty statistics
export function useWarrantyStats(
  options?: Omit<UseQueryOptions<WarrantyStats, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<WarrantyStats, Error>({
    queryKey: queryKeys.stats.all(),
    queryFn: fetchWarrantyStats,
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  })
}

// Hook to fetch single warranty
export function useWarranty(
  id: string,
  options?: Omit<UseQueryOptions<Warranty, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<Warranty, Error>({
    queryKey: queryKeys.warranties.detail(id),
    queryFn: () => fetchWarranty(id),
    enabled: !!id,
    staleTime: 60 * 1000, // 1 minute
    ...options,
  })
}

// Hook to update warranty status
export function useUpdateWarrantyStatus(
  options?: UseMutationOptions<Warranty, Error, { id: string; status: 'active' | 'expired' | 'claimed' }>
) {
  const queryClient = useQueryClient()
  
  return useMutation<Warranty, Error, { id: string; status: 'active' | 'expired' | 'claimed' }>({
    mutationFn: ({ id, status }) => updateWarrantyStatus(id, status),
    
    onSuccess: (updatedWarranty) => {
      // Update specific warranty in cache
      queryClient.setQueryData(
        queryKeys.warranties.detail(updatedWarranty.id),
        updatedWarranty
      )
      
      // Invalidate lists and stats
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.warranties.lists() 
      })
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.stats.all() 
      })
    },
    
    ...options,
  })
}

// Hook to prefetch warranty data
export function usePrefetchWarranty(id: string) {
  const queryClient = useQueryClient()
  
  return () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.warranties.detail(id),
      queryFn: () => fetchWarranty(id),
      staleTime: 60 * 1000,
    })
  }
}