'use client'

import React, { useState } from 'react'
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
    href: '/admin',
    icon: LayoutDashboard
  },
  {
    title: 'จัดการแบรนด์',
    href: '/admin/brands',
    icon: Building2
  },
  {
    title: 'จัดการสินค้า',
    href: '/admin/products',
    icon: Package
  },
  {
    title: 'ข้อมูลการลงทะเบียน',
    href: '/admin/registrations',
    icon: FileText
  },
  {
    title: 'จัดการผู้ใช้',
    href: '/admin/users',
    icon: Users
  },
  {
    title: 'ตั้งค่าระบบ',
    href: '/admin/settings',
    icon: Settings
  }
]

export default function AdminLayout({ children, companyInfo, userInfo }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

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
        "fixed inset-y-0 left-0 z-50 w-64 bg-secondary-800 transform transition-transform duration-200 ease-in-out lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo Section */}
        <div className="flex items-center justify-center p-6 border-b border-secondary-700">
          <div className="relative">
            {/* Circular Logo Background with Border */}
            <div className="w-16 h-16 rounded-full shadow-lg border-4 border-white relative overflow-hidden bg-white">
              <Image
                src="/logo.svg"
                alt="WarrantyHub Logo"
                width={64}
                height={64}
                className="w-full h-full object-cover rounded-full"
              />
              <div className="absolute inset-0 rounded-full border-2 border-primary-400"></div>
            </div>
          </div>
          <div className="ml-3">
            <h1 className="text-xl font-bold text-white">WarrantyHub</h1>
            <p className="text-sm text-secondary-300">Admin Panel</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="mt-6 px-3">
          <ul className="space-y-1">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
              
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors duration-200",
                      isActive
                        ? "bg-primary-500 text-white shadow-md"
                        : "text-secondary-300 hover:bg-secondary-700 hover:text-white"
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.title}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Customer Site Link */}
        <div className="absolute bottom-6 left-3 right-3">
          <Link
            href="/"
            className="flex items-center px-3 py-3 text-sm font-medium text-secondary-300 hover:bg-secondary-700 hover:text-white rounded-lg transition-colors duration-200"
          >
            <Home className="w-5 h-5 mr-3" />
            กลับหน้าลูกค้า
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Navigation */}
        <header className="bg-white shadow-sm border-b border-secondary-200">
          <div className="flex items-center justify-between px-4 py-4">
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
                  <Search className="h-5 w-5 text-secondary-400" />
                </div>
                <input
                  type="text"
                  placeholder="ค้นหา..."
                  className="input-primary pl-10 w-64"
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
                <div className="hidden sm:flex items-center space-x-3 px-3 py-2 bg-secondary-50 rounded-lg">
                  {companyInfo.logo ? (
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-secondary-200">
                      <Image
                        src={companyInfo.logo}
                        alt={companyInfo.name}
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-secondary-300 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-secondary-600" />
                    </div>
                  )}
                  <span className="text-sm font-medium text-secondary-700">{companyInfo.name}</span>
                </div>
              )}

              {/* User Menu */}
              <div className="relative group">
                <button className="flex items-center space-x-3 px-3 py-2 text-sm font-medium text-secondary-700 hover:bg-secondary-100 rounded-lg transition-colors duration-200">
                  <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center">
                    <span className="text-white font-medium">
                      {userInfo?.name?.charAt(0) || 'A'}
                    </span>
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="font-medium">{userInfo?.name || 'Admin'}</p>
                    <p className="text-xs text-secondary-500">{userInfo?.role || 'Administrator'}</p>
                  </div>
                </button>

                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white border border-secondary-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="py-2">
                    <Link href="/admin/profile" className="block px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50">
                      ข้อมูลส่วนตัว
                    </Link>
                    <Link href="/admin/settings" className="block px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50">
                      ตั้งค่า
                    </Link>
                    <hr className="my-1 border-secondary-200" />
                    <button className="w-full text-left px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 flex items-center">
                      <LogOut className="w-4 h-4 mr-2" />
                      ออกจากระบบ
                    </button>
                  </div>
                </div>
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