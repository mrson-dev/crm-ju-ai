import { useState, useEffect } from 'react'

/**
 * Hook para debounce de valores.
 * Útil para otimizar buscas e evitar requisições excessivas.
 * 
 * @param {any} value - Valor a ser debounced
 * @param {number} delay - Delay em milissegundos (default: 500)
 * @returns {any} Valor debounced
 * 
 * @example
 * const [searchQuery, setSearchQuery] = useState('')
 * const debouncedSearch = useDebounce(searchQuery, 500)
 * 
 * useEffect(() => {
 *   if (debouncedSearch) {
 *     fetchResults(debouncedSearch)
 *   }
 * }, [debouncedSearch])
 */
export function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
