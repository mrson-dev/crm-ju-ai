/**
 * FormCard - Card wrapper para seções de formulário
 */

import { cn } from '@/lib/utils'

export default function FormCard({ 
  children, 
  className,
  variant = 'default',
  highlight = false 
}) {
  return (
    <div className={cn(
      'rounded-2xl border bg-white p-6 shadow-sm transition-all md:p-8',
      highlight && 'border-l-4 border-l-primary-500',
      variant === 'warning' && 'bg-warning-50/30 border-l-4 border-l-warning-500',
      variant === 'success' && 'bg-success-50/30 border-l-4 border-l-success-500',
      variant === 'default' && 'border-slate-200',
      className
    )}>
      {children}
    </div>
  )
}

// Componente para dividir seções dentro do card
export function FormDivider({ label }) {
  return (
    <div className="col-span-12 my-4">
      {label ? (
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-100" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {label}
          </span>
          <div className="h-px flex-1 bg-slate-100" />
        </div>
      ) : (
        <div className="h-px bg-slate-100" />
      )}
    </div>
  )
}

// Grid wrapper para campos do formulário
export function FormGrid({ children, className }) {
  return (
    <div className={cn('grid grid-cols-12 gap-x-6 gap-y-5', className)}>
      {children}
    </div>
  )
}
