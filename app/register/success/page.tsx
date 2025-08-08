'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  CheckCircle, 
  ExternalLink, 
  Shield, 
  Users, 
  ArrowLeft,
  Loader2
} from 'lucide-react'
import { absoluteUrl } from '@/lib/url-helper'

export default function RegistrationSuccessPage() {
  const searchParams = useSearchParams()
  const [companyData, setCompanyData] = useState<{
    name: string
    slug: string
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get data from URL parameters
    const name = searchParams.get('name')
    const slug = searchParams.get('slug')

    if (name && slug) {
      setCompanyData({
        name: decodeURIComponent(name),
        slug: slug
      })
    }
    setLoading(false)
  }, [searchParams])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          <p className="text-secondary-600">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  if (!companyData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-soft-lg border border-secondary-100 p-8 text-center">
            <h1 className="text-xl font-bold text-secondary-900 mb-4">
              ไม่พบข้อมูลการสมัครสมาชิก
            </h1>
            <Link href="/register" className="btn-primary">
              กลับไปหน้าสมัครสมาชิก
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const customerUrl = absoluteUrl('', { tenant: companyData.slug })
  const adminUrl = absoluteUrl('/admin', { tenant: companyData.slug })

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-secondary-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2 text-secondary-600 hover:text-secondary-900">
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">กลับหน้าแรก</span>
            </Link>
            <div className="flex items-center space-x-3">
              <Image
                src="/logo.svg"
                alt="AooWarranty"
                width={32}
                height={32}
                className="h-8 w-auto"
              />
              <h1 className="text-lg sm:text-xl font-bold text-secondary-900">AooWarranty</h1>
            </div>
            <div className="w-16"></div>
          </div>
        </div>
      </div>

      {/* Success Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-4">
        <div className="w-full max-w-lg">
          <div className="bg-white rounded-2xl shadow-soft-lg border border-secondary-100 p-8 text-center">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            
            <h1 className="text-3xl font-bold text-secondary-900 mb-4">
              สมัครสมาชิกสำเร็จ! 🎉
            </h1>
            
            <p className="text-lg text-secondary-600 mb-8 leading-relaxed">
              ระบบได้สร้างบัญชีของ <strong className="text-secondary-900">{companyData.name}</strong> เรียบร้อยแล้ว
              <br />คุณสามารถเข้าสู่ระบบจัดการได้ทันที
            </p>
            
            {/* Website URL Box */}
            <div className="bg-gradient-to-br from-primary-50 to-accent-50 p-6 rounded-xl mb-8 border border-primary-100">
              <p className="text-sm font-medium text-secondary-700 mb-3">เว็บไซต์ของคุณ:</p>
              <a 
                href={customerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 font-semibold flex items-center justify-center space-x-2 text-base break-all"
              >
                <span>{customerUrl.replace(/https?:\/\//, '')}</span>
                <ExternalLink className="w-5 h-5 flex-shrink-0" />
              </a>
            </div>
            
            {/* Action Buttons */}
            <div className="space-y-3">
              <a 
                href={adminUrl}
                className="btn-primary w-full flex items-center justify-center space-x-2 py-4 text-lg"
              >
                <Shield className="w-6 h-6" />
                <span>เข้าสู่หน้า Admin</span>
              </a>
              
              <a 
                href={customerUrl}
                className="btn-outline w-full flex items-center justify-center space-x-2 py-4"
              >
                <Users className="w-5 h-5" />
                <span>ดูหน้าเว็บสำหรับลูกค้า</span>
              </a>
            </div>

            {/* Additional Info */}
            <div className="mt-8 pt-6 border-t border-secondary-200">
              <h3 className="font-semibold text-secondary-900 mb-3">ข้อมูลสำหรับเข้าสู่ระบบ Admin</h3>
              <div className="bg-secondary-50 p-4 rounded-lg text-left space-y-2">
                <p className="text-sm">
                  <span className="text-secondary-600">อีเมล:</span>{' '}
                  <span className="font-medium text-secondary-900">ใช้อีเมลที่ลงทะเบียน</span>
                </p>
                <p className="text-sm">
                  <span className="text-secondary-600">รหัสผ่าน:</span>{' '}
                  <span className="font-medium text-secondary-900">ใช้รหัสผ่านที่ตั้งไว้</span>
                </p>
              </div>
            </div>

            {/* Footer Link */}
            <Link 
              href="/" 
              className="text-secondary-600 hover:text-secondary-800 text-sm font-medium block mt-6"
            >
              กลับหน้าแรก
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}