/**
 * SelectGroup - Componente de Select com label e validação
 */

import { forwardRef } from 'react'
import { AlertCircle, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const SelectGroup = forwardRef(({
  label,
  name,
  options = [],
  value,
  onChange,
  onBlur,
  error,
  required,
  disabled,
  className,
  colSpan = 'col-span-12 md:col-span-4',
  placeholder = 'Selecione...',
  hint,
  ...props
}, ref) => {
  // Normaliza options para sempre ser array de objetos
  const normalizedOptions = options.map(opt => 
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  )

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
        <select
          ref={ref}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          required={required}
          className={cn(
            'w-full appearance-none rounded-xl border bg-white px-4 py-2.5 pr-10 text-sm text-slate-900 shadow-sm transition-all cursor-pointer',
            'focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-500/20',
            'disabled:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-500',
            error
              ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-100'
              : 'border-slate-200 hover:border-slate-300',
            !value && 'text-slate-400',
            className
          )}
          {...props}
        >
          <option value="">{placeholder}</option>
          {normalizedOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
          <ChevronDown size={18} />
        </div>
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

SelectGroup.displayName = 'SelectGroup'

export default SelectGroup
