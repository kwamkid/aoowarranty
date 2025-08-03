// app/not-found.tsx
'use client'

import Link from 'next/link'
import { AlertCircle, Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 to-white flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center">
        <div className="mb-8">
          <div className="w-24 h-24 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-12 h-12 text-secondary-600" />
          </div>
          
          <h1 className="text-4xl font-bold text-secondary-900 mb-4">
            ไม่พบหน้าที่ต้องการ
          </h1>
          
          <p className="text-lg text-secondary-600 mb-8">
            ขออภัย หน้าที่คุณกำลังมองหาไม่มีอยู่ในระบบ
            <br />
            อาจถูกย้ายหรือลบไปแล้ว
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/" 
            className="btn-primary inline-flex items-center justify-center"
          >
            <Home className="w-5 h-5 mr-2" />
            กลับหน้าแรก
          </Link>
          
          <button 
            onClick={() => window.history.back()}
            className="btn-outline inline-flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            ย้อนกลับ
          </button>
        </div>
      </div>
    </div>
  )
}