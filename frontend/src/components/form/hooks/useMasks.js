/**
 * Hook para aplicação de máscaras em formulários
 */

import { useCallback } from 'react'
import { masks } from '../MaskedInput'

export function useMasks() {
  const applyMask = useCallback((value, maskType) => {
    const maskFn = masks[maskType]
    return maskFn ? maskFn(value) : value
  }, [])

  const removeMask = useCallback((value) => {
    return value ? value.replace(/\D/g, '') : ''
  }, [])

  const formatCurrency = useCallback((value) => {
    const number = typeof value === 'number' ? value : parseFloat(value) || 0
    return number.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }, [])

  const parseCurrency = useCallback((value) => {
    const digits = value.replace(/\D/g, '')
    return parseFloat(digits) / 100
  }, [])

  const formatDate = useCallback((dateString, format = 'display') => {
    if (!dateString) return ''

    // Se já está no formato DD/MM/YYYY
    if (dateString.includes('/')) {
      if (format === 'api') {
        const parts = dateString.split('/')
        return `${parts[2]}-${parts[1]}-${parts[0]}`
      }
      return dateString
    }

    // Se está no formato YYYY-MM-DD (API)
    if (dateString.includes('-')) {
      const parts = dateString.split('-')
      if (format === 'display') {
        return `${parts[2]}/${parts[1]}/${parts[0]}`
      }
      return dateString
    }

    return dateString
  }, [])

  return {
    applyMask,
    removeMask,
    formatCurrency,
    parseCurrency,
    formatDate,
    masks
  }
}

export default useMasks
