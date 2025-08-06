// lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, addYears, addMonths, addDays, isBefore, isAfter } from 'date-fns'
import { differenceInDays, differenceInMonths, differenceInYears } from 'date-fns'


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date utilities
export function formatDate(date: Date | string | any, formatStr: string = 'dd/MM/yyyy'): string {
  try {
    let dateObj: Date
    
    // Handle Firestore Timestamp
    if (date && typeof date === 'object' && 'toDate' in date && typeof date.toDate === 'function') {
      dateObj = date.toDate()
    }
    // Handle Firestore Timestamp-like object (from server)
    else if (date && typeof date === 'object' && '_seconds' in date) {
      dateObj = new Date(date._seconds * 1000)
    }
    // Handle string date
    else if (typeof date === 'string') {
      dateObj = new Date(date)
    }
    // Handle Date object
    else if (date instanceof Date) {
      dateObj = date
    }
    // Handle null/undefined
    else if (!date) {
      return '-'
    }
    // Default case
    else {
      dateObj = new Date(date)
    }
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date:', date)
      return '-'
    }
    
    return format(dateObj, formatStr)
  } catch (error) {
    console.error('Error formatting date:', date, error)
    return '-'
  }
}

export function calculateWarrantyExpiry(
  purchaseDate: string,
  warrantyYears: number,
  warrantyMonths: number = 0
): string {
  const startDate = new Date(purchaseDate)
  // เริ่มนับประกันจากวันพรุ่งนี้ของวันที่ซื้อ (เพิ่ม 1 วัน)
  const warrantyStartDate = addDays(startDate, 1)
  let expiryDate = warrantyStartDate
  
  if (warrantyYears > 0) {
    expiryDate = addYears(expiryDate, warrantyYears)
  }
  
  if (warrantyMonths > 0) {
    expiryDate = addMonths(expiryDate, warrantyMonths)
  }
  
  // ลบออก 1 วัน เพราะวันหมดอายุคือวันสุดท้ายที่ใช้ได้
  expiryDate = addDays(expiryDate, -1)
  
  return format(expiryDate, 'yyyy-MM-dd')
}

export function isWarrantyActive(expiryDate: string): boolean {
  const expiry = new Date(expiryDate)
  const today = new Date()
  return isAfter(expiry, today)
}

export function getDaysUntilExpiry(expiryDate: string): number {
  const expiry = new Date(expiryDate)
  const today = new Date()
  const diffTime = expiry.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export function getTimeUntilExpiry(expiryDate: string): string {
  const expiry = new Date(expiryDate)
  const today = new Date()
  
  // ถ้าหมดอายุแล้ว
  if (expiry < today) {
    return 'หมดอายุแล้ว'
  }
  
  // คำนวณความแตกต่าง
  const totalDays = differenceInDays(expiry, today)
  
  if (totalDays === 0) {
    return 'วันนี้'
  }
  
  // คำนวณปี เดือน วัน แบบถูกต้อง
  const years = differenceInYears(expiry, today)
  const monthsAfterYears = differenceInMonths(expiry, today) - (years * 12)
  
  // คำนวณวันที่เหลือหลังจากหักปีและเดือน
  let tempDate = new Date(today)
  tempDate.setFullYear(tempDate.getFullYear() + years)
  tempDate.setMonth(tempDate.getMonth() + monthsAfterYears)
  const days = differenceInDays(expiry, tempDate)
  
  const parts = []
  
  if (years > 0) {
    parts.push(`${years} ปี`)
  }
  
  if (monthsAfterYears > 0) {
    parts.push(`${monthsAfterYears} เดือน`)
  }
  
  if (days > 0 || parts.length === 0) {
    parts.push(`${days} วัน`)
  }
  
  return parts.join(' ')
}

// Slug utilities
export function createSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug) && slug.length >= 3 && slug.length <= 50
}

// File utilities
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function isValidImageFile(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp']
  const maxSize = 5 * 1024 * 1024 // 5MB
  
  return validTypes.includes(file.type) && file.size <= maxSize
}

// Form validation utilities
export function isValidThaiPhone(phone: string): boolean {
  const phoneRegex = /^(\+66|0)[0-9]{8,9}$/
  return phoneRegex.test(phone.replace(/[-\s]/g, ''))
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function formatThaiPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('66')) {
    return '+66-' + cleaned.substring(2, 4) + '-' + cleaned.substring(4, 7) + '-' + cleaned.substring(7)
  }
  if (cleaned.startsWith('0')) {
    return cleaned.substring(0, 3) + '-' + cleaned.substring(3, 6) + '-' + cleaned.substring(6)
  }
  return phone
}

// Text utilities
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

// URL utilities
export function getSubdomain(host: string): string | null {
  const parts = host.split('.')
  if (parts.length >= 3 && !parts[0].includes('www')) {
    return parts[0]
  }
  return null
}

export function buildSubdomainUrl(subdomain: string, path: string = ''): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const domain = baseUrl.replace(/https?:\/\//, '')
  return `${baseUrl.includes('https') ? 'https' : 'http'}://${subdomain}.${domain}${path}`
}

// Array utilities
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const groupKey = String(item[key])
    groups[groupKey] = groups[groupKey] || []
    groups[groupKey].push(item)
    return groups
  }, {} as Record<string, T[]>)
}

export function uniqueBy<T>(array: T[], key: keyof T): T[] {
  const seen = new Set()
  return array.filter(item => {
    const value = item[key]
    if (seen.has(value)) {
      return false
    }
    seen.add(value)
    return true
  })
}

// Error handling
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

// Local storage utilities (with error handling)
export function setLocalStorage(key: string, value: any): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(value))
    }
  } catch (error) {
    console.warn('Failed to save to localStorage:', error)
  }
}

export function getLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    if (typeof window !== 'undefined') {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    }
    return defaultValue
  } catch (error) {
    console.warn('Failed to read from localStorage:', error)
    return defaultValue
  }
}

// ID generation
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

// Password generation
export function generatePassword(length: number = 12): string {
  const upperCase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowerCase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*'
  
  const allChars = upperCase + lowerCase + numbers + symbols
  let password = ''
  
  // Ensure at least one character from each type
  password += upperCase[Math.floor(Math.random() * upperCase.length)]
  password += lowerCase[Math.floor(Math.random() * lowerCase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

// Random utilities
export function getRandomColor(): string {
  const colors = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
    '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
    '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
    '#ec4899', '#f43f5e'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

// Wait utility
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}