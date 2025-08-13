// components/customer/CustomerHeader.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Shield, FileText, Home, Menu, X, LogOut, Loader2 } from 'lucide-react'

interface CustomerHeaderProps {
  company: {
    name: string
    logo?: string
  }
  tenant: string
  isLoggedIn: boolean
  session?: {
    displayName: string
    pictureUrl?: string
  }
}

export default function CustomerHeader({ company, tenant, isLoggedIn, session }: CustomerHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  
  const handleLogout = async () => {
    setLoggingOut(true)
    
    try {
      const response = await fetch('/api/auth/line/me', {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        router.push(`/${tenant}`)
        router.refresh()
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setLoggingOut(false)
    }
  }
  
  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === `/${tenant}`
    }
    return pathname === `/${tenant}${path}`
  }
  
  return (
    <header className="bg-white shadow-sm border-b border-secondary-200 sticky top-0 z-50">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Logo & Company Name */}
          <Link 
            href={`/${tenant}`}
            className="flex items-center space-x-3"
          >
            {company.logo ? (
              <img 
                src={company.logo} 
                alt={company.name}
                className="h-10 w-10 rounded-full object-cover border-2 border-secondary-200"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary-600" />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-base sm:text-lg font-bold text-secondary-900 leading-tight">
                {company.name}
              </h1>
              <p className="text-xs text-secondary-600 hidden sm:block">
                ระบบลงทะเบียนรับประกัน
              </p>
            </div>
          </Link>
          
          {/* Right: Navigation & User Menu */}
          {isLoggedIn && (
            <>
              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-6">
                <Link 
                  href={`/${tenant}`}
                  className={`flex items-center space-x-1 text-sm font-medium transition-colors ${
                    isActive('/') ? 'text-primary-600' : 'text-secondary-600 hover:text-secondary-900'
                  }`}
                >
                  <Home className="w-4 h-4" />
                  <span>หน้าแรก</span>
                </Link>
                
                <Link 
                  href={`/${tenant}/register`}
                  className={`flex items-center space-x-1 text-sm font-medium transition-colors ${
                    isActive('/register') ? 'text-primary-600' : 'text-secondary-600 hover:text-secondary-900'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span>ลงทะเบียน</span>
                </Link>
                
                <Link 
                  href={`/${tenant}/my-warranties`}
                  className={`flex items-center space-x-1 text-sm font-medium transition-colors ${
                    isActive('/my-warranties') ? 'text-primary-600' : 'text-secondary-600 hover:text-secondary-900'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>ประกันของฉัน</span>
                </Link>
              </nav>
              
              {/* User Info */}
              <div className="flex items-center space-x-3">
                {session?.pictureUrl && (
                  <img 
                    src={session.pictureUrl} 
                    alt={session.displayName}
                    className="h-8 w-8 rounded-full hidden sm:block"
                  />
                )}
                <span className="text-sm text-secondary-700 hidden md:block">
                  {session?.displayName}
                </span>
                
                <button 
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="p-2 hover:bg-secondary-100 rounded-lg transition-colors disabled:opacity-50"
                  title="ออกจากระบบ"
                >
                  {loggingOut ? (
                    <Loader2 className="w-5 h-5 text-secondary-600 animate-spin" />
                  ) : (
                    <LogOut className="w-5 h-5 text-secondary-600" />
                  )}
                </button>
                
                {/* Mobile Menu Button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 hover:bg-secondary-100 rounded-lg transition-colors"
                >
                  {mobileMenuOpen ? (
                    <X className="w-5 h-5 text-secondary-600" />
                  ) : (
                    <Menu className="w-5 h-5 text-secondary-600" />
                  )}
                </button>
              </div>
            </>
          )}
        </div>
        
        {/* Mobile Navigation Menu */}
        {isLoggedIn && mobileMenuOpen && (
          <nav className="md:hidden mt-4 pt-4 border-t border-secondary-200">
            <div className="space-y-2">
              <Link 
                href={`/${tenant}`}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  isActive('/') 
                    ? 'bg-primary-50 text-primary-600' 
                    : 'text-secondary-600 hover:bg-secondary-50'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>หน้าแรก</span>
              </Link>
              
              <Link 
                href={`/${tenant}/register`}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  isActive('/register') 
                    ? 'bg-primary-50 text-primary-600' 
                    : 'text-secondary-600 hover:bg-secondary-50'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>ลงทะเบียนประกัน</span>
              </Link>
              
              <Link 
                href={`/${tenant}/my-warranties`}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  isActive('/my-warranties') 
                    ? 'bg-primary-50 text-primary-600' 
                    : 'text-secondary-600 hover:bg-secondary-50'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>ประกันของฉัน</span>
              </Link>
              
              {/* User Info in Mobile */}
              <div className="flex items-center space-x-3 px-3 py-2 border-t border-secondary-200 mt-2 pt-4">
                {session?.pictureUrl && (
                  <img 
                    src={session.pictureUrl} 
                    alt={session.displayName}
                    className="h-8 w-8 rounded-full"
                  />
                )}
                <span className="text-sm text-secondary-700 flex-1">
                  {session?.displayName}
                </span>
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}