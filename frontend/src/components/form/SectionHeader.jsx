/**
 * SectionHeader - Cabeçalho de seção para formulários
 */

import { cn } from '@/lib/utils'

export default function SectionHeader({ 
  icon: Icon, 
  title, 
  subtitle,
  variant = 'default',
  className 
}) {
  const variants = {
    default: 'from-primary-500 to-primary-600',
    success: 'from-success-500 to-success-600',
    warning: 'from-warning-500 to-warning-600',
    danger: 'from-danger-500 to-danger-600',
    violet: 'from-violet-500 to-violet-600',
  }

  return (
    <div className={cn(
      'mb-6 flex items-start gap-3 border-b border-slate-100 pb-4',
      className
    )}>
      {Icon && (
        <div className={cn(
          'flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm',
          variants[variant]
        )}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      )}
      <div>
        <h3 className="text-base font-bold leading-tight tracking-tight text-slate-900">
          {title}
        </h3>
        {subtitle && (
          <p className="mt-0.5 text-xs font-medium text-slate-500">{subtitle}</p>
        )}
      </div>
    </div>
  )
}
