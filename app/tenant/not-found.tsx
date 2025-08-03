// app/tenant/not-found.tsx
import Link from 'next/link'
import { AlertCircle, Home } from 'lucide-react'

export default function TenantNotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-soft p-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-secondary-900 mb-4">
            404 - ไม่พบหน้าที่ต้องการ
          </h1>
          
          <p className="text-secondary-600 mb-8">
            ขออภัย บริษัทหรือหน้าที่คุณกำลังมองหาไม่มีอยู่ในระบบ
            <br />
            กรุณาตรวจสอบ URL อีกครั้ง
          </p>
          
          <Link 
            href="/" 
            className="btn-primary inline-flex items-center"
          >
            <Home className="w-5 h-5 mr-2" />
            กลับหน้าแรก
          </Link>
        </div>
      </div>
    </div>
  )
}