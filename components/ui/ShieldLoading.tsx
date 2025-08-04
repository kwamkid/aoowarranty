'use client'

import { Shield } from 'lucide-react'

interface ShieldLoadingProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  text?: string
  fullScreen?: boolean
  variant?: 'spin' | 'pulse' | 'bounce' | 'flip' | 'shake'
}

export default function ShieldLoading({ 
  size = 'md', 
  text = 'กำลังโหลด...', 
  fullScreen = false,
  variant = 'spin'
}: ShieldLoadingProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  }
  
  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  }
  
  // Animation variants
  const animationClasses = {
    spin: 'animate-spin-slow',
    pulse: 'animate-pulse-scale',
    bounce: 'animate-bounce-smooth',
    flip: 'animate-flip-3d',
    shake: 'animate-shake'
  }
  
  const content = (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative">
        {/* Glow effect behind shield */}
        <div className="absolute inset-0 blur-xl bg-primary-400 opacity-30 animate-pulse rounded-full" />
        
        {/* Main Shield with animation */}
        <Shield 
          className={`${sizeClasses[size]} text-primary-500 relative z-10 ${animationClasses[variant]}`}
          strokeWidth={1.5}
        />
        
        {/* Optional: Scanning line effect */}
        {variant === 'spin' && (
          <div className="absolute inset-0 overflow-hidden rounded-full">
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-primary-300/30 to-transparent animate-scan" />
          </div>
        )}
      </div>
      
      {text && (
        <p className={`${textSizeClasses[size]} text-secondary-600 font-medium`}>
          {text}
        </p>
      )}
    </div>
  )
  
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-50">
        {content}
      </div>
    )
  }
  
  return content
}

// CSS animations (add to globals.css)
export const shieldLoadingStyles = `
/* Slow spin animation */
@keyframes spin-slow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin-slow {
  animation: spin-slow 3s linear infinite;
}

/* Pulse with scale animation */
@keyframes pulse-scale {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

.animate-pulse-scale {
  animation: pulse-scale 2s ease-in-out infinite;
}

/* Smooth bounce animation */
@keyframes bounce-smooth {
  0%, 100% {
    transform: translateY(0) scale(1);
  }
  25% {
    transform: translateY(-10px) scale(0.95);
  }
  50% {
    transform: translateY(0) scale(1.05);
  }
  75% {
    transform: translateY(-5px) scale(1);
  }
}

.animate-bounce-smooth {
  animation: bounce-smooth 2s ease-in-out infinite;
}

/* 3D flip animation */
@keyframes flip-3d {
  0% {
    transform: perspective(400px) rotateY(0);
  }
  50% {
    transform: perspective(400px) rotateY(180deg);
  }
  100% {
    transform: perspective(400px) rotateY(360deg);
  }
}

.animate-flip-3d {
  animation: flip-3d 3s ease-in-out infinite;
}

/* Shake animation */
@keyframes shake {
  0%, 100% {
    transform: translateX(0) rotate(0deg);
  }
  10% {
    transform: translateX(-2px) rotate(-5deg);
  }
  20% {
    transform: translateX(2px) rotate(5deg);
  }
  30% {
    transform: translateX(-2px) rotate(-5deg);
  }
  40% {
    transform: translateX(2px) rotate(5deg);
  }
  50% {
    transform: translateX(0) rotate(0deg);
  }
}

.animate-shake {
  animation: shake 2s ease-in-out infinite;
}

/* Scanning line effect */
@keyframes scan {
  0% {
    transform: translateY(-100%);
  }
  100% {
    transform: translateY(100%);
  }
}

.animate-scan {
  animation: scan 2s linear infinite;
}
`