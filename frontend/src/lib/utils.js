/**
 * Utilitários gerais
 */

import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combina classes CSS com suporte a condicionais e merge de Tailwind
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Formata valor para moeda brasileira
 */
export function formatCurrency(value) {
  const number = typeof value === 'number' ? value : parseFloat(value) || 0
  return number.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  })
}

/**
 * Formata data para exibição (DD/MM/YYYY)
 */
export function formatDate(dateString) {
  if (!dateString) return ''
  
  // Se já está no formato DD/MM/YYYY
  if (dateString.includes('/')) return dateString
  
  // Se está no formato ISO
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString
  
  return date.toLocaleDateString('pt-BR')
}

/**
 * Formata data para API (YYYY-MM-DD)
 */
export function formatDateToAPI(dateString) {
  if (!dateString) return null
  
  // Se está no formato DD/MM/YYYY
  if (dateString.includes('/')) {
    const parts = dateString.split('/')
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`
    }
  }
  
  return dateString
}

/**
 * Gera ID único
 */
export function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

/**
 * Debounce function
 */
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Remove acentos de string
 */
export function removeAccents(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/**
 * Capitaliza primeira letra de cada palavra
 */
export function capitalize(str) {
  if (!str) return ''
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Trunca texto com ellipsis
 */
export function truncate(str, length = 50) {
  if (!str || str.length <= length) return str
  return str.slice(0, length) + '...'
}

/**
 * Valida CPF
 */
export function isValidCPF(cpf) {
  const cleanCPF = cpf.replace(/\D/g, '')
  
  if (cleanCPF.length !== 11) return false
  if (/^(\d)\1+$/.test(cleanCPF)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i)
  }
  let remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false

  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleanCPF.charAt(10))) return false

  return true
}

/**
 * Valida CNPJ
 */
export function isValidCNPJ(cnpj) {
  const cleanCNPJ = cnpj.replace(/\D/g, '')
  
  if (cleanCNPJ.length !== 14) return false
  if (/^(\d)\1+$/.test(cleanCNPJ)) return false

  let size = cleanCNPJ.length - 2
  let numbers = cleanCNPJ.substring(0, size)
  const digits = cleanCNPJ.substring(size)
  let sum = 0
  let pos = size - 7

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--
    if (pos < 2) pos = 9
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== parseInt(digits.charAt(0))) return false

  size = size + 1
  numbers = cleanCNPJ.substring(0, size)
  sum = 0
  pos = size - 7

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--
    if (pos < 2) pos = 9
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== parseInt(digits.charAt(1))) return false

  return true
}

/**
 * Valida CPF ou CNPJ
 */
export function isValidCPFCNPJ(value) {
  const clean = value.replace(/\D/g, '')
  if (clean.length === 11) return isValidCPF(value)
  if (clean.length === 14) return isValidCNPJ(value)
  return false
}
