'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export default function QueryProvider({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // ข้อมูลจะ fresh นาน 1 นาที
        staleTime: 60 * 1000,
        // เก็บ cache ไว้ 5 นาที
        gcTime: 5 * 60 * 1000,
        // ไม่ refetch อัตโนมัติเมื่อ focus window
        refetchOnWindowFocus: false,
        // พยายาม retry 1 ครั้งถ้า error
        retry: 1,
        // Retry delay
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: {
        // Mutation options
        retry: 0,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false} 
        />
      )}
    </QueryClientProvider>
  )
}