'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Users,
  MoreVertical,
  UserCheck,
  Loader2,
  Key,
  Shield,
  Eye,
  UserX,
  Calendar,
  Mail
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useLoading } from '@/components/providers/LoadingProvider'
import { useDialog } from '@/hooks/useDialog'
import DropdownMenu from '@/components/ui/DropdownMenu'

interface User {
  id: string
  companyId: string
  email: string
  name: string
  role: 'owner' | 'admin' | 'manager' | 'viewer'
  isActive: boolean
  lastLogin?: string | null
  createdAt: string
  createdBy: string
}

interface UsersPageProps {
  initialUsers: User[]
  tenant: string
  currentUserId: string | null
}

const roleLabels = {
  admin: { label: 'ผู้ดูแล', color: 'green', icon: Shield },
  manager: { label: 'ผู้จัดการ', color: 'green', icon: Users },
  viewer: { label: 'ผู้ใช้ทั่วไป', color: 'green', icon: Eye }
}

export default function UsersClientPage({ 
  initialUsers = [], 
  tenant,
  currentUserId 
}: UsersPageProps) {
  const [users, setUsers] = useState<User[]>(initialUsers || [])
  const [searchTerm, setSearchTerm] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [resetting, setResetting] = useState<string | null>(null)
  const router = useRouter()
  const { showLoading, hideLoading } = useLoading()
  const { confirm, error, success, info, DialogComponents } = useDialog()
  
  // Filter users based on search
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  // Get role config
  const getRoleConfig = (role: string) => {
    return roleLabels[role as keyof typeof roleLabels] || roleLabels.viewer
  }
  
  // Handle delete user
  const handleDelete = async (userId: string, userName: string) => {
    // Cannot delete yourself
    if (userId === currentUserId) {
      error('ไม่สามารถลบบัญชีของตัวเองได้')
      return
    }
    
    // Check if trying to delete owner
    const userToDelete = users.find(u => u.id === userId)
    if (userToDelete?.role === 'owner') {
      error('ไม่สามารถลบบัญชีเจ้าของระบบได้')
      return
    }
    
    try {
      const confirmed = await confirm({
        title: 'ยืนยันการลบผู้ใช้',
        message: `ต้องการลบผู้ใช้ "${userName}" หรือไม่?\n\nการดำเนินการนี้ไม่สามารถย้อนกลับได้`,
        type: 'danger',
        confirmText: 'ลบผู้ใช้',
        cancelText: 'ยกเลิก'
      })
      
      if (!confirmed) return
      
      setDeleting(userId)
      showLoading()
      
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (result.success) {
        // Remove from local state
        setUsers(users.filter(u => u.id !== userId))
        success('ลบผู้ใช้สำเร็จ')
      } else {
        error(result.message || 'เกิดข้อผิดพลาดในการลบผู้ใช้')
      }
    } catch (err) {
      console.error('Delete error:', err)
      error('เกิดข้อผิดพลาดในการลบผู้ใช้')
    } finally {
      setDeleting(null)
      hideLoading()
    }
  }
  
  // Handle reset password
  const handleResetPassword = async (userId: string, userName: string) => {
    try {
      const confirmed = await confirm({
        title: 'รีเซ็ตรหัสผ่าน',
        message: `ต้องการรีเซ็ตรหัสผ่านของ "${userName}" หรือไม่?\n\nระบบจะสร้างรหัสผ่านใหม่และแสดงให้คุณทราบ`,
        type: 'warning',
        confirmText: 'รีเซ็ตรหัสผ่าน',
        cancelText: 'ยกเลิก'
      })
      
      if (!confirmed) return
      
      setResetting(userId)
      
      const response = await fetch(`/api/users/${userId}/reset-password`, {
        method: 'POST'
      })
      
      const result = await response.json()
      
      if (result.success && result.data?.newPassword) {
        // Show new password
        info(
          `รหัสผ่านใหม่คือ:\n\n${result.data.newPassword}\n\nกรุณาคัดลอกและส่งให้ผู้ใช้ทางช่องทางที่ปลอดภัย`,
          'รีเซ็ตรหัสผ่านสำเร็จ'
        )
      } else {
        error(result.message || 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน')
      }
    } catch (err) {
      console.error('Reset password error:', err)
      error('เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน')
    } finally {
      setResetting(null)
    }
  }
  
  // Handle toggle active status
  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/users/${userId}/toggle-active`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      })
      
      const result = await response.json()
      
      if (result.success) {
        // Update local state
        setUsers(users.map(u => 
          u.id === userId ? { ...u, isActive: !currentStatus } : u
        ))
        success(currentStatus ? 'ปิดการใช้งานผู้ใช้สำเร็จ' : 'เปิดการใช้งานผู้ใช้สำเร็จ')
      } else {
        error(result.message || 'เกิดข้อผิดพลาด')
      }
    } catch (err) {
      error('เกิดข้อผิดพลาด')
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">จัดการผู้ใช้งาน</h1>
          <p className="text-sm text-secondary-600 mt-1">
            จัดการบัญชีผู้ใช้และกำหนดสิทธิ์การเข้าถึง
          </p>
        </div>
        
        <Link
          href={`/${tenant}/admin/users/new`}
          className="btn-primary inline-flex items-center justify-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          เพิ่มผู้ใช้ใหม่
        </Link>
      </div>
      
      {/* Search Bar */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่อหรืออีเมล..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>
      
      {/* Users Table */}
      {filteredUsers.length === 0 ? (
        <div className="card">
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-secondary-900 mb-2">
              {searchTerm ? 'ไม่พบผู้ใช้ที่ค้นหา' : 'ยังไม่มีผู้ใช้'}
            </h3>
            <p className="text-sm text-secondary-600 mb-6">
              {searchTerm ? 'ลองค้นหาด้วยคำอื่น' : 'เริ่มต้นด้วยการเพิ่มผู้ใช้ในระบบ'}
            </p>
            {!searchTerm && (
              <Link
                href={`/${tenant}/admin/users/new`}
                className="btn-primary inline-flex items-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                เพิ่มผู้ใช้แรก
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-secondary-200">
                  <th className="text-left px-4 py-3 text-sm font-medium text-secondary-700">ผู้ใช้</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-secondary-700">บทบาท</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-secondary-700 hidden md:table-cell">เข้าใช้ล่าสุด</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-secondary-700">สถานะ</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-secondary-700">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {filteredUsers.map((user) => {
                  const roleConfig = getRoleConfig(user.role)
                  const RoleIcon = roleConfig.icon
                  const isCurrentUser = user.id === currentUserId
                  
                  return (
                    <tr key={user.id} className="hover:bg-secondary-50 transition-colors relative">
                      {(deleting === user.id || resetting === user.id) && (
                        <td colSpan={5} className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                        </td>
                      )}
                      
                      {/* User Info */}
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-600 font-medium">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-secondary-900">
                              {user.name}
                              {isCurrentUser && (
                                <span className="text-xs text-secondary-500 ml-2">(คุณ)</span>
                              )}
                            </p>
                            <p className="text-sm text-secondary-500 flex items-center">
                              <Mail className="w-3 h-3 mr-1" />
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      
                      {/* Role */}
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${roleConfig.color}-100 text-${roleConfig.color}-800`}>
                          <RoleIcon className="w-3 h-3 mr-1" />
                          {roleConfig.label}
                        </span>
                      </td>
                      
                      {/* Last Login */}
                      <td className="px-4 py-4 text-center hidden md:table-cell">
                        {user.lastLogin ? (
                          <div className="text-sm text-secondary-600">
                            <Calendar className="w-4 h-4 inline mr-1" />
                            {formatDate(user.lastLogin, 'dd/MM/yyyy HH:mm')}
                          </div>
                        ) : (
                          <span className="text-sm text-secondary-400">ยังไม่เคยเข้าใช้</span>
                        )}
                      </td>
                      
                      {/* Status */}
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.isActive ? 'ใช้งาน' : 'ปิดใช้งาน'}
                        </span>
                      </td>
                      
                      {/* Actions */}
                      <td className="px-4 py-4 text-right">
                        <DropdownMenu
                          trigger={
                            <button className="p-1 hover:bg-secondary-100 rounded-lg transition-colors">
                              <MoreVertical className="w-5 h-5 text-secondary-600" />
                            </button>
                          }
                          items={[
                            {
                              label: 'แก้ไข',
                              icon: <Edit className="w-4 h-4" />,
                              onClick: () => router.push(`/${tenant}/admin/users/${user.id}/edit`)
                            },
                            {
                              label: 'รีเซ็ตรหัสผ่าน',
                              icon: <Key className="w-4 h-4" />,
                              onClick: () => handleResetPassword(user.id, user.name)
                            },
                            {
                              label: user.isActive ? 'ปิดการใช้งาน' : 'เปิดการใช้งาน',
                              icon: <UserX className="w-4 h-4" />,
                              onClick: () => handleToggleActive(user.id, user.isActive),
                              disabled: isCurrentUser
                            },
                            {
                              label: 'ลบ',
                              icon: <Trash2 className="w-4 h-4" />,
                              onClick: () => handleDelete(user.id, user.name),
                              className: 'text-red-600 hover:bg-red-50',
                              disabled: isCurrentUser || user.role === 'owner'
                            }
                          ]}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Role Explanation */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
          <Shield className="w-4 h-4 mr-2" />
          คำอธิบายบทบาท
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {Object.entries(roleLabels).map(([role, config]) => {
            const Icon = config.icon
            return (
              <div key={role} className="flex items-start space-x-2">
                <Icon className={`w-4 h-4 text-${config.color}-600 mt-0.5`} />
                <div>
                  <span className="font-medium text-blue-900">{config.label}:</span>
                  <span className="text-blue-700 ml-1">
                    {role === 'owner' && 'เข้าถึงและจัดการทุกอย่างในระบบ'}
                    {role === 'admin' && 'เหมือนเจ้าของ (สำหรับความเข้ากันได้)'}
                    {role === 'manager' && 'จัดการสินค้าและการรับประกัน ไม่สามารถจัดการผู้ใช้'}
                    {role === 'viewer' && 'ดูข้อมูลอย่างเดียว ไม่สามารถแก้ไข'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Render Dialog Components */}
      {DialogComponents}
    </div>
  )
}