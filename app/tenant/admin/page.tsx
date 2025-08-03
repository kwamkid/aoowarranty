// app/tenant/admin/page.tsx
import { getTenantContext } from '@/lib/tenant-context'
import { adminDb } from '@/lib/firebase-admin'
import { 
  Package, 
  Users, 
  FileText, 
  TrendingUp,
  Calendar,
  AlertTriangle
} from 'lucide-react'

async function getDashboardStats(companyId: string) {
  // Get stats from database
  const [brandsSnapshot, productsSnapshot, warrantiesSnapshot] = await Promise.all([
    adminDb.collection('brands').where('companyId', '==', companyId).count().get(),
    adminDb.collection('products').where('companyId', '==', companyId).count().get(),
    adminDb.collection('warranties').where('companyId', '==', companyId).get()
  ])
  
  const now = new Date()
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  
  const warrantiesThisMonth = warrantiesSnapshot.docs.filter(doc => {
    const data = doc.data()
    const regDate = data.registrationDate?.toDate()
    return regDate && regDate >= thisMonth
  }).length
  
  const nearExpiry = warrantiesSnapshot.docs.filter(doc => {
    const data = doc.data()
    const expiryDate = new Date(data.warrantyExpiry)
    const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30
  }).length
  
  return {
    totalBrands: brandsSnapshot.data().count,
    totalProducts: productsSnapshot.data().count,
    totalWarranties: warrantiesSnapshot.size,
    warrantiesThisMonth,
    nearExpiry
  }
}

export default async function AdminDashboard() {
  const { company } = await getTenantContext()
  
  if (!company) return null
  
  const stats = await getDashboardStats(company.id)
  
  const statCards = [
    {
      title: 'การลงทะเบียนทั้งหมด',
      value: stats.totalWarranties.toString(),
      change: `+${stats.warrantiesThisMonth}`,
      changeType: 'increase' as const,
      changeLabel: 'เดือนนี้',
      icon: FileText,
      color: 'bg-blue-500'
    },
    {
      title: 'สินค้าในระบบ',
      value: stats.totalProducts.toString(),
      change: `${stats.totalBrands} แบรนด์`,
      changeType: 'neutral' as const,
      changeLabel: '',
      icon: Package,
      color: 'bg-green-500'
    },
    {
      title: 'ลูกค้าใหม่เดือนนี้',
      value: stats.warrantiesThisMonth.toString(),
      change: '+100%',
      changeType: 'increase' as const,
      changeLabel: 'จากเดือนที่แล้ว',
      icon: Users,
      color: 'bg-purple-500'
    },
    {
      title: 'ประกันใกล้หมดอายุ',
      value: stats.nearExpiry.toString(),
      change: '30 วัน',
      changeType: 'warning' as const,
      changeLabel: 'ภายใน',
      icon: AlertTriangle,
      color: 'bg-orange-500'
    }
  ]
  
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-secondary-900">แดชบอร์ด</h1>
        <p className="text-secondary-600 mt-2">
          ยินดีต้อนรับสู่ระบบจัดการรับประกันสินค้า {company.name}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">{stat.title}</p>
                <p className="text-3xl font-bold text-secondary-900 mt-2">{stat.value}</p>
                <div className="flex items-center mt-2 space-x-1">
                  <span className={`text-sm font-medium ${
                    stat.changeType === 'increase' ? 'text-green-600' :
                    stat.changeType === 'warning' ? 'text-orange-600' : 
                    'text-secondary-600'
                  }`}>
                    {stat.change}
                  </span>
                  {stat.changeLabel && (
                    <span className="text-sm text-secondary-500">{stat.changeLabel}</span>
                  )}
                </div>
              </div>
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-secondary-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <a href="/admin/brands/new" className="btn-outline text-center">
            เพิ่มแบรนด์ใหม่
          </a>
          <a href="/admin/products/new" className="btn-outline text-center">
            เพิ่มสินค้าใหม่
          </a>
          <a href="/admin/registrations" className="btn-outline text-center">
            ดูการลงทะเบียน
          </a>
          <a href="/admin/reports" className="btn-outline text-center">
            Export รายงาน
          </a>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Registrations */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-secondary-900">การลงทะเบียนล่าสุด</h3>
            <a href="/admin/registrations" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              ดูทั้งหมด
            </a>
          </div>
          
          {stats.totalWarranties === 0 ? (
            <div className="text-center py-8 text-secondary-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-secondary-300" />
              <p>ยังไม่มีการลงทะเบียน</p>
              <p className="text-sm mt-1">เริ่มต้นโดยการเพิ่มแบรนด์และสินค้า</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-secondary-500">จะแสดงรายการล่าสุดที่นี่</p>
            </div>
          )}
        </div>

        {/* Getting Started Guide */}
        <div className="card bg-primary-50 border-primary-200">
          <h3 className="text-lg font-semibold text-primary-900 mb-4">
            เริ่มต้นใช้งาน
          </h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                1
              </div>
              <div>
                <p className="font-medium text-primary-900">เพิ่มแบรนด์สินค้า</p>
                <p className="text-sm text-primary-700">เพิ่มแบรนด์ที่คุณจำหน่าย เช่น Samsung, Apple</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                2
              </div>
              <div>
                <p className="font-medium text-primary-900">เพิ่มสินค้า</p>
                <p className="text-sm text-primary-700">เพิ่มสินค้าในแต่ละแบรนด์ พร้อมกำหนดระยะเวลาประกัน</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                3
              </div>
              <div>
                <p className="font-medium text-primary-900">แชร์ลิงก์ให้ลูกค้า</p>
                <p className="text-sm text-primary-700">ส่งลิงก์ให้ลูกค้าลงทะเบียนผ่าน LINE</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}