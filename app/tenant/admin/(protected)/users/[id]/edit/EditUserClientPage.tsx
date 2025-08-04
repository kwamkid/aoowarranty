'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  ArrowLeft, 
  Save, 
  Loader2,
  Mail,
  User,
  Shield,
  UserCheck
} from 'lucide-react'

// Validation schema
const userSchema = z.object({
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง'),
  name: z.string().min(1, 'กรุณากรอกชื่อ'),
  role: z.enum(['owner', 'admin', 'manager', 'viewer']),
  isActive: z.boolean()
})

type UserFormData = z.infer<typeof userSchema>

interface EditUserClientPageProps {
  initialUser: {
    id: string
    companyId: string
    email: string
    name: string
    role: 'owner' | 'admin' | 'manager' | 'viewer'
    isActive: boolean
  }
  tenant: string
  userId: string
}

export default function EditUserClientPage({ 
  initialUser, 
  tenant,
  userId 
}: EditUserClientPageProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: initialUser.email,
      name: initialUser.name,
      role: initialUser.role,
      isActive: initialUser.isActive
    }
  })
  
  // Submit form
  const onSubmit = async (data: UserFormData) => {
    setLoading(true)
    
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      const result = await response.json()
      
      if (result.success) {
        router.push(`/${tenant}/admin/users`)
        router.refresh()
      } else {
        alert(result.message || 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล')
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการแก้ไขข้อมูล')
    } finally {
      setLoading(false)
    }
  }
  
  const isOwner = initialUser.role === 'owner'
  
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
        
        <h1 className="text-2xl font-bold text-secondary-900">แก้ไขข้อมูลผู้ใช้</h1>
        <p className="text-sm text-secondary-600 mt-1">
          แก้ไขข้อมูลและสิทธิ์การเข้าถึง
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
                disabled={isOwner}
                className={`w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  isOwner ? 'bg-secondary-100 cursor-not-allowed' : ''
                }`}
              >
                {isOwner && <option value="owner">เจ้าของ - จัดการทุกอย่างในระบบ</option>}
                <option value="viewer">ผู้ใช้ทั่วไป - ดูข้อมูลอย่างเดียว</option>
                <option value="manager">ผู้จัดการ - จัดการสินค้าและการรับประกัน</option>
                <option value="admin">ผู้ดูแล - จัดการทุกอย่างในระบบ</option>
              </select>
              
              {isOwner && (
                <p className="text-xs text-secondary-500 mt-1">
                  ไม่สามารถเปลี่ยนบทบาทของเจ้าของระบบได้
                </p>
              )}
              
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-700">
                  <strong>ผู้ใช้ทั่วไป:</strong> ดูข้อมูลอย่างเดียว ไม่สามารถแก้ไข<br />
                  <strong>ผู้จัดการ:</strong> จัดการสินค้า แบรนด์ และการรับประกัน แต่ไม่สามารถจัดการผู้ใช้<br />
                  <strong>ผู้ดูแล:</strong> จัดการทุกอย่างในระบบ รวมถึงผู้ใช้งาน
                </p>
              </div>
            </div>
            
            {/* Active Status */}
            <div>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  {...register('isActive')}
                  disabled={isOwner}
                  className={`w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500 ${
                    isOwner ? 'cursor-not-allowed' : ''
                  }`}
                />
                <span className="text-sm font-medium text-secondary-700 flex items-center">
                  <UserCheck className="w-4 h-4 mr-1" />
                  เปิดใช้งานบัญชีนี้
                </span>
              </label>
              <p className="text-xs text-secondary-500 mt-1 ml-7">
                หากปิดใช้งาน ผู้ใช้จะไม่สามารถเข้าสู่ระบบได้
              </p>
              {isOwner && (
                <p className="text-xs text-red-500 mt-1 ml-7">
                  ไม่สามารถปิดการใช้งานบัญชีเจ้าของระบบได้
                </p>
              )}
            </div>
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
                กำลังบันทึก...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                บันทึกการเปลี่ยนแปลง
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}