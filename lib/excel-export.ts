// lib/excel-export.ts
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { formatDate } from './utils'

interface ExportWarrantyData {
  registrationDate: string
  customerName: string
  lineUserId: string
  lineDisplayName: string
  phone: string
  email: string
  address: string
  district: string
  amphoe: string
  province: string
  postcode: string
  brandName: string
  productName: string
  model: string
  serialNumber?: string
  purchaseLocation?: string
  purchaseDate: string
  warrantyExpiry: string
  status: string
  notes?: string
}

export function exportWarrantiesToExcel(
  warranties: any[],
  companyName: string,
  fileName?: string
) {
  // แปลงข้อมูลเป็นรูปแบบที่เหมาะสมสำหรับ Excel
  const data: ExportWarrantyData[] = warranties.map(warranty => ({
    registrationDate: formatDate(warranty.registrationDate, 'dd/MM/yyyy HH:mm'),
    customerName: warranty.customerInfo.name,
    lineUserId: warranty.customerId, // LINE User ID
    lineDisplayName: warranty.customerInfo.lineDisplayName,
    phone: warranty.customerInfo.phone,
    email: warranty.customerInfo.email || '-',
    address: warranty.customerInfo.address,
    district: warranty.customerInfo.district,
    amphoe: warranty.customerInfo.amphoe,
    province: warranty.customerInfo.province,
    postcode: warranty.customerInfo.postcode,
    brandName: warranty.productInfo.brandName,
    productName: warranty.productInfo.productName,
    model: warranty.productInfo.model || '-',
    serialNumber: warranty.productInfo.serialNumber || '-',
    purchaseLocation: warranty.productInfo.purchaseLocation || '-',
    purchaseDate: formatDate(warranty.purchaseDate, 'dd/MM/yyyy'),
    warrantyExpiry: formatDate(warranty.warrantyExpiry, 'dd/MM/yyyy'),
    status: getStatusText(warranty.status),
    notes: warranty.notes || '-'
  }))

  // กำหนดหัวตาราง (header) ภาษาไทย
  const headers = {
    registrationDate: 'วันที่ลงทะเบียน',
    customerName: 'ชื่อ-นามสกุล',
    lineUserId: 'LINE User ID',
    lineDisplayName: 'ชื่อ LINE',
    phone: 'เบอร์โทรศัพท์',
    email: 'อีเมล',
    address: 'ที่อยู่',
    district: 'แขวง/ตำบล',
    amphoe: 'เขต/อำเภอ',
    province: 'จังหวัด',
    postcode: 'รหัสไปรษณีย์',
    brandName: 'แบรนด์',
    productName: 'ชื่อสินค้า',
    model: 'รุ่น',
    serialNumber: 'Serial Number',
    purchaseLocation: 'สถานที่ซื้อ',
    purchaseDate: 'วันที่ซื้อ',
    warrantyExpiry: 'วันหมดประกัน',
    status: 'สถานะ',
    notes: 'หมายเหตุ'
  }

  // แปลงข้อมูลให้ใช้ header ภาษาไทย
  const excelData = data.map(item => {
    const row: any = {}
    Object.keys(headers).forEach(key => {
      row[headers[key as keyof typeof headers]] = item[key as keyof ExportWarrantyData]
    })
    return row
  })

  // สร้าง worksheet
  const ws = XLSX.utils.json_to_sheet(excelData)

  // ปรับความกว้างคอลัมน์
  const colWidths = [
    { wch: 18 }, // วันที่ลงทะเบียน
    { wch: 20 }, // ชื่อ-นามสกุล
    { wch: 25 }, // LINE User ID
    { wch: 15 }, // ชื่อ LINE
    { wch: 15 }, // เบอร์โทรศัพท์
    { wch: 25 }, // อีเมล
    { wch: 30 }, // ที่อยู่
    { wch: 15 }, // แขวง/ตำบล
    { wch: 15 }, // เขต/อำเภอ
    { wch: 15 }, // จังหวัด
    { wch: 12 }, // รหัสไปรษณีย์
    { wch: 15 }, // แบรนด์
    { wch: 25 }, // ชื่อสินค้า
    { wch: 15 }, // รุ่น
    { wch: 20 }, // Serial Number
    { wch: 20 }, // สถานที่ซื้อ
    { wch: 12 }, // วันที่ซื้อ
    { wch: 12 }, // วันหมดประกัน
    { wch: 12 }, // สถานะ
    { wch: 25 }  // หมายเหตุ
  ]
  ws['!cols'] = colWidths

  // สร้าง workbook
  const wb = XLSX.utils.book_new()
  
  // เพิ่ม worksheet พร้อมชื่อ
  XLSX.utils.book_append_sheet(wb, ws, 'ข้อมูลการลงทะเบียน')

  // สร้างชื่อไฟล์
  const date = new Date()
  const dateStr = formatDate(date, 'yyyyMMdd_HHmmss')
  const exportFileName = fileName || `${companyName}_warranties_${dateStr}.xlsx`

  // Export เป็นไฟล์
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([wbout], { type: 'application/octet-stream' })
  saveAs(blob, exportFileName)
}

