/**
 * Utilitários de Performance
 * Helpers para otimização de renderização e memoização
 */

import { useMemo, useCallback, useState, useEffect, useRef } from 'react'

/**
 * Hook para debounce de valores
 * Evita re-renderizações excessivas em inputs de busca
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value)
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  
  return debouncedValue
}

/**
 * Hook para throttle de funções
 * Limita a frequência de execução de uma função
 */
export function useThrottle(callback, delay = 300) {
  const lastRun = useRef(Date.now())
  
  return useCallback((...args) => {
    const now = Date.now()
    if (now - lastRun.current >= delay) {
      lastRun.current = now
      callback(...args)
    }
  }, [callback, delay])
}

/**
 * Hook para lazy loading de imagens
 * Carrega imagens apenas quando visíveis no viewport
 */
export function useLazyImage(src) {
  const [imageSrc, setImageSrc] = useState(null)
  const imgRef = useRef()
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setImageSrc(src)
          observer.disconnect()
        }
      },
      { threshold: 0.01 }
    )
    
    if (imgRef.current) {
      observer.observe(imgRef.current)
    }
    
    return () => observer.disconnect()
  }, [src])
  
  return [imageSrc, imgRef]
}

/**
 * Memoização profunda de objetos
 * Evita re-criação de objetos em cada render
 */
export function useDeepMemo(factory, deps) {
  const ref = useRef()
  const signalRef = useRef(0)
  
  const currentDeps = useMemo(() => deps, deps)
  
  if (!ref.current || !areEqual(ref.current.deps, currentDeps)) {
    ref.current = {
      value: factory(),
      deps: currentDeps
    }
    signalRef.current += 1
  }
  
  return ref.current.value
}

function areEqual(a, b) {
  if (a === b) return true
  if (!a || !b) return false
  if (a.length !== b.length) return false
  
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false
  }
  
  return true
}

/**
 * Marca uma função como estável para React.memo
 */
export function useStableCallback(callback) {
  const callbackRef = useRef(callback)
  
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])
  
  return useCallback((...args) => callbackRef.current(...args), [])
}

/**
 * Implementação customizada de Intersection Observer
 * Para lazy loading de componentes
 */
export function useInView(options = {}) {
  const [isInView, setIsInView] = useState(false)
  const ref = useRef()
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.1, ...options }
    )
    
    if (ref.current) {
      observer.observe(ref.current)
    }
    
    return () => observer.disconnect()
  }, [options])
  
  return [ref, isInView]
}

/**
 * Prefetch de dados para melhorar navegação
 */
export function prefetchData(queryClient, queryKey, queryFn) {
  return queryClient.prefetchQuery({
    queryKey,
    queryFn,
    staleTime: 60000, // 1 minuto
  })
}

/**
 * Batch de atualizações para melhor performance
 */
export function useBatchedUpdates() {
  const updates = useRef([])
  const timeoutRef = useRef()
  
  const addUpdate = useCallback((updateFn) => {
    updates.current.push(updateFn)
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      updates.current.forEach(fn => fn())
      updates.current = []
    }, 16) // ~60fps
  }, [])
  
  return addUpdate
}

/**
 * Medidor de performance de componentes (apenas dev)
 */
export function measurePerformance(componentName, callback) {
  if (process.env.NODE_ENV === 'development') {
    const start = performance.now()
    const result = callback()
    const end = performance.now()
    
    if (end - start > 16) { // Mais de 1 frame (60fps)
      console.warn(`⚠️ ${componentName} levou ${(end - start).toFixed(2)}ms para renderizar`)
    }
    
    return result
  }
  
  return callback()
}

/**
 * Cache local otimizado para dados estáticos
 */
class LocalCache {
  constructor(maxSize = 50) {
    this.cache = new Map()
    this.maxSize = maxSize
  }
  
  get(key) {
    return this.cache.get(key)
  }
  
  set(key, value) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    this.cache.set(key, value)
  }
  
  has(key) {
    return this.cache.has(key)
  }
  
  clear() {
    this.cache.clear()
  }
}

export const localCache = new LocalCache()

// Exportar todos os hooks
export default {
  useDebounce,
  useThrottle,
  useLazyImage,
  useDeepMemo,
  useStableCallback,
  useInView,
  prefetchData,
  useBatchedUpdates,
  measurePerformance,
  localCache
}
