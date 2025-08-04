'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail,
  MapPin,
  Package,
  Calendar,
  FileText,
  Download,
  Eye,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Printer,
  Hash
} from 'lucide-react'
import { formatDate, getDaysUntilExpiry, getTimeUntilExpiry } from '@/lib/utils'

interface WarrantyDetailPageProps {
  warranty: any
  tenant: string
}

export default function WarrantyDetailClientPage({ warranty, tenant }: WarrantyDetailPageProps) {
  const [showReceipt, setShowReceipt] = useState(false)
  
  // Get status info
  const getStatusInfo = () => {
    const daysLeft = getDaysUntilExpiry(warranty.warrantyExpiry)
    
    if (warranty.status === 'claimed') {
      return {
        icon: AlertCircle,
        color: 'purple',
        text: 'เคลมแล้ว',
        description: 'สินค้านี้ได้ทำการเคลมประกันแล้ว'
      }
    } else if (warranty.status === 'expired') {
      return {
        icon: XCircle,
        color: 'red',
        text: 'หมดอายุ',
        description: `หมดอายุเมื่อ ${formatDate(warranty.warrantyExpiry, 'dd/MM/yyyy')}`
      }
    } else if (daysLeft <= 30) {
      return {
        icon: AlertCircle,
        color: 'orange',
        text: 'ใกล้หมดอายุ',
        description: `เหลือเวลาอีก ${daysLeft} วัน`
      }
    } else {
      return {
        icon: CheckCircle,
        color: 'green',
        text: 'ใช้งานได้',
        description: `เหลือเวลาอีก ${getTimeUntilExpiry(warranty.warrantyExpiry)}`
      }
    }
  }
  
  const statusInfo = getStatusInfo()
  const StatusIcon = statusInfo.icon
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <Link 
          href={`/${tenant}/admin/registrations`}
          className="inline-flex items-center text-sm text-secondary-600 hover:text-secondary-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          กลับ
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">รายละเอียดการลงทะเบียน</h1>
            <p className="text-sm text-secondary-600 mt-1">
              ลงทะเบียนเมื่อ {formatDate(warranty.registrationDate, 'dd/MM/yyyy HH:mm')} น.
            </p>
          </div>
          
          <button className="btn-primary flex items-center">
            <Printer className="w-5 h-5 mr-2" />
            พิมพ์ใบรับประกัน
          </button>
        </div>
      </div>
      
      {/* Status Card */}
      <div className={`card border-2 border-${statusInfo.color}-200 bg-${statusInfo.color}-50 mb-6`}>
        <div className="flex items-center space-x-4">
          <div className={`w-16 h-16 rounded-full bg-${statusInfo.color}-100 flex items-center justify-center`}>
            <StatusIcon className={`w-8 h-8 text-${statusInfo.color}-600`} />
          </div>
          <div className="flex-1">
            <h3 className={`text-xl font-bold text-${statusInfo.color}-900`}>
              สถานะ: {statusInfo.text}
            </h3>
            <p className={`text-${statusInfo.color}-700 mt-1`}>
              {statusInfo.description}
            </p>
          </div>
        </div>
      </div>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Info */}
        <div className="card">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center">
            <User className="w-5 h-5 mr-2 text-primary-500" />
            ข้อมูลลูกค้า
          </h2>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm text-secondary-600">ชื่อ-นามสกุล</p>
              <p className="font-medium text-secondary-900">{warranty.customerInfo.name}</p>
              <p className="text-xs text-secondary-500 mt-1">
                LINE: {warranty.customerInfo.lineDisplayName}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-secondary-600 flex items-center">
                <Phone className="w-4 h-4 mr-1" />
                เบอร์โทรศัพท์
              </p>
              <p className="font-medium text-secondary-900">{warranty.customerInfo.phone}</p>
            </div>
            
            {warranty.customerInfo.email && (
              <div>
                <p className="text-sm text-secondary-600 flex items-center">
                  <Mail className="w-4 h-4 mr-1" />
                  อีเมล
                </p>
                <p className="font-medium text-secondary-900">{warranty.customerInfo.email}</p>
              </div>
            )}
            
            <div>
              <p className="text-sm text-secondary-600 flex items-center mb-1">
                <MapPin className="w-4 h-4 mr-1" />
                ที่อยู่
              </p>
              <p className="text-secondary-700 text-sm">
                {warranty.customerInfo.address}<br />
                {warranty.customerInfo.district} {warranty.customerInfo.amphoe}<br />
                {warranty.customerInfo.province} {warranty.customerInfo.postcode}
              </p>
            </div>
          </div>
        </div>
        
        {/* Product Info */}
        <div className="card">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center">
            <Package className="w-5 h-5 mr-2 text-primary-500" />
            ข้อมูลสินค้า
          </h2>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm text-secondary-600">แบรนด์</p>
              <p className="font-medium text-secondary-900">{warranty.productInfo.brandName}</p>
            </div>
            
            <div>
              <p className="text-sm text-secondary-600">ชื่อสินค้า</p>
              <p className="font-medium text-secondary-900">{warranty.productInfo.productName}</p>
              {warranty.productInfo.model && (
                <p className="text-xs text-secondary-500 mt-1">รุ่น: {warranty.productInfo.model}</p>
              )}
            </div>
            
            {warranty.productInfo.serialNumber && (
              <div>
                <p className="text-sm text-secondary-600 flex items-center">
                  <Hash className="w-4 h-4 mr-1" />
                  Serial Number
                </p>
                <p className="font-medium text-secondary-900 font-mono">
                  {warranty.productInfo.serialNumber}
                </p>
              </div>
            )}
            
            {warranty.productInfo.purchaseLocation && (
              <div>
                <p className="text-sm text-secondary-600">สถานที่ซื้อ</p>
                <p className="font-medium text-secondary-900">{warranty.productInfo.purchaseLocation}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Warranty Info */}
        <div className="card">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-primary-500" />
            ข้อมูลการรับประกัน
          </h2>
          
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-secondary-600 flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  วันที่ซื้อ
                </p>
                <p className="font-medium text-secondary-900">
                  {formatDate(warranty.purchaseDate, 'dd/MM/yyyy')}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-secondary-600 flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  เริ่มรับประกัน
                </p>
                <p className="font-medium text-secondary-900">
                  {formatDate(warranty.warrantyStartDate, 'dd/MM/yyyy')}
                </p>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-secondary-600">วันหมดประกัน</p>
              <p className="font-medium text-secondary-900">
                {formatDate(warranty.warrantyExpiry, 'dd/MM/yyyy')}
              </p>
              {warranty.status === 'active' && (
                <p className="text-xs text-secondary-500 mt-1">
                  เหลือเวลาอีก {getTimeUntilExpiry(warranty.warrantyExpiry)}
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Documents */}
        <div className="card">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-primary-500" />
            เอกสารแนบ
          </h2>
          
          {warranty.receiptImage ? (
            <div className="space-y-3">
              <div className="relative aspect-video bg-secondary-100 rounded-lg overflow-hidden">
                {showReceipt ? (
                  <img
                    src={warranty.receiptImage}
                    alt="Receipt"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <button
                      onClick={() => setShowReceipt(true)}
                      className="btn-outline flex items-center"
                    >
                      <Eye className="w-5 h-5 mr-2" />
                      ดูใบเสร็จ
                    </button>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-2">
                <a
                  href={warranty.receiptImage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline flex-1 flex items-center justify-center"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  ดูขนาดเต็ม
                </a>
                <a
                  href={warranty.receiptImage}
                  download
                  className="btn-outline flex-1 flex items-center justify-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  ดาวน์โหลด
                </a>
              </div>
            </div>
          ) : (
            <p className="text-sm text-secondary-500">ไม่มีเอกสารแนบ</p>
          )}
        </div>
      </div>
      
      {/* Notes */}
      {warranty.notes && (
        <div className="card mt-6">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4">หมายเหตุ</h2>
          <p className="text-secondary-700 whitespace-pre-wrap">{warranty.notes}</p>
        </div>
      )}
      
      {/* Registration Info */}
      <div className="mt-6 text-center text-sm text-secondary-500">
        <p>
          ลงทะเบียนผ่าน LINE โดย {warranty.customerInfo.lineDisplayName}
        </p>
        <p>
          เมื่อ {formatDate(warranty.registrationDate, 'dd/MM/yyyy HH:mm:ss')} น.
        </p>
      </div>
    </div>
  )
}