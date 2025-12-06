/**
 * MaskedInput - Input com máscara automática
 */

import { forwardRef, useCallback } from 'react'
import InputGroup from './InputGroup'

// Funções de máscara
const masks = {
  cpf: (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1')
  },
  cnpj: (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1')
  },
  cpfCnpj: (value) => {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 11) {
      return masks.cpf(value)
    }
    return masks.cnpj(value)
  },
  cep: (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{3})\d+?$/, '$1')
  },
  phone: (value) => {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 10) {
      return digits
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .replace(/(-\d{4})\d+?$/, '$1')
    }
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1')
  },
  date: (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1/$2')
      .replace(/(\d{2})(\d)/, '$1/$2')
      .replace(/(\d{4})\d+?$/, '$1')
  },
  pis: (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{5})(\d)/, '$1.$2')
      .replace(/(\d{2})(\d{1})/, '$1-$2')
      .replace(/(-\d{1})\d+?$/, '$1')
  },
  ctps: (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{7})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1')
  },
  currency: (value) => {
    const digits = value.replace(/\D/g, '')
    const number = parseFloat(digits) / 100
    return number.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  },
  number: (value) => {
    return value.replace(/\D/g, '')
  }
}

const MaskedInput = forwardRef(({
  mask,
  value,
  onChange,
  ...props
}, ref) => {
  const handleChange = useCallback((e) => {
    const rawValue = e.target.value
    const maskFn = masks[mask]
    
    if (maskFn) {
      const maskedValue = maskFn(rawValue)
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          name: e.target.name,
          value: maskedValue
        }
      }
      onChange?.(syntheticEvent)
    } else {
      onChange?.(e)
    }
  }, [mask, onChange])

  // Define maxLength baseado na máscara
  const getMaxLength = () => {
    switch (mask) {
      case 'cpf': return 14
      case 'cnpj': return 18
      case 'cpfCnpj': return 18
      case 'cep': return 9
      case 'phone': return 15
      case 'date': return 10
      case 'pis': return 14
      case 'ctps': return 12
      default: return undefined
    }
  }

  return (
    <InputGroup
      ref={ref}
      value={value}
      onChange={handleChange}
      maxLength={getMaxLength()}
      {...props}
    />
  )
})

MaskedInput.displayName = 'MaskedInput'

export default MaskedInput

// Export individual mask functions for external use
export { masks }
