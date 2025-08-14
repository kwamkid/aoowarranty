'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Package, 
  Building2, 
  FileText, 
  Users, 
  Settings, 
  Menu, 
  X,
  LogOut,
  Home,
  Bell,
  Search
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLoadingRouter } from '@/hooks/useLoadingRouter'
import { useLoading } from '@/components/providers/LoadingProvider'

interface AdminLayoutProps {
  children: React.ReactNode
  companyInfo?: {
    name: string
    logo?: string
  }
  userInfo?: {
    name: string
    email: string
    role: string
  }
}

const sidebarItems = [
  {
    title: 'แดชบอร์ด',
    href: '',
    icon: LayoutDashboard,
    iconColor: '#3b82f6' // blue-500
  },
  {
    title: 'จัดการแบรนด์',
    href: 'brands',
    icon: Building2,
    iconColor: '#a855f7' // purple-500
  },
  {
    title: 'จัดการสินค้า',
    href: 'products',
    icon: Package,
    iconColor: '#22c55e' // green-500
  },
  {
    title: 'ข้อมูลการลงทะเบียน',
    href: 'registrations',
    icon: FileText,
    iconColor: '#f97316' // orange-500
  },
  {
    title: 'จัดการผู้ใช้',
    href: 'users',
    icon: Users,
    iconColor: '#ec4899' // pink-500
  },
  {
    title: 'ตั้งค่าระบบ',
    href: 'settings',
    icon: Settings,
    iconColor: '#6b7280' // gray-500
  }
]

