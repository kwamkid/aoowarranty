'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react'

interface AlertDialogProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  message: string
  type?: 'error' | 'warning' | 'info' | 'success'
}

export default function AlertDialog({
  isOpen,
  onClose,
  title,
  message,
  type = 'info'
}: AlertDialogProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      return () => document.removeEventListener('keydown', handleEsc)
    }
  }, [isOpen, onClose])

  if (!mounted || !isOpen) return null

  const config = {
    error: {
      icon: <XCircle className="w-6 h-6" />,
      iconColor: 'text-red-600',
      iconBg: 'bg-red-100',
      title: title || 'เกิดข้อผิดพลาด'
    },
    warning: {
      icon: <AlertTriangle className="w-6 h-6" />,
      iconColor: 'text-yellow-600',
      iconBg: 'bg-yellow-100',
      title: title || 'คำเตือน'
    },
    info: {
      icon: <Info className="w-6 h-6" />,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
      title: title || 'ข้อมูล'
    },
    success: {
      icon: <CheckCircle className="w-6 h-6" />,
      iconColor: 'text-green-600',
      iconBg: 'bg-green-100',
      title: title || 'สำเร็จ'
    }
  }

  const currentConfig = config[type]

  const content = (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fade-in"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="bg-white rounded-2xl shadow-2xl max-w-sm w-full animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Content */}
          <div className="p-6">
            <div className="flex items-start space-x-4">
              <div className={`p-2 rounded-full ${currentConfig.iconBg} flex-shrink-0`}>
                <div className={currentConfig.iconColor}>
                  {currentConfig.icon}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-secondary-900 mb-1">
                  {currentConfig.title}
                </h3>
                <p className="text-secondary-600 whitespace-pre-line">
                  {message}
                </p>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="px-6 pb-6">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              ตกลง
            </button>
          </div>
        </div>
      </div>
    </>
  )

  return typeof document !== 'undefined' ? createPortal(content, document.body) : null
}