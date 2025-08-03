'use client'

import AdminLayout from '@/components/admin/AdminLayout'
import { 
  Package, 
  Users, 
  FileText, 
  TrendingUp,
  Calendar,
  AlertTriangle
} from 'lucide-react'

// Mock data - จะเชื่อมต่อกับ Firebase ในภายหลัง
const mockCompanyInfo = {
  name: 'ABC Baby Shop',
  logo: '/company-logos/abc-baby.png' // จะมีเมื่อลูกค้าอัพโหลด
}

const mockUserInfo = {
  name: 'สมชาย ใจดี',
  email: 'admin@abcbaby.com',
  role: 'Administrator'
}

const stats = [
  {
    title: 'การลงทะเบียนทั้งหมด',
    value: '1,234',
    change: '+12%',
    changeType: 'increase' as const,
    icon: FileText,
    color: 'bg-blue-500'
  },
  {
    title: 'สินค้าในระบบ',
    value: '89',
    change: '+3',
    changeType: 'increase' as const,
    icon: Package,
    color: 'bg-green-500'
  },
  {
    title: 'ลูกค้าใหม่เดือนนี้',
    value: '156',
    change: '+18%',
    changeType: 'increase' as const,
    icon: Users,
    color: 'bg-purple-500'
  },
  {
    title: 'ประกันใกล้หมดอายุ',
    value: '23',
    change: '+5',
    changeType: 'warning' as const,
    icon: AlertTriangle,
    color: 'bg-orange-500'
  }
]

const recentRegistrations = [
  {
    id: '1',
    customerName: 'นางสาวมาลี ดอกไม้',
    product: 'Samsung Galaxy S24',
    date: '2024-08-01',
    warranty: '2026-08-01',
    status: 'active'
  },
  {
    id: '2',
    customerName: 'นายสมศักดิ์ เรืองแสง',
    product: 'iPhone 15 Pro',
    date: '2024-07-28',
    warranty: '2025-07-28',
    status: 'active'
  },
  {
    id: '3',
    customerName: 'นางสุนีย์ แสงทอง',
    product: 'MacBook Air M2',
    date: '2024-07-25',
    warranty: '2027-07-25',
    status: 'active'
  }
]

export default function AdminDashboard() {
  return (
    <AdminLayout companyInfo={mockCompanyInfo} userInfo={mockUserInfo}>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">แดชบอร์ด</h1>
          <p className="text-secondary-600 mt-2">ภาพรวมระบบลงทะเบียนรับประกันสินค้า</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-secondary-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-secondary-900 mt-2">{stat.value}</p>
                  <div className="flex items-center mt-2">
                    <span className={`text-sm font-medium ${
                      stat.changeType === 'increase' ? 'text-green-600' :
                      stat.changeType === 'warning' ? 'text-orange-600' : 'text-red-600'
                    }`}>
                      {stat.change}
                    </span>
                    <span className="text-sm text-secondary-500 ml-1">จากเดือนที่แล้ว</span>
                  </div>
                </div>
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Registration Chart */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-secondary-900">การลงทะเบียนรายเดือน</h3>
              <Calendar className="w-5 h-5 text-secondary-400" />
            </div>
            <div className="h-64 bg-secondary-50 rounded-lg flex items-center justify-center">
              <p className="text-secondary-500">กราฟแสดงการลงทะเบียนรายเดือน</p>
            </div>
          </div>

          {/* Popular Products */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-secondary-900">สินค้ายอดนิยม</h3>
              <TrendingUp className="w-5 h-5 text-secondary-400" />
            </div>
            <div className="space-y-4">
              {[
                { name: 'Samsung Galaxy S24', count: 45 },
                { name: 'iPhone 15 Pro', count: 38 },
                { name: 'MacBook Air M2', count: 32 },
                { name: 'iPad Pro', count: 28 },
                { name: 'AirPods Pro', count: 24 }
              ].map((product, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-secondary-700">{product.name}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-secondary-200 rounded-full h-2">
                      <div 
                        className="bg-primary-500 h-2 rounded-full" 
                        style={{ width: `${(product.count / 45) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-secondary-900 w-8">{product.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Registrations */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-secondary-900">การลงทะเบียนล่าสุด</h3>
            <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              ดูทั้งหมด
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-secondary-200">
                  <th className="text-left py-3 px-4 font-medium text-secondary-600">ลูกค้า</th>
                  <th className="text-left py-3 px-4 font-medium text-secondary-600">สินค้า</th>
                  <th className="text-left py-3 px-4 font-medium text-secondary-600">วันที่ลงทะเบียน</th>
                  <th className="text-left py-3 px-4 font-medium text-secondary-600">วันหมดประกัน</th>
                  <th className="text-left py-3 px-4 font-medium text-secondary-600">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {recentRegistrations.map((registration) => (
                  <tr key={registration.id} className="border-b border-secondary-100 hover:bg-secondary-50">
                    <td className="py-3 px-4 text-secondary-900">{registration.customerName}</td>
                    <td className="py-3 px-4 text-secondary-700">{registration.product}</td>
                    <td className="py-3 px-4 text-secondary-700">{registration.date}</td>
                    <td className="py-3 px-4 text-secondary-700">{registration.warranty}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ใช้งานได้
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}