export default function AdminLayout({ children, companyInfo, userInfo }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const router = useLoadingRouter()
  const { showLoading, hideLoading } = useLoading()

  // Debug pathname
  useEffect(() => {
    console.log('Current pathname:', pathname)
    console.log('Tenant:', pathname.split('/')[1])
  }, [pathname])

  // Get tenant from pathname or headers
  const getTenant = () => {
    // Check if we're in a rewritten path
    if (pathname.startsWith('/tenant/')) {
      // Get tenant from headers if available
      if (typeof window !== 'undefined') {
        // Try to get from URL
        const hostname = window.location.hostname
        const parts = hostname.split('.')
        
        // Check subdomain
        if (parts.length >= 3 && parts[0] !== 'www') {
          return parts[0]
        }
        
        // Check localhost pattern
        const urlPath = window.location.pathname
        const pathParts = urlPath.split('/')
        if (pathParts[1] && pathParts[1] !== 'tenant') {
          return pathParts[1]
        }
      }
    }
    
    // Normal path
    const pathSegments = pathname.split('/')
    return pathSegments[1] || ''
  }

  const tenant = getTenant()

  // Build URLs based on current location
  const buildAdminUrl = (path: string) => {
    if (!mounted) return '#'
    
    // If empty path (dashboard), return current admin root
    if (!path) {
      return `/${tenant}/admin`
    }
    
    // For other paths, append to admin base
    return `/${tenant}/admin/${path}`
  }

  const buildCustomerUrl = () => {
    if (!mounted) return '#'
    return `/${tenant}`
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle navigation with loading
  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    if (!mounted) return
    setSidebarOpen(false)
    router.push(href)
  }

  // Handle logout
  const handleLogout = async () => {
    try {
      setLoggingOut(true)
      showLoading()
      
      // Call logout API
      const response = await fetch('/api/auth/me', { 
        method: 'DELETE',
        credentials: 'include'
      })
      
      const result = await response.json()
      
      if (response.ok && result.success) {
        // Use redirect URL from API response
        if (result.redirectUrl) {
          // For production, use window.location for full redirect
          if (result.redirectUrl.startsWith('http')) {
            window.location.href = result.redirectUrl
          } else {
            router.push(result.redirectUrl)
          }
        } else {
          // Fallback
          router.push('/')
        }
      } else {
        console.error('Logout failed')
        setLoggingOut(false)
        hideLoading()
      }
    } catch (error) {
      console.error('Logout error:', error)
      setLoggingOut(false)
      hideLoading()
    }
  }

  // Check if path is active
  const isActiveItem = (itemHref: string) => {
    if (!itemHref) {
      // Dashboard - check if we're at admin root
      return pathname.endsWith('/admin')
    }
    // Other items - check if path includes the href
    return pathname.includes(`/admin/${itemHref}`)
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-secondary-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo Section */}
        <div className="flex items-center px-6 py-4 border-b border-secondary-200 h-16">
          <Image
            src="/logo.svg"
            alt="AooWarranty Logo"
            width={40}
            height={40}
            className="w-10 h-10"
          />
          <div className="ml-3">
            <h1 className="text-lg font-bold text-secondary-900 leading-tight">AooWarranty</h1>
            <p className="text-xs text-secondary-600 leading-tight">Admin Panel</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="mt-6 px-3">
          <ul className="space-y-1">
            {sidebarItems.map((item) => {
              const href = buildAdminUrl(item.href)
              const isActive = mounted && isActiveItem(item.href)
              
              return (
                <li key={item.href}>
                  <a
                    href={href}
                    onClick={(e) => handleNavigation(e, href)}
                    className={cn(
                      "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer",
                      isActive
                        ? "bg-primary-50 text-primary-700 shadow-sm"
                        : "text-secondary-700 hover:bg-secondary-50"
                    )}
                  >
                    <item.icon 
                      className="w-5 h-5 mr-3 transition-colors"
                      style={{ color: isActive ? '#dc2626' : item.iconColor }}
                    />
                    {item.title}
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Customer Site Link */}
        <div className="absolute bottom-6 left-3 right-3">
          <a
            href={buildCustomerUrl()}
            onClick={(e) => handleNavigation(e, buildCustomerUrl())}
            className="flex items-center px-3 py-2.5 text-sm font-medium text-secondary-700 hover:bg-secondary-50 rounded-lg transition-colors duration-200 cursor-pointer"
          >
            <Home className="w-5 h-5 mr-3" style={{ color: '#6366f1' }} />
            กลับหน้าลูกค้า
          </a>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Navigation */}
        <header className="bg-white shadow-sm border-b border-secondary-200 h-16">
          <div className="flex items-center justify-between px-4 h-full">
            {/* Mobile Menu Button & Search */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 text-secondary-600 hover:text-secondary-900 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              {/* Search Bar */}
              <div className="hidden sm:block relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-secondary-400" />
                </div>
                <input
                  type="text"
                  placeholder="ค้นหา..."
                  className="pl-9 pr-3 py-1.5 text-sm border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-48"
                />
              </div>
            </div>

            {/* Right Side - Company Logo & User Menu */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="p-2 text-secondary-600 hover:text-secondary-900 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg relative">
                <Bell className="w-6 h-6" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full"></span>
              </button>

              {/* Company Info */}
              {companyInfo && (
                <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-secondary-50 rounded-lg">
                  {companyInfo.logo ? (
                    <div className="w-6 h-6 rounded overflow-hidden bg-secondary-200 flex-shrink-0">
                      <img
                        src={companyInfo.logo}
                        alt={companyInfo.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded bg-secondary-300 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-3 h-3 text-secondary-600" />
                    </div>
                  )}
                  <span className="text-xs font-medium text-secondary-700 max-w-[100px] truncate">
                    {companyInfo.name}
                  </span>
                </div>
              )}

              {/* User Menu */}
              <div className="relative">
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  onBlur={() => setTimeout(() => setShowUserMenu(false), 200)}
                  className="flex items-center space-x-3 px-3 py-2 text-sm font-medium text-secondary-700 hover:bg-secondary-100 rounded-lg transition-colors duration-200"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {userInfo?.name?.charAt(0) || 'A'}
                    </span>
                  </div>
                  <div className="hidden sm:block text-left max-w-[120px]">
                    <p className="font-medium text-sm truncate leading-tight">
                      {userInfo?.name || 'Admin'}
                    </p>
                    <p className="text-xs text-secondary-500 capitalize leading-tight">
                      {userInfo?.role || 'Administrator'}
                    </p>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-secondary-200 rounded-lg shadow-lg z-50">
                    <div className="py-2">
                      <a
                        href={mounted ? buildAdminUrl('profile') : '#'} 
                        className="block px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault()
                          if (!mounted) return
                          setShowUserMenu(false)
                          router.push(buildAdminUrl('profile'))
                        }}
                      >
                        ข้อมูลส่วนตัว
                      </a>
                      <a
                        href={mounted ? buildAdminUrl('settings') : '#'} 
                        className="block px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault()
                          if (!mounted) return
                          setShowUserMenu(false)
                          router.push(buildAdminUrl('settings'))
                        }}
                      >
                        ตั้งค่า
                      </a>
                      <hr className="my-1 border-secondary-200" />
                      <button 
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="w-full text-left px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 flex items-center disabled:opacity-50"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        {loggingOut ? 'กำลังออกจากระบบ...' : 'ออกจากระบบ'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}