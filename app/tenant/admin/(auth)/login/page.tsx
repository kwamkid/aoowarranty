'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, LogIn, Loader2, ArrowLeft, Shield } from 'lucide-react'

// Validation schema
const loginSchema = z.object({
  email: z.string().email('กรุณากรอกอีเมลที่ถูกต้อง'),
  password: z.string().min(1, 'กรุณากรอกรหัสผ่าน')
})

type LoginFormData = z.infer<typeof loginSchema>

export default function AdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tenant, setTenant] = useState<string>('')
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  })
  
  // Extract tenant from pathname or hostname
  useEffect(() => {
    setMounted(true)
    
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname
      
      // Check if production (subdomain)
      if (!hostname.includes('localhost') && !hostname.includes('127.0.0.1')) {
        const parts = hostname.split('.')
        if (parts.length >= 2 && parts[0] !== 'www') {
          setTenant(parts[0])
          console.log('Tenant from subdomain:', parts[0])
          return
        }
      }
      
      // Development - get from pathname
      const pathSegments = pathname.split('/')
      if (pathSegments[1] && pathSegments[1] !== 'admin') {
        setTenant(pathSegments[1])
        console.log('Tenant from path:', pathSegments[1])
      }
    }
  }, [pathname])
  
  // Check for auto-fill data from sessionStorage
  useEffect(() => {
    if (!mounted) return
    
    const tempEmail = sessionStorage.getItem('temp-email')
    const tempPassword = sessionStorage.getItem('temp-password')
    
    if (tempEmail && tempPassword) {
      setValue('email', tempEmail)
      setValue('password', tempPassword)
      
      // Clear temp data
      sessionStorage.removeItem('temp-email')
      sessionStorage.removeItem('temp-password')
      
      // Auto submit
      setTimeout(() => {
        const form = document.getElementById('login-form') as HTMLFormElement
        if (form) {
          form.requestSubmit()
        }
      }, 100)
    }
  }, [mounted, setValue])
  
  const onSubmit = async (data: LoginFormData) => {
    setLoading(true)
    setError('')
    
    try {
      if (!tenant) {
        setError('ไม่พบข้อมูลบริษัท')
        setLoading(false)
        return
      }
      
      console.log('Submitting login with tenant:', tenant)
      
      // Call API with tenant information
      const response = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-tenant': tenant
        },
        body: JSON.stringify({
          ...data,
          tenant: tenant // เพิ่ม tenant ใน body เผื่อ header ไม่ผ่าน
        })
      })
      
      const result = await response.json()
      
      console.log('Login response:', result)
      
      if (result.success) {
        // Build correct redirect URL based on environment
        const hostname = window.location.hostname
        const isProduction = !hostname.includes('localhost') && !hostname.includes('127.0.0.1')
        
        if (isProduction) {
          // Production - we're already on subdomain, just go to /admin
          router.push('/admin')
        } else {
          // Development - include tenant in path
          router.push(`/${tenant}/admin`)
        }
        
        router.refresh()
      } else {
        setError(result.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ')
        
        // Show debug info if available
        if (result.debug) {
          console.error('Login debug info:', result.debug)
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ')
    } finally {
      setLoading(false)
    }
  }
  
  // Build back URL based on environment
  const getBackUrl = () => {
    if (!mounted) return '/'
    
    const hostname = window.location.hostname
    const isProduction = !hostname.includes('localhost') && !hostname.includes('127.0.0.1')
    
    if (isProduction) {
      // Production - relative path
      return '/'
    } else {
      // Development - with tenant
      return tenant ? `/${tenant}` : '/'
    }
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Link 
          href={getBackUrl()}
          className="inline-flex items-center text-secondary-600 hover:text-secondary-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          กลับหน้าหลัก
        </Link>
        
        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-soft border border-secondary-100 p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-secondary-900">เข้าสู่ระบบ Admin</h1>
            <p className="text-secondary-600 mt-2">จัดการระบบรับประกันสินค้า</p>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}
          
          {/* Login Form */}
          <form id="login-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                อีเมล
              </label>
              <input
                type="email"
                {...register('email')}
                className="input-primary"
                placeholder="admin@company.com"
                autoComplete="email"
              />
              {errors.email && (
                <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                รหัสผ่าน
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  className="input-primary pr-10"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-secondary-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-secondary-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500" />
                <span className="ml-2 text-sm text-secondary-700">จดจำฉัน</span>
              </label>
              
              <a href="#" className="text-sm text-primary-600 hover:text-primary-700">
                ลืมรหัสผ่าน?
              </a>
            </div>
            
            <button
              type="submit"
              disabled={loading || !mounted || !tenant}
              className="btn-primary w-full flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  กำลังเข้าสู่ระบบ...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  เข้าสู่ระบบ
                </>
              )}
            </button>
          </form>
          
          {/* Debug Info - Only show in development */}
          {process.env.NODE_ENV === 'development' && mounted && (
            <div className="mt-6 pt-6 border-t border-secondary-200">
              <p className="text-xs text-secondary-500 text-center">
                Tenant: {tenant || 'Not detected'}<br />
                Path: {pathname}<br />
                Host: {typeof window !== 'undefined' ? window.location.hostname : 'SSR'}
              </p>
            </div>
          )}
        </div>
        
        {/* Additional Debug for Production */}
        {mounted && !tenant && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠️ ไม่พบข้อมูลบริษัท กรุณาตรวจสอบ URL
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              URL: {typeof window !== 'undefined' ? window.location.href : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}