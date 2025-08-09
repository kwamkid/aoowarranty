'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  ArrowLeft, 
  Users, 
  Loader2,
  UserPlus,
  Mail,
  User,
  Shield,
  Key,
  Copy,
  CheckCircle
} from 'lucide-react'
import { generatePassword } from '@/lib/utils'
import { useLoadingRouter } from '@/hooks/useLoadingRouter'
import { useLoading } from '@/components/providers/LoadingProvider'

// Validation schema
const userSchema = z.object({
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง'),
  name: z.string().min(1, 'กรุณากรอกชื่อ'),
  role: z.enum(['owner', 'admin', 'manager', 'viewer']),
  generatePassword: z.boolean()
})

type UserFormData = z.infer<typeof userSchema>

export default function NewUserPage() {
  const [loading, setLoading] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [copied, setCopied] = useState(false)
  const router = useLoadingRouter()
  const { showLoading, hideLoading } = useLoading()
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      role: 'viewer',
      generatePassword: true
    }
  })
  
  const generateNewPassword = watch('generatePassword')
  
  // Get tenant from URL
  const getTenant = () => {
    const pathSegments = window.location.pathname.split('/')
    return pathSegments[1]
  }
  
  const tenant = getTenant()
  
  // Generate password when checkbox is checked
  useState(() => {
    if (generateNewPassword) {
      setGeneratedPassword(generatePassword(6))
    }
  })
  
  // Copy password to clipboard
  const copyPassword = () => {
    navigator.clipboard.writeText(generatedPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  // Submit form
  const onSubmit = async (data: UserFormData) => {
    setLoading(true)
    showLoading()
    
    try {
      const payload = {
        ...data,
        password: generateNewPassword ? generatedPassword : undefined
      }
      
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      const result = await response.json()
      
      if (result.success) {
        setShowSuccess(true)
        // Wait 2 seconds then redirect
        setTimeout(() => {
          router.push(`/${tenant}/admin/users`)
        }, 2000)
      } else {
        hideLoading()
        alert(result.message || 'เกิดข้อผิดพลาดในการเพิ่มผู้ใช้')
      }
    } catch (error) {
      hideLoading()
      alert('เกิดข้อผิดพลาดในการเพิ่มผู้ใช้')
    } finally {
      setLoading(false)
    }
  }
  
  if (showSuccess) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="card text-center py-12">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-secondary-900 mb-2">
            เพิ่มผู้ใช้สำเร็จ!
          </h2>
          <p className="text-secondary-600 mb-6">
            กำลังกลับไปยังหน้าจัดการผู้ใช้...
          </p>
          
          {generatedPassword && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800 mb-2">
                กรุณาคัดลอกรหัสผ่านและส่งให้ผู้ใช้:
              </p>
              <div className="flex items-center justify-center space-x-2">
                <div 
                  className="bg-white px-3 py-1 rounded border border-yellow-300 font-mono"
                  style={{ color: '#1f2937' }}
                >
                  {generatedPassword}
                </div>
                <button
                  onClick={copyPassword}
                  className="btn-outline p-2"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          
          <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto" />
        </div>
      </div>
    )
  }
  
  return (
    <div className="max-w-2xl">
      {/* Page Header */}
      <div className="mb-6">
        <Link 
          href={`/${tenant}/admin/users`}
          className="inline-flex items-center text-sm text-secondary-600 hover:text-secondary-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          กลับ
        </Link>
        
        <h1 className="text-2xl font-bold text-secondary-900">เพิ่มผู้ใช้ใหม่</h1>
        <p className="text-sm text-secondary-600 mt-1">
          เพิ่มผู้ใช้เพื่อเข้าถึงระบบจัดการ
        </p>
      </div>
      
      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-secondary-900 mb-6">
            ข้อมูลผู้ใช้
          </h2>
          
          <div className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                อีเมล *
              </label>
              <input
                type="email"
                {...register('email')}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="user@example.com"
              />
              {errors.email && (
                <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
              )}
              <p className="text-xs text-secondary-500 mt-1">
                อีเมลนี้จะใช้สำหรับเข้าสู่ระบบ
              </p>
            </div>
            
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                ชื่อ-นามสกุล *
              </label>
              <input
                type="text"
                {...register('name')}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="ชื่อ นามสกุล"
              />
              {errors.name && (
                <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>
            
            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                <Shield className="w-4 h-4 inline mr-1" />
                บทบาท *
              </label>
              <select
                {...register('role')}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="viewer">ผู้ใช้ทั่วไป - ดูข้อมูลอย่างเดียว</option>
                <option value="manager">ผู้จัดการ - จัดการสินค้าและการรับประกัน</option>
                <option value="admin">ผู้ดูแล - จัดการทุกอย่างในระบบ</option>
              </select>
              
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-700">
                  <strong>ผู้ใช้ทั่วไป:</strong> ดูข้อมูลอย่างเดียว ไม่สามารถแก้ไข<br />
                  <strong>ผู้จัดการ:</strong> จัดการสินค้า แบรนด์ และการรับประกัน แต่ไม่สามารถจัดการผู้ใช้<br />
                  <strong>ผู้ดูแล:</strong> จัดการทุกอย่างในระบบ รวมถึงผู้ใช้งาน
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Password Card */}
        <div className="card">
          <h2 className="text-lg font-semibold text-secondary-900 mb-6 flex items-center">
            <Key className="w-5 h-5 mr-2 text-primary-500" />
            รหัสผ่าน
          </h2>
          
          <div>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('generatePassword')}
                className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-secondary-700">
                สร้างรหัสผ่านอัตโนมัติ
              </span>
            </label>
            
            {generateNewPassword && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 mb-2">
                  รหัสผ่านที่สร้างขึ้น:
                </p>
                <div className="flex items-center space-x-2">
                  <div 
                    className="flex-1 bg-white px-3 py-2 rounded border border-yellow-300 font-mono text-sm"
                    style={{ color: '#1f2937' }}
                  >
                    {generatedPassword}
                  </div>
                  <button
                    type="button"
                    onClick={copyPassword}
                    className="btn-outline p-2 flex items-center"
                    title="คัดลอกรหัสผ่าน"
                  >
                    {copied ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-yellow-700 mt-2">
                  กรุณาคัดลอกรหัสผ่านนี้และส่งให้ผู้ใช้ทางช่องทางที่ปลอดภัย
                </p>
              </div>
            )}
            
            {!generateNewPassword && (
              <p className="text-sm text-secondary-600 mt-2">
                ผู้ใช้จะต้องติดต่อผู้ดูแลระบบเพื่อขอรหัสผ่าน
              </p>
            )}
          </div>
        </div>
        
        {/* Submit Buttons */}
        <div className="flex items-center justify-end space-x-4">
          <Link
            href={`/${tenant}/admin/users`}
            className="btn-outline"
          >
            ยกเลิก
          </Link>
          
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                กำลังเพิ่มผู้ใช้...
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5 mr-2" />
                เพิ่มผู้ใช้
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}