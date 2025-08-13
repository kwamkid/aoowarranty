// app/tenant/CustomerHomePage.tsx
'use client'

import Link from 'next/link'
import { Shield, FileText, Phone, MapPin, Globe, ArrowRight, CheckCircle, MessageCircle } from 'lucide-react'
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
      <section className="px-4 py-16 sm:py-16 md:py-20">
        <div className="max-w-2xl mx-auto text-center">
          {/* Welcome Badge */}
          <div className="inline-flex items-center bg-primary-100 text-primary-700 text-xs sm:text-sm font-medium px-3 py-1.5 rounded-full mb-4">
            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            ลงทะเบียนง่าย ผ่าน LINE
          </div>
          
          <h2 className="text-5xl font-bold text-secondary-900 mb-3 sm:mb-4 leading-none">
            ลงทะเบียนรับประกัน
            <br />
            <span className="text-primary-500">สินค้าออนไลน์</span>
          </h2>
          
          <p className="text-sm sm:text-base text-secondary-600 mb-6 sm:mb-8 px-4">
            ไม่ต้องกังวลใบรับประกันหาย 
            <br className="sm:hidden" />
            เช็คสถานะได้ทุกเมื่อ
          </p>
          
          {/* CTA Section */}
          {isLoggedIn ? (
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
          ) : (
            <div className="px-4 sm:px-0">
              {/* LINE Login Button - Prominent Display */}
              <a 
                href={`/api/auth/line/login?tenant=${tenant}`}
                className="inline-flex items-center justify-center w-full sm:w-auto 
                         bg-[#06C755] hover:bg-[#05B04D] text-white font-semibold 
                         px-8 py-4 rounded-lg shadow-lg hover:shadow-xl 
                         transform transition-all duration-200 hover:scale-105"
              >
                <img 
                  src="/line-icon.png" 
                  alt="LINE"
                  className="w-6 h-6 mr-3"
                />
                <span className="text-base sm:text-lg">เข้าสู่ระบบด้วย LINE</span>
              </a>
              
              {/* Benefits - Simple inline */}
              <div className="flex items-center justify-center text-xs sm:text-sm text-secondary-600 mt-6 flex-wrap gap-2">
                <div className="flex items-center">
                  <Shield className="w-4 h-4 text-green-500 mr-1" />
                  <span>ไม่ต้องจำรหัสผ่าน</span>
                </div>
                <span className="text-secondary-400 hidden sm:inline">·</span>
                <div className="flex items-center">
                  <ArrowRight className="w-4 h-4 text-blue-500 mr-1" />
                  <span>ใช้งานได้ทันที</span>
                </div>
                <span className="text-secondary-400 hidden sm:inline">·</span>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-purple-500 mr-1" />
                  <span>ปลอดภัย 100%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* How it Works - Modern Design */}
      <section className="px-4 py-12 bg-gradient-to-b from-white to-secondary-50">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-xl sm:text-2xl font-bold text-secondary-900 mb-2 text-center">
            ขั้นตอนง่ายๆ แค่ 3 ขั้นตอน
          </h3>
          <p className="text-sm text-secondary-600 text-center mb-8">
            ลงทะเบียนรับประกันได้ในไม่กี่นาที
          </p>
          
          <div className="relative">
            {/* Connection Line - Desktop Only */}
            <div className="hidden sm:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-200 via-primary-300 to-primary-200 -translate-y-1/2 z-0"></div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 relative z-10">
              {/* Step 1 */}
              <div className="bg-gradient-to-br from-[#06C755] to-[#05A04A] rounded-2xl p-6 shadow-soft hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur text-white rounded-full flex items-center justify-center mb-4 shadow-lg">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <div className="inline-flex items-center bg-white/20 backdrop-blur px-3 py-1 rounded-full mb-3">
                    <span className="text-xs font-semibold text-white">ขั้นตอนที่ 1</span>
                  </div>
                  <h4 className="font-bold text-white text-base sm:text-lg mb-2">
                    เข้าสู่ระบบด้วย LINE
                  </h4>
                  <p className="text-sm text-white/90">
                    ใช้ LINE ที่มีอยู่แล้ว
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-6 shadow-soft hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur text-white rounded-full flex items-center justify-center mb-4 shadow-lg">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="inline-flex items-center bg-white/20 backdrop-blur px-3 py-1 rounded-full mb-3">
                    <span className="text-xs font-semibold text-white">ขั้นตอนที่ 2</span>
                  </div>
                  <h4 className="font-bold text-white text-base sm:text-lg mb-2">
                    กรอกข้อมูลสินค้า
                  </h4>
                  <p className="text-sm text-white/90">
                    เลือกสินค้าและวันที่ซื้อ
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 shadow-soft hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur text-white rounded-full flex items-center justify-center mb-4 shadow-lg">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div className="inline-flex items-center bg-white/20 backdrop-blur px-3 py-1 rounded-full mb-3">
                    <span className="text-xs font-semibold text-white">ขั้นตอนที่ 3</span>
                  </div>
                  <h4 className="font-bold text-white text-base sm:text-lg mb-2">
                    ข้อมูลลงทะเบียนออนไลน์
                  </h4>
                  <p className="text-sm text-white/90">
                    เก็บไว้ในระบบ ไม่ต้องกลัวทำใบหาย
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Company Info - Modern Cards */}
      <section className="px-4 py-12 bg-gradient-to-b from-secondary-50 to-white">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-xl sm:text-2xl font-bold text-secondary-900 mb-2 text-center">
            ข้อมูลติดต่อ
          </h3>
          <p className="text-sm text-secondary-600 text-center mb-8">
            พร้อมให้บริการและดูแลคุณ
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Address Card */}
            <div className="group bg-white rounded-2xl shadow-soft hover:shadow-lg transition-all duration-300 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-100 to-transparent rounded-full -mr-16 -mt-16 opacity-50"></div>
              <div className="relative">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <MapPin className="w-6 h-6 text-primary-600" />
                </div>
                <h4 className="font-bold text-secondary-900 text-lg mb-3">ที่อยู่</h4>
                <p className="text-sm text-secondary-600 leading-relaxed">
                  {company.address}<br />
                  {company.district} {company.amphoe}<br />
                  {company.province} {company.postcode}
                </p>
              </div>
            </div>
            
            {/* Contact Card */}
            <div className="group bg-white rounded-2xl shadow-soft hover:shadow-lg transition-all duration-300 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-100 to-transparent rounded-full -mr-16 -mt-16 opacity-50"></div>
              <div className="relative space-y-4">
                <div>
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Phone className="w-6 h-6 text-primary-600" />
                  </div>
                  <h4 className="font-bold text-secondary-900 text-lg mb-2">ติดต่อเรา</h4>
                  <a 
                    href={`tel:${company.phone}`} 
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium inline-flex items-center"
                  >
                    <Phone className="w-4 h-4 mr-1" />
                    {company.phone}
                  </a>
                </div>
                
                {company.website && (
                  <div>
                    <a 
                      href={company.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium inline-flex items-center"
                    >
                      <Globe className="w-4 h-4 mr-1" />
                      {company.website.replace(/https?:\/\//, '')}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Modern Design */}
      <footer className="bg-gradient-to-r from-secondary-900 to-secondary-800 text-white py-8 mt-12">
        <div className="px-4 text-center">
          <p className="text-sm sm:text-base text-white mb-3">
            © 2024 {company.name}
          </p>
          <div className="flex items-center justify-center space-x-2 text-xs sm:text-sm text-secondary-400">
            <span>Powered by</span>
            <a 
              href="https://aoowarranty.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
            >
              AooWarranty
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}