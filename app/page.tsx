'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Shield, 
  Smartphone, 
  Users, 
  BarChart3, 
  CheckCircle, 
  ArrowRight,
  Star,
  Building2,
  Zap,
  Globe,
  X,
  LogIn,
  Loader2,
  Gift
} from 'lucide-react'

export default function LandingPage() {
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const features = [
    {
      icon: Shield,
      title: 'ระบบรับประกันดิจิทัล',
      description: 'ลูกค้าลงทะเบียนผ่าน LINE ไม่ต้องกังวลใบรับประกันหาย'
    },
    {
      icon: Smartphone,
      title: 'LINE Login Integration',
      description: 'เข้าใช้งานง่าย ไม่ต้องจำรหัสผ่าน ใช้ LINE ที่มีอยู่แล้ว'
    },
    {
      icon: Users,
      title: 'จัดการลูกค้าอัตโนมัติ',
      description: 'ระบบเก็บข้อมูลลูกค้าและประวัติการซื้อทั้งหมด'
    },
    {
      icon: BarChart3,
      title: 'รายงานและสถิติ',
      description: 'ดูข้อมูลการขาย วิเคราะห์ลูกค้า Export รายงานได้'
    },
    {
      icon: Globe,
      title: 'เว็บไซต์เป็นของคุณ',
      description: 'ได้ subdomain เป็นของตัวเอง ใส่โลโก้และสีแบรนด์ได้'
    },
    {
      icon: Zap,
      title: 'ใช้งานทันที',
      description: 'สมัครวันนี้ ใช้งานได้เลย ไม่ต้องติดตั้งโปรแกรม'
    }
  ]

  const testimonials = [
    {
      name: 'คุณสมชาย ใจดี',
      company: 'ABC Mobile Shop',
      message: 'ลูกค้าชอบมาก ไม่ต้องเก็บใบเสร็จแล้ว ระบบง่ายมาก',
      rating: 5
    },
    {
      name: 'คุณมาลี สวยงาม',
      company: 'Beauty Center',
      message: 'ช่วยลดงานเอกสารได้เยอะ ลูกค้าลงทะเบียนเองได้',
      rating: 5
    },
    {
      name: 'คุณวิชาญ เทคโนโลยี',
      company: 'IT Solutions',
      message: 'Export ข้อมูลได้ เอาไปทำรายงานขายง่ายมาก',
      rating: 5
    }
  ]

  // Handle direct login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Call direct login API
      const response = await fetch('/api/auth/direct-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include' // Important for cookies
      })

      const result = await response.json()

      if (result.success) {
        // Close modal
        setShowLoginModal(false)
        
        // Show success message (optional)
        console.log('Login successful:', result.user.name)
        
        // Redirect to company admin panel
        window.location.href = result.redirectUrl
      } else {
        setError(result.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-secondary-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Image
                src="/logo.svg"
                alt="AooWarranty"
                width={40}
                height={40}
                className="h-10 w-auto"
              />
              <span className="text-xl font-bold text-secondary-900">AooWarranty</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-6">
              <a href="#features" className="text-secondary-600 hover:text-secondary-900">
                คุณสมบัติ
              </a>
              <a href="#testimonials" className="text-secondary-600 hover:text-secondary-900">
                รีวิว
              </a>
              <button 
                onClick={() => setShowLoginModal(true)}
                className="btn-outline flex items-center"
              >
                <LogIn className="w-4 h-4 mr-2" />
                เข้าสู่ระบบ
              </button>
              <Link href="/register" className="btn-primary">
                สมัครใช้งาน
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-accent-100 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              {/* Free Forever Badge */}
              <div className="inline-flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-full mb-6">
                <Gift className="w-5 h-5 mr-2" />
                <span className="font-semibold">ใช้ฟรีตลอดชีพ ไม่มีค่าใช้จ่าย</span>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-secondary-900 mb-6">
                ระบบลงทะเบียน<br />
                <span className="text-primary-500">รับประกันสินค้า</span><br />
                ที่ทันสมัยที่สุด
              </h1>
              
              <p className="text-lg text-secondary-600 mb-8">
                ให้ลูกค้าลงทะเบียนผ่าน LINE ไม่ต้องกังวลใบรับประกันหาย 
                จัดการข้อมูลลูกค้าและสินค้าอัตโนมัติ พร้อมรายงานครบครัน
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4">
                <Link href="/register" className="btn-primary inline-flex items-center">
                  เริ่มใช้งานฟรี
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
                <button 
                  onClick={() => setShowLoginModal(true)}
                  className="btn-outline flex items-center"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  เข้าสู่ระบบ
                </button>
              </div>
              
              <div className="flex items-center space-x-6 mt-8 text-sm text-secondary-600">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>ฟรีตลอดชีพ</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>ไม่ต้องติดตั้งโปรแกรม</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>รองรับภาษาไทย</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-semibold text-secondary-900">ABC Mobile Shop</span>
                </div>
                
                <h3 className="text-xl font-bold text-secondary-900 mb-4">
                  ลงทะเบียนรับประกันสินค้า
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-secondary-50 rounded-lg">
                    <Smartphone className="w-5 h-5 text-primary-500" />
                    <span className="text-secondary-700">Samsung Galaxy S24</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-secondary-50 rounded-lg">
                      <p className="text-xs text-secondary-500">วันที่ซื้อ</p>
                      <p className="font-semibold text-secondary-900">15/08/2024</p>
                    </div>
                    <div className="p-3 bg-secondary-50 rounded-lg">
                      <p className="text-xs text-secondary-500">หมดประกัน</p>
                      <p className="font-semibold text-secondary-900">15/08/2026</p>
                    </div>
                  </div>
                  
                  <button className="btn-primary w-full">
                    ลงทะเบียนด้วย LINE
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
              ทำไมต้องเลือก AooWarranty?
            </h2>
            <p className="text-lg text-secondary-600 max-w-2xl mx-auto">
              ระบบครบครันที่ช่วยให้ธุรกิจของคุณดูแลลูกค้าได้ดีขึ้น
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card hover:shadow-lg transition-shadow duration-300">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-secondary-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-secondary-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-secondary-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
              ลูกค้าพูดถึงเรา
            </h2>
            <p className="text-lg text-secondary-600">
              ร้านค้าและธุรกิจมากมายเลือกใช้ AooWarranty
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="card">
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                
                <p className="text-secondary-700 mb-6 italic">
                  "{testimonial.message}"
                </p>
                
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-secondary-900">{testimonial.name}</p>
                    <p className="text-sm text-secondary-600">{testimonial.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            พร้อมเริ่มต้นใช้งานแล้วหรือยัง?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            สมัครวันนี้ ใช้งานฟรีตลอดชีพ ไม่มีค่าใช้จ่ายแอบแฝง
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link href="/register" className="bg-white text-primary-600 hover:bg-accent-50 px-8 py-4 rounded-lg font-semibold text-lg flex items-center justify-center space-x-2">
              <span>เริ่มใช้งานฟรี</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/contact" className="border-2 border-white text-white hover:bg-white hover:text-primary-600 px-8 py-4 rounded-lg font-semibold text-lg">
              ติดต่อสอบถาม
            </Link>
          </div>
        </div>
      </section>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-secondary-900">
                เข้าสู่ระบบ Admin
              </h3>
              <button
                onClick={() => {
                  setShowLoginModal(false)
                  setEmail('')
                  setPassword('')
                  setError('')
                }}
                className="p-2 hover:bg-secondary-100 rounded-lg"
              >
                <X className="w-5 h-5 text-secondary-600" />
              </button>
            </div>
            
            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  อีเมล
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="admin@company.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  รหัสผ่าน
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500" 
                  />
                  <span className="ml-2 text-sm text-secondary-700">จดจำฉัน</span>
                </label>
                
                <a href="#" className="text-sm text-primary-600 hover:text-primary-700">
                  ลืมรหัสผ่าน?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    กำลังเข้าสู่ระบบ...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5 mr-2" />
                    เข้าสู่ระบบ
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-secondary-200 text-center">
              <p className="text-sm text-secondary-600">
                ยังไม่มีบัญชี?{' '}
                <Link 
                  href="/register" 
                  className="text-primary-600 hover:text-primary-700 font-medium"
                  onClick={() => setShowLoginModal(false)}
                >
                  สมัครใช้งานฟรี
                </Link>
              </p>
            </div>

            {/* Additional Info */}
            <div className="mt-6 text-center">
              <p className="text-xs text-secondary-500">
                สำหรับผู้ดูแลระบบเท่านั้น
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-secondary-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <Image
                  src="/logo.svg"
                  alt="AooWarranty"
                  width={32}
                  height={32}
                  className="h-8 w-auto"
                />
                <span className="text-lg font-bold">AooWarranty</span>
              </div>
              <p className="text-secondary-300">
                ระบบลงทะเบียนรับประกันสินค้าที่ทันสมัยและใช้งานง่าย
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">ผลิตภัณฑ์</h4>
              <ul className="space-y-2 text-secondary-300">
                <li><a href="#" className="hover:text-white">คุณสมบัติ</a></li>
                <li><a href="#" className="hover:text-white">API</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">สนับสนุน</h4>
              <ul className="space-y-2 text-secondary-300">
                <li><a href="#" className="hover:text-white">คู่มือการใช้งาน</a></li>
                <li><a href="#" className="hover:text-white">ติดต่อสนับสนุน</a></li>
                <li><a href="#" className="hover:text-white">สถานะระบบ</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">บริษัท</h4>
              <ul className="space-y-2 text-secondary-300">
                <li><a href="#" className="hover:text-white">เกี่ยวกับเรา</a></li>
                <li><a href="#" className="hover:text-white">ติดต่อเรา</a></li>
                <li><a href="#" className="hover:text-white">นโยบายความเป็นส่วนตัว</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-secondary-700 mt-8 pt-8 text-center text-secondary-400">
            <p>&copy; 2024 AooWarranty. สงวนลิขสิทธิ์.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}