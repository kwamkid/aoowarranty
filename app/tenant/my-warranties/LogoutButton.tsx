// app/tenant/my-warranties/LogoutButton.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

interface LogoutButtonProps {
  tenant: string
}

export default function LogoutButton({ tenant }: LogoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  
  const handleLogout = async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/auth/line/me', {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Redirect to tenant home
        router.push(`/${tenant}`)
        router.refresh()
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <button 
      onClick={handleLogout}
      disabled={loading}
      className="p-2 hover:bg-secondary-100 rounded-lg disabled:opacity-50"
      title="ออกจากระบบ"
    >
      <LogOut className="w-5 h-5 text-secondary-600" />
    </button>
  )
}