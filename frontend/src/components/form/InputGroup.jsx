/**
 * InputGroup - Componente de Input com label e validação
 */

import { forwardRef } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const InputGroup = forwardRef(({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  required,
  disabled,
  loading,
  className,
  colSpan = 'col-span-12 md:col-span-4',
  maxLength,
  hint,
  icon: Icon,
  ...props
}, ref) => {
  return (
    <div className={colSpan}>
      {label && (
        <label 
          htmlFor={name}
          className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-700"
        >
          {label} {required && <span className="text-danger-500">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <Icon size={18} />
          </div>
        )}
        <input
          ref={ref}
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled || loading}
          maxLength={maxLength}
          required={required}
          className={cn(
            'w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-all',
            'placeholder:text-slate-400',
            'focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-500/20',
            'disabled:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-500',
            error
              ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-100'
              : 'border-slate-200 hover:border-slate-300',
            Icon && 'pl-10',
            loading && 'pr-10',
            className
          )}
          {...props}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-primary-500" />
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-danger-500 animate-in slide-in-from-top-1">
          <AlertCircle className="h-3 w-3" /> {error}
        </p>
      )}
      {hint && !error && (
        <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      )}
    </div>
  )
})

InputGroup.displayName = 'InputGroup'

export default InputGroup
