'use client'

import { FC } from 'react'
import Link from 'next/link'

interface LogoProps {
  className?: string;
  variant?: 'full' | 'short';
  href?: string;
}

const Logo: FC<LogoProps> = ({ className = "", variant = 'full', href = "/" }) => {
  const LogoContent = () => {
    if (variant === 'short') {
      return (
        <div className={`font-semibold font-inter text-2xl select-none ${className}`}>
          <span className="bg-gradient-to-r from-teal-400 to-teal-500 text-transparent bg-clip-text tracking-tight">p</span>
          <span className="text-slate-800 dark:text-white tracking-tight">A</span>
          <span className="bg-gradient-to-r from-teal-500 to-teal-600 text-transparent bg-clip-text tracking-tight">w</span>
        </div>
      )
    }
    
    return (
      <div className={`font-semibold font-inter text-2xl select-none ${className}`}>
        <span className="bg-gradient-to-r from-teal-400 to-teal-500 text-transparent bg-clip-text tracking-tight">pick</span>
        <span className="text-slate-800 dark:text-white tracking-tight">A</span>
        <span className="bg-gradient-to-r from-teal-500 to-teal-600 text-transparent bg-clip-text tracking-tight">winner</span>
      </div>
    )
  }

  return (
    <Link href={href} className="cursor-pointer">
      <LogoContent />
    </Link>
  )
}

// For direct imports
export default Logo