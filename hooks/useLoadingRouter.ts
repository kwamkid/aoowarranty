// hooks/useLoadingRouter.ts
import { useRouter } from 'next/navigation'
import { useLoading } from '@/components/providers/LoadingProvider'

export function useLoadingRouter() {
  const router = useRouter()
  const { showLoading, hideLoading } = useLoading()
  
  const push = (url: string) => {
    showLoading()
    router.push(url)
  }
  
  const replace = (url: string) => {
    showLoading()
    router.replace(url)
  }
  
  const back = () => {
    showLoading()
    router.back()
  }
  
  const refresh = () => {
    showLoading()
    router.refresh()
    // Auto hide after refresh
    setTimeout(hideLoading, 500)
  }
  
  return {
    ...router,
    push,
    replace,
    back,
    refresh
  }
}