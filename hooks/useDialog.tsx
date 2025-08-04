// hooks/useDialog.tsx
'use client'

import { useState } from 'react'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import AlertDialog from '@/components/ui/AlertDialog'

interface ConfirmOptions {
  title: string
  message: string
  type?: 'warning' | 'danger' | 'info' | 'success'
  confirmText?: string
  cancelText?: string
}

interface AlertOptions {
  title?: string
  message: string
  type?: 'error' | 'warning' | 'info' | 'success'
}

export function useDialog() {
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    options: {} as ConfirmOptions,
    onConfirm: () => {},
    loading: false
  })
  
  const [alertState, setAlertState] = useState({
    isOpen: false,
    options: {} as AlertOptions
  })

  // Confirm Dialog
  const confirm = (options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        options,
        onConfirm: () => resolve(true),
        loading: false
      })
    })
  }

  const closeConfirm = () => {
    setConfirmState(prev => ({ ...prev, isOpen: false }))
  }

  const setConfirmLoading = (loading: boolean) => {
    setConfirmState(prev => ({ ...prev, loading }))
  }

  // Alert Dialog
  const alert = (options: AlertOptions | string) => {
    const alertOptions = typeof options === 'string' 
      ? { message: options, type: 'info' as const }
      : options
      
    setAlertState({
      isOpen: true,
      options: alertOptions
    })
  }

  const success = (message: string, title?: string) => {
    alert({ message, title, type: 'success' })
  }

  const error = (message: string, title?: string) => {
    alert({ message, title, type: 'error' })
  }

  const warning = (message: string, title?: string) => {
    alert({ message, title, type: 'warning' })
  }

  const info = (message: string, title?: string) => {
    alert({ message, title, type: 'info' })
  }

  const closeAlert = () => {
    setAlertState({ isOpen: false, options: {} as AlertOptions })
  }

  // Dialog Components
  const DialogComponents = (
    <>
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        onClose={closeConfirm}
        onConfirm={() => {
          confirmState.onConfirm()
          if (!confirmState.loading) {
            closeConfirm()
          }
        }}
        title={confirmState.options.title || ''}
        message={confirmState.options.message || ''}
        type={confirmState.options.type}
        confirmText={confirmState.options.confirmText}
        cancelText={confirmState.options.cancelText}
        loading={confirmState.loading}
      />
      
      <AlertDialog
        isOpen={alertState.isOpen}
        onClose={closeAlert}
        title={alertState.options.title}
        message={alertState.options.message || ''}
        type={alertState.options.type}
      />
    </>
  )

  return {
    confirm,
    alert,
    success,
    error,
    warning,
    info,
    setConfirmLoading,
    DialogComponents
  }
}