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
  const [openDirection, setOpenDirection] = useState<'down' | 'up'>('down')
  const triggerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Calculate position when menu opens or window resizes/scrolls
  useEffect(() => {
    const calculatePosition = () => {
      if (!isOpen || !triggerRef.current) return

      const rect = triggerRef.current.getBoundingClientRect()
      const menuHeight = 200 // Approximate menu height
      const windowHeight = window.innerHeight
      const spaceBelow = windowHeight - rect.bottom
      const spaceAbove = rect.top

      // Determine if menu should open upwards or downwards
      const shouldOpenUp = spaceBelow < menuHeight && spaceAbove > spaceBelow

      setOpenDirection(shouldOpenUp ? 'up' : 'down')

      // Use fixed positioning based on viewport
      setPosition({
        top: shouldOpenUp ? rect.top - menuHeight : rect.bottom + 4,
        left: align === 'right' 
          ? Math.min(rect.right - 192, window.innerWidth - 200) // Prevent overflow
          : Math.max(rect.left, 8) // Prevent negative position
      })
    }

    calculatePosition()

    // Recalculate on scroll and resize
    if (isOpen) {
      window.addEventListener('scroll', calculatePosition, true)
      window.addEventListener('resize', calculatePosition)
      return () => {
        window.removeEventListener('scroll', calculatePosition, true)
        window.removeEventListener('resize', calculatePosition)
      }
    }
  }, [isOpen, align])

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(event.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      return () => document.removeEventListener('keydown', handleEsc)
    }
  }, [isOpen])

  const menuContent = isOpen && mounted && (
    <div
      ref={menuRef}
      className={`
        fixed w-48 bg-white border border-secondary-200 rounded-lg shadow-xl py-1
        ${openDirection === 'up' ? 'animate-slide-up' : 'animate-slide-down'}
      `}
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
          className={`
            w-full flex items-center px-4 py-2 text-sm transition-colors text-left
            ${item.disabled 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:bg-secondary-50 cursor-pointer'
            } 
            ${item.className || 'text-secondary-700'}
          `}
        >
          {item.icon && <span className="mr-3 flex-shrink-0">{item.icon}</span>}
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  )

  return (
    <>
      <div 
        ref={triggerRef} 
        onClick={() => setIsOpen(!isOpen)}
        className="inline-block"
      >
        {trigger}
      </div>
      {mounted && createPortal(menuContent, document.body)}
    </>
  )
}

// Add these animations to your global CSS
export const dropdownAnimations = `
@keyframes slide-down {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-down {
  animation: slide-down 0.2s ease-out;
}

.animate-slide-up {
  animation: slide-up 0.2s ease-out;
}
`