/**
 * Hook para busca de CEP via ViaCEP
 */

import { useState, useCallback } from 'react'

export function useCepLookup() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const lookup = useCallback(async (cep) => {
    const cleanCep = cep.replace(/\D/g, '')
    
    if (cleanCep.length !== 8) {
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
      const data = await response.json()

      if (data.erro) {
        setError('CEP não encontrado')
        return null
      }

      return {
        logradouro: data.logradouro || '',
        bairro: data.bairro || '',
        cidade: data.localidade || '',
        estado: data.uf || '',
        complemento: data.complemento || '',
      }
    } catch (err) {
      setError('Erro ao buscar CEP')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setError(null)
  }, [])

  return {
    lookup,
    loading,
    error,
    reset
  }
}

export default useCepLookup
