'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import ShieldLoading from '@/components/ui/ShieldLoading'

interface LoadingContextType {
  isLoading: boolean
  setLoading: (loading: boolean) => void
  showLoading: () => void
  hideLoading: () => void
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false)
  const pathname = usePathname()
  
  // Show loading on route change
  useEffect(() => {
    setIsLoading(false)
  }, [pathname])
  
  const showLoading = () => setIsLoading(true)
  const hideLoading = () => setIsLoading(false)
  const setLoading = (loading: boolean) => setIsLoading(loading)
  
  return (
    <LoadingContext.Provider value={{ isLoading, setLoading, showLoading, hideLoading }}>
      {children}
      {isLoading && <ShieldLoading fullScreen text="กำลังโหลดข้อมูล..." size="lg" variant="spin" />}
    </LoadingContext.Provider>
  )
}

export function useLoading() {
  const context = useContext(LoadingContext)
  if (!context) {
    throw new Error('useLoading must be used within LoadingProvider')
  }
  return context
}