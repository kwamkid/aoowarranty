'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CheckCircle, XCircle, Loader2, Database, Plus } from 'lucide-react'

// ไฟล์ชั่วคราวสำหรับทดสอบก่อนที่จะ setup Firebase
export default function FirebaseTestPage() {
  const [connectionStatus, setConnectionStatus] = useState<'loading' | 'connected' | 'error'>('loading')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    // ทดสอบการเชื่อมต่อพื้นฐาน
    setTimeout(() => {
      try {
        // เช็คว่ามี environment variables หรือไม่
        const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
        
        if (!apiKey || !projectId) {
          setConnectionStatus('error')
          setError('Missing Firebase environment variables')
        } else {
          setConnectionStatus('connected')
        }
      } catch (err: any) {
        setConnectionStatus('error')
        setError(err.message)
      }
    }, 1000)
  }, [])

  return (
    <div className="min-h-screen bg-secondary-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900">🔥 Firebase Connection Test</h1>
          <p className="text-secondary-600 mt-2">ทดสอบการเชื่อมต่อ Firebase และ Environment Variables</p>
        </div>

        {/* Connection Status */}
        <div className="card mb-8">
          <div className="flex items-center space-x-4">
            {connectionStatus === 'loading' && (
              <>
                <Loader2 className="w-8 h-8 text-secondary-500 animate-spin" />
                <div>
                  <h3 className="text-lg font-semibold text-secondary-900">กำลังตรวจสอบ...</h3>
                  <p className="text-secondary-600">กำลังเช็ค Environment Variables</p>
                </div>
              </>
            )}

            {connectionStatus === 'connected' && (
              <>
                <CheckCircle className="w-8 h-8 text-green-500" />
                <div>
                  <h3 className="text-lg font-semibold text-green-700">Environment Variables พร้อมใช้งาน! ✅</h3>
                  <p className="text-green-600">Firebase config ถูกต้อง</p>
                </div>
              </>
            )}

            {connectionStatus === 'error' && (
              <>
                <XCircle className="w-8 h-8 text-red-500" />
                <div>
                  <h3 className="text-lg font-semibold text-red-700">Environment Variables ไม่ครบ ❌</h3>
                  <p className="text-red-600">{error}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Configuration Info */}
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">ข้อมูล Configuration</h3>
          
          <div className="space-y-4">
            <div className="bg-secondary-100 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Environment Variables:</h4>
              <div className="space-y-2 text-sm font-mono">
                <div className="flex items-center space-x-2">
                  {process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span>NEXT_PUBLIC_FIREBASE_API_KEY: {process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✓ Set' : '✗ Missing'}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span>NEXT_PUBLIC_FIREBASE_PROJECT_ID: {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '✗ Missing'}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  {process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span>NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: {process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? '✓ Set' : '✗ Missing'}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  {process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span>NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: {process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? '✓ Set' : '✗ Missing'}</span>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">📋 Next Steps:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-700">
                <li>สร้าง Firebase project ใน Firebase Console</li>
                <li>ดาวน์โหลด config และใส่ใน .env.local</li>
                <li>สร้าง Firestore database</li>
                <li>กลับมาทดสอบหน้านี้อีกครั้ง</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex space-x-4 mt-8">
          <Link href="/" className="btn-outline">
            ← กลับหน้าแรก
          </Link>
          <Link href="/admin" className="btn-outline">
            ไปหน้า Admin →
          </Link>
        </div>
      </div>
    </div>
  )
}