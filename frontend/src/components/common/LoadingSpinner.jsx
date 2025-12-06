/**
 * Componentes de Loading Modernos
 * Design sofisticado com animações suaves
 */

import React from 'react'
import { Scale } from 'lucide-react'

/**
 * Spinner de Loading Principal
 */
export default function LoadingSpinner({
  size = 'md',
  text,
  fullScreen = false,
  className = '',
}) {
  const sizes = {
    sm: 'h-5 w-5',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  }

  const spinner = (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      <div className="relative">
        {/* Outer ring */}
        <div className={`${sizes[size]} rounded-full border-2 border-slate-200`} />
        {/* Spinning arc */}
        <div 
          className={`absolute inset-0 ${sizes[size]} rounded-full border-2 border-transparent border-t-primary-600 animate-spin`}
        />
      </div>
      {text && (
        <p className="text-sm font-medium text-slate-600 animate-pulse">{text}</p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/30 animate-bounce-soft">
            <Scale size={28} className="text-white" />
          </div>
          <div className="flex items-center gap-1">
            {[0, 1, 2].map((i) => (
              <div 
                key={i}
                className="w-2 h-2 rounded-full bg-primary-500 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
          {text && (
            <p className="text-sm font-medium text-slate-600">{text}</p>
          )}
        </div>
      </div>
    )
  }

  return spinner
}

/**
 * Loading para Tabelas
 */
export function TableLoading({ columns = 5, rows = 5 }) {
  return (
    <div className="overflow-hidden">
      {/* Header Skeleton */}
      <div className="flex gap-4 px-6 py-4 bg-slate-50 border-b border-slate-200">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <div
            key={colIndex}
            className="h-3 skeleton rounded"
            style={{ 
              width: colIndex === 0 ? '180px' : `${60 + Math.random() * 60}px`,
              animationDelay: `${colIndex * 0.1}s` 
            }}
          />
        ))}
      </div>
      {/* Rows Skeleton */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div 
          key={rowIndex} 
          className="flex gap-4 px-6 py-4 border-b border-slate-100"
          style={{ animationDelay: `${rowIndex * 0.05}s` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={colIndex}
              className="h-4 skeleton rounded"
              style={{ 
                width: colIndex === 0 ? '180px' : `${80 + Math.random() * 80}px`,
                animationDelay: `${(rowIndex + colIndex) * 0.05}s` 
              }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

/**
 * Loading para Cards
 */
export function CardLoading({ count = 1 }) {
  if (count === 1) {
    return (
      <div className="card p-6 animate-pulse">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 skeleton rounded-xl" />
          <div className="w-16 h-5 skeleton rounded-full" />
        </div>
        <div className="h-8 w-20 skeleton rounded mb-2" />
        <div className="h-4 w-32 skeleton rounded mb-4" />
        <div className="pt-4 border-t border-slate-100">
          <div className="h-3 w-24 skeleton rounded" />
        </div>
      </div>
    )
  }

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div 
          key={index} 
          className="card p-6"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 skeleton rounded-xl" />
            <div className="w-16 h-5 skeleton rounded-full" />
          </div>
          <div className="h-8 w-20 skeleton rounded mb-2" />
          <div className="h-4 w-32 skeleton rounded mb-4" />
          <div className="pt-4 border-t border-slate-100">
            <div className="h-3 w-24 skeleton rounded" />
          </div>
        </div>
      ))}
    </>
  )
}

/**
 * Loading para Listas
 */
export function ListLoading({ items = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, index) => (
        <div 
          key={index} 
          className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-100"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="w-10 h-10 skeleton rounded-xl" />
          <div className="flex-1">
            <div className="h-4 w-40 skeleton rounded mb-2" />
            <div className="h-3 w-24 skeleton rounded" />
          </div>
          <div className="w-20 h-6 skeleton rounded-full" />
        </div>
      ))}
    </div>
  )
}

/**
 * Loading Inline (para botões, etc)
 */
export function InlineLoading({ size = 'sm' }) {
  const sizes = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
  }

  return (
    <svg
      className={`animate-spin ${sizes[size]} text-current`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

/**
 * Page Loading (para transições de página)
 */
export function PageLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
            <Scale size={28} className="text-primary-600" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center">
            <div className="w-3 h-3 rounded-full border-2 border-primary-600 border-t-transparent animate-spin" />
          </div>
        </div>
        <p className="text-sm text-slate-500 font-medium">Carregando...</p>
      </div>
    </div>
  )
}
