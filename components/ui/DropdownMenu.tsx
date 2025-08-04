'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface DropdownMenuItem {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  className?: string
  disabled?: boolean
}

interface DropdownMenuProps {
  trigger: React.ReactNode
  items: DropdownMenuItem[]
  align?: 'left' | 'right'
}

export default function DropdownMenu({ trigger, items, align = 'right' }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Calculate position when menu opens
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft
      
      setPosition({
        top: rect.bottom + scrollTop + 8, // 8px gap
        left: align === 'right' 
          ? rect.right + scrollLeft - 192 // 192px = w-48
          : rect.left + scrollLeft
      })
    }
  }, [isOpen, align])

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close on scroll
  useEffect(() => {
    const handleScroll = () => setIsOpen(false)
    
    if (isOpen) {
      window.addEventListener('scroll', handleScroll, true)
      return () => window.removeEventListener('scroll', handleScroll, true)
    }
  }, [isOpen])

  const menuContent = isOpen && (
    <div
      ref={menuRef}
      className="fixed w-48 bg-white border border-secondary-200 rounded-lg shadow-xl py-1"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 9999
      }}
    >
      {items.map((item, index) => (
        <button
          key={index}
          onClick={() => {
            if (!item.disabled) {
              item.onClick()
              setIsOpen(false)
            }
          }}
          disabled={item.disabled}
          className={`w-full flex items-center px-4 py-2 text-sm transition-colors ${
            item.disabled 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:bg-secondary-50'
          } ${item.className || 'text-secondary-700'}`}
        >
          {item.icon && <span className="mr-2">{item.icon}</span>}
          {item.label}
        </button>
      ))}
    </div>
  )

  return (
    <>
      <div ref={triggerRef} onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>
      {typeof document !== 'undefined' && createPortal(menuContent, document.body)}
    </>
  )
}