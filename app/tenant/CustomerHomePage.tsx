// app/tenant/CustomerHomePage.tsx
'use client'

import Link from 'next/link'
import { Shield, FileText, Phone, MapPin, Globe, ArrowRight, CheckCircle } from 'lucide-react'
import CustomerHeader from '@/components/customer/CustomerHeader'

interface CustomerHomePageProps {
  company: any
  tenant: string
  isLoggedIn: boolean
  session?: any
}

export default function CustomerHomePage({ company, tenant, isLoggedIn, session }: CustomerHomePageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
      {/* Shared Header */}
      <CustomerHeader 
        company={company}
        tenant={tenant}
        isLoggedIn={isLoggedIn}
        session={session}
      />

      {/* Hero Section - Mobile First */}
      <section className="px-4 py-8 sm:py-12 md:py-16">
        <div className="max-w-2xl mx-auto text-center">
          {/* Welcome Badge */}
          <div className="inline-flex items-center bg-primary-100 text-primary-700 text-xs sm:text-sm font-medium px-3 py-1.5 rounded-full mb-4">
            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            ลงทะเบียนง่าย ผ่าน LINE
          </div>
          
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-secondary-900 mb-3 sm:mb-4 leading-tight">
            ลงทะเบียนรับประกัน
            <br />
            <span className="text-primary-500">สินค้าออนไลน์</span>
          </h2>
          
          <p className="text-sm sm:text-base text-secondary-600 mb-6 sm:mb-8 px-4">
            ไม่ต้องกังวลใบรับประกันหาย 
            <br className="sm:hidden" />
            เช็คสถานะได้ทุกเมื่อ
          </p>
          
          {/* CTA Buttons - Stack on Mobile */}
          {isLoggedIn && (
            <div className="space-y-3 sm:space-y-0 sm:flex sm:gap-3 sm:justify-center px-4 sm:px-0">
              <Link 
                href={`/${tenant}/register`}
                className="btn-primary w-full sm:w-auto flex items-center justify-center text-sm sm:text-base py-3"
              >
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                ลงทะเบียนรับประกัน
              </Link>
              
              <Link 
                href={`/${tenant}/my-warranties`}
                className="btn-outline w-full sm:w-auto flex items-center justify-center text-sm sm:text-base py-3"
              >
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                ตรวจสอบประกัน
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* How it Works - Mobile Optimized */}
      <section className="px-4 py-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-lg sm:text-xl font-bold text-secondary-900 mb-6 text-center">
            ขั้นตอนง่ายๆ แค่ 3 ขั้นตอน
          </h3>
          
          <div className="space-y-4 sm:grid sm:grid-cols-3 sm:gap-6 sm:space-y-0">
            {[
              { step: '1', title: 'เข้าสู่ระบบด้วย LINE', desc: 'ใช้ LINE ที่มีอยู่แล้ว' },
              { step: '2', title: 'กรอกข้อมูลสินค้า', desc: 'เลือกสินค้าและวันที่ซื้อ' },
              { step: '3', title: 'รับใบรับประกัน', desc: 'เก็บไว้ในระบบ ไม่หาย' }
            ].map((item, index) => (
              <div key={index} className="flex items-start space-x-4 sm:flex-col sm:items-center sm:text-center sm:space-x-0">
                <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold">
                  {item.step}
                </div>
                <div className="flex-1 sm:mt-3">
                  <h4 className="font-semibold text-secondary-900 text-sm sm:text-base">{item.title}</h4>
                  <p className="text-xs sm:text-sm text-secondary-600 mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Company Info - Mobile Cards */}
      <section className="px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-lg sm:text-xl font-bold text-secondary-900 mb-6 text-center">
            ข้อมูลติดต่อ
          </h3>
          
          <div className="space-y-4 sm:grid sm:grid-cols-2 sm:gap-6 sm:space-y-0">
            {/* Address Card */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-secondary-900 text-sm mb-1">ที่อยู่</h4>
                  <p className="text-xs sm:text-sm text-secondary-600 leading-relaxed">
                    {company.address}<br />
                    {company.district} {company.amphoe}<br />
                    {company.province} {company.postcode}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Contact Card */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-primary-500 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-secondary-900 text-sm">โทรศัพท์</h4>
                    <a href={`tel:${company.phone}`} className="text-xs sm:text-sm text-primary-600">
                      {company.phone}
                    </a>
                  </div>
                </div>
                
                {company.website && (
                  <div className="flex items-center space-x-3">
                    <Globe className="w-5 h-5 text-primary-500 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-secondary-900 text-sm">เว็บไซต์</h4>
                      <a 
                        href={company.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs sm:text-sm text-primary-600 break-all"
                      >
                        {company.website.replace(/https?:\/\//, '')}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Minimal for Mobile */}
      <footer className="bg-secondary-900 text-white py-6 mt-8">
        <div className="px-4 text-center">
          <p className="text-xs sm:text-sm text-secondary-300">
            © 2024 {company.name}
          </p>
          <p className="text-xs text-secondary-400 mt-1">
            Powered by AooWarranty
          </p>
        </div>
      </footer>
    </div>
  )
}