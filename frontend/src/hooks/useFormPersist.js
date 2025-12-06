import { useEffect, useRef } from 'react'

/**
 * Hook para persistir dados de formulário no localStorage.
 * Previne perda de dados quando usuário recarrega a página.
 * 
 * @param {string} key - Chave única para armazenar no localStorage
 * @param {Object} watch - Função watch do react-hook-form
 * @param {Function} setValue - Função setValue do react-hook-form
 * @param {Object} options - Opções de configuração
 * @param {number} options.debounceMs - Delay para salvar (default: 500ms)
 * @param {string[]} options.exclude - Campos a excluir da persistência
 * @param {boolean} options.clearOnSubmit - Limpar após submit (default: true)
 * 
 * @example
 * const { register, watch, setValue, handleSubmit } = useForm()
 * const { clearPersistedData } = useFormPersist('client-form', watch, setValue)
 * 
 * const onSubmit = (data) => {
 *   // ... salvar dados
 *   clearPersistedData() // Limpa localStorage após sucesso
 * }
 */
export function useFormPersist(key, watch, setValue, options = {}) {
  const {
    debounceMs = 500,
    exclude = [],
    clearOnSubmit = true
  } = options

  const timeoutRef = useRef(null)
  const isRestoringRef = useRef(false)

  // Restaurar dados ao montar
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`form_${key}`)
      if (saved) {
        const data = JSON.parse(saved)
        isRestoringRef.current = true
        
        Object.entries(data).forEach(([field, value]) => {
          if (!exclude.includes(field)) {
            setValue(field, value)
          }
        })
        
        setTimeout(() => {
          isRestoringRef.current = false
        }, 100)
      }
    } catch (error) {
      console.error('Erro ao restaurar formulário:', error)
    }
  }, [key, setValue, exclude])

  // Salvar dados com debounce
  useEffect(() => {
    const subscription = watch((data) => {
      if (isRestoringRef.current) return

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        try {
          const dataToSave = { ...data }
          exclude.forEach(field => delete dataToSave[field])
          
          localStorage.setItem(`form_${key}`, JSON.stringify(dataToSave))
        } catch (error) {
          console.error('Erro ao salvar formulário:', error)
        }
      }, debounceMs)
    })

    return () => {
      subscription.unsubscribe()
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [watch, key, debounceMs, exclude])

  const clearPersistedData = () => {
    try {
      localStorage.removeItem(`form_${key}`)
    } catch (error) {
      console.error('Erro ao limpar formulário:', error)
    }
  }

  const hasPersistedData = () => {
    try {
      return localStorage.getItem(`form_${key}`) !== null
    } catch {
      return false
    }
  }

  return {
    clearPersistedData,
    hasPersistedData
  }
}
