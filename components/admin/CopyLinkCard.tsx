'use client'

import { useState, useEffect } from 'react'
import { Link, Copy, ExternalLink, CheckCircle, QrCode, Download, MessageSquare } from 'lucide-react'
import QRCode from 'qrcode'

interface CopyLinkCardProps {
  companySlug: string
}

export default function CopyLinkCard({ companySlug }: CopyLinkCardProps) {
  const [copied, setCopied] = useState(false)
  const [customerUrl, setCustomerUrl] = useState('')
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('')
  const [mounted, setMounted] = useState(false)
  const [qrLoading, setQrLoading] = useState(true)
  
  // Build customer registration URL and generate QR after component mounts
  useEffect(() => {
    setMounted(true)
    
    const isDevelopment = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1'
    
    let url = ''
    if (isDevelopment) {
      url = `http://localhost:3000/${companySlug}`
    } else {
      const domain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'aoowarranty.com'
      url = `https://${companySlug}.${domain}`
    }
    
    setCustomerUrl(url)
    
    // Generate QR Code
    generateQRCode(url)
  }, [companySlug])
  
  const generateQRCode = async (url: string) => {
    try {
      setQrLoading(true)
      const dataUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#1f2937', // Secondary-800 color
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
      })
      setQrCodeDataUrl(dataUrl)
    } catch (error) {
      console.error('Error generating QR code:', error)
    } finally {
      setQrLoading(false)
    }
  }
  
  const copyToClipboard = async () => {
    if (!customerUrl) return
    
    try {
      await navigator.clipboard.writeText(customerUrl)
      setCopied(true)
      
      // Reset after 3 seconds
      setTimeout(() => {
        setCopied(false)
      }, 3000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }
  
  const openInNewTab = () => {
    if (customerUrl) {
      window.open(customerUrl, '_blank')
    }
  }
  
  const downloadQR = () => {
    if (!qrCodeDataUrl) return
    
    // Create a temporary link to download
    const link = document.createElement('a')
    link.href = qrCodeDataUrl
    link.download = `${companySlug}-qr-code.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  
  return (
    <div className="card bg-gradient-to-r from-primary-50 to-accent-50 border-primary-200">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Link Section */}
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <Link className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-primary-900">
              ลิงก์สำหรับลูกค้าลงทะเบียน
            </h2>
          </div>
          
          <p className="text-sm text-primary-700 mb-4">
            แชร์ลิงก์นี้ให้ลูกค้าเพื่อลงทะเบียนรับประกันสินค้า
          </p>
          
          {/* Link Copy Section */}
          <div className="flex items-center space-x-2 mb-4">
            <div className="flex-1 bg-white rounded-lg border border-primary-300 px-4 py-3">
              {mounted ? (
                <code className="text-sm text-secondary-700 break-all">
                  {customerUrl}
                </code>
              ) : (
                <span className="text-sm text-secondary-400">กำลังโหลด...</span>
              )}
            </div>
            
            <button
              onClick={copyToClipboard}
              disabled={!mounted}
              className={`p-3 rounded-lg transition-all ${
                copied 
                  ? 'bg-green-500 text-white' 
                  : 'bg-white border border-primary-300 text-primary-600 hover:bg-primary-50'
              } ${!mounted ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={copied ? 'คัดลอกแล้ว!' : 'คัดลอกลิงก์'}
            >
              {copied ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </button>
            
            <button
              onClick={openInNewTab}
              disabled={!mounted}
              className={`p-3 bg-white border border-primary-300 text-primary-600 hover:bg-primary-50 rounded-lg ${
                !mounted ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="เปิดในแท็บใหม่"
            >
              <ExternalLink className="w-5 h-5" />
            </button>
          </div>
          
          {/* How to Use */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-primary-900">วิธีใช้งาน:</h3>
            <ul className="space-y-2 text-sm text-primary-700">
              <li className="flex items-start">
                <span className="text-primary-500 mr-2">•</span>
                <span>ส่งลิงก์ให้ลูกค้าทาง SMS หรือ Email</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-500 mr-2">•</span>
                <span>พิมพ์ QR Code ติดที่ร้านหรือใส่ในใบเสร็จ</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-500 mr-2">•</span>
                <div>
                  <span className="flex items-center">
                    <MessageSquare className="w-4 h-4 mr-1 text-green-600" />
                    <strong>ใช้กับ LINE OA Rich Menu</strong>
                  </span>
                  <span className="text-xs text-primary-600 mt-1 block">
                    นำลิงก์นี้ไปใส่ใน Rich Menu ของ LINE Official Account ได้เลย
                  </span>
                </div>
              </li>
            </ul>
          </div>
          
          {/* Copy Success Message */}
          {copied && (
            <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg animate-fade-in">
              <p className="text-sm text-green-800 font-medium flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                คัดลอกลิงก์เรียบร้อยแล้ว!
              </p>
            </div>
          )}
        </div>
        
        {/* Right Column - QR Code Section */}
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <QrCode className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-primary-900">
              QR Code สำหรับสแกน
            </h3>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg border border-primary-200 p-6 text-center">
            {qrLoading ? (
              <div className="w-48 h-48 mx-auto flex items-center justify-center">
                <div className="animate-pulse">
                  <QrCode className="w-20 h-20 text-secondary-300" />
                </div>
              </div>
            ) : qrCodeDataUrl ? (
              <div className="space-y-4">
                <div className="relative group inline-block">
                  <img 
                    src={qrCodeDataUrl} 
                    alt="QR Code" 
                    className="w-48 h-48 mx-auto"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <button
                      onClick={downloadQR}
                      className="bg-white text-primary-600 px-4 py-2 rounded-lg flex items-center space-x-2 text-sm font-medium hover:bg-primary-50 transform transition-transform hover:scale-105"
                    >
                      <Download className="w-4 h-4" />
                      <span>ดาวน์โหลด</span>
                    </button>
                  </div>
                </div>
                
                <p className="text-sm text-secondary-600 font-medium">
                  {companySlug}.aoowarranty.com
                </p>
                
                <button
                  onClick={downloadQR}
                  className="btn-primary mx-auto flex items-center space-x-2 sm:hidden"
                >
                  <Download className="w-4 h-4" />
                  <span>ดาวน์โหลด QR Code</span>
                </button>
              </div>
            ) : (
              <div className="w-48 h-48 mx-auto flex items-center justify-center text-secondary-400">
                <span className="text-sm">ไม่สามารถสร้าง QR Code</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}