// Helper function สำหรับแปลง status
function getStatusText(status: string): string {
  switch (status) {
    case 'active':
      return 'ใช้งานได้'
    case 'expired':
      return 'หมดอายุ'
    case 'claimed':
      return 'เคลมแล้ว'
    default:
      return status
  }
}

// Export ข้อมูลแบบกรองตามเงื่อนไข
export function exportFilteredWarranties(
  warranties: any[],
  companyName: string,
  filters?: {
    status?: string
    brandName?: string
    dateFrom?: string
    dateTo?: string
  }
) {
  let filteredData = warranties

  // กรองตาม status
  if (filters?.status && filters.status !== 'all') {
    filteredData = filteredData.filter(w => w.status === filters.status)
  }

  // กรองตามแบรนด์
  if (filters?.brandName && filters.brandName !== 'all') {
    filteredData = filteredData.filter(w => w.productInfo.brandName === filters.brandName)
  }

  // กรองตามช่วงวันที่
  if (filters?.dateFrom) {
    const fromDate = new Date(filters.dateFrom)
    filteredData = filteredData.filter(w => {
      const regDate = new Date(w.registrationDate)
      return regDate >= fromDate
    })
  }

  if (filters?.dateTo) {
    const toDate = new Date(filters.dateTo)
    toDate.setHours(23, 59, 59, 999) // สิ้นสุดวัน
    filteredData = filteredData.filter(w => {
      const regDate = new Date(w.registrationDate)
      return regDate <= toDate
    })
  }

  // สร้างชื่อไฟล์ที่บอกเงื่อนไขการกรอง
  const filterParts = []
  if (filters?.status && filters.status !== 'all') {
    filterParts.push(getStatusText(filters.status))
  }
  if (filters?.brandName && filters.brandName !== 'all') {
    filterParts.push(filters.brandName)
  }
  if (filters?.dateFrom || filters?.dateTo) {
    filterParts.push('filtered')
  }

  const filterSuffix = filterParts.length > 0 ? `_${filterParts.join('_')}` : ''
  const fileName = `${companyName}_warranties${filterSuffix}_${formatDate(new Date(), 'yyyyMMdd')}.xlsx`

  exportWarrantiesToExcel(filteredData, companyName, fileName)
}

// Export สรุปสถิติ
export function exportWarrantySummary(
  warranties: any[],
  companyName: string
) {
  // สร้างข้อมูลสรุป
  const summary = {
    totalRegistrations: warranties.length,
    activeWarranties: warranties.filter(w => w.status === 'active').length,
    expiredWarranties: warranties.filter(w => w.status === 'expired').length,
    claimedWarranties: warranties.filter(w => w.status === 'claimed').length,
  }

  // สรุปตามแบรนด์
  const brandSummary: Record<string, number> = {}
  warranties.forEach(w => {
    const brand = w.productInfo.brandName
    brandSummary[brand] = (brandSummary[brand] || 0) + 1
  })

  // สรุปตามสินค้า
  const productSummary: Record<string, number> = {}
  warranties.forEach(w => {
    const product = `${w.productInfo.brandName} - ${w.productInfo.productName}`
    productSummary[product] = (productSummary[product] || 0) + 1
  })

  // สร้าง worksheet สรุป
  const summaryData = [
    ['สรุปข้อมูลการลงทะเบียนประกัน', companyName],
    ['วันที่ออกรายงาน', formatDate(new Date(), 'dd/MM/yyyy HH:mm:ss')],
    [],
    ['สรุปภาพรวม'],
    ['จำนวนการลงทะเบียนทั้งหมด', summary.totalRegistrations],
    ['ประกันที่ยังใช้ได้', summary.activeWarranties],
    ['ประกันที่หมดอายุ', summary.expiredWarranties],
    ['ประกันที่เคลมแล้ว', summary.claimedWarranties],
    [],
    ['สรุปตามแบรนด์'],
    ...Object.entries(brandSummary).map(([brand, count]) => [brand, count]),
    [],
    ['สรุปตามสินค้า'],
    ...Object.entries(productSummary).map(([product, count]) => [product, count])
  ]

  const ws = XLSX.utils.aoa_to_sheet(summaryData)
  
  // จัดรูปแบบ
  ws['!cols'] = [{ wch: 40 }, { wch: 20 }]
  
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'สรุป')

  // เพิ่ม sheet รายละเอียดด้วย
  const detailWs = XLSX.utils.json_to_sheet(
    warranties.map(w => ({
      'วันที่ลงทะเบียน': formatDate(w.registrationDate, 'dd/MM/yyyy'),
      'ชื่อลูกค้า': w.customerInfo.name,
      'LINE User ID': w.customerId,
      'ชื่อ LINE': w.customerInfo.lineDisplayName,
      'แบรนด์': w.productInfo.brandName,
      'สินค้า': w.productInfo.productName,
      'สถานะ': getStatusText(w.status)
    }))
  )
  XLSX.utils.book_append_sheet(wb, detailWs, 'รายละเอียด')

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([wbout], { type: 'application/octet-stream' })
  saveAs(blob, `${companyName}_warranty_summary_${formatDate(new Date(), 'yyyyMMdd')}.xlsx`)
}