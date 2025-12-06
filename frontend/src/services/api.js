import axios from 'axios'
import { API_URL } from '@/config/constants'
import { auth } from '@/config/firebase'

// Validação de configuração
if (!API_URL) {
  throw new Error('API_URL não configurada. Verifique o arquivo .env')
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

// Logger condicional (apenas em desenvolvimento)
const isDev = import.meta.env.DEV
const logError = (context, error) => {
  if (isDev) {
    console.error(`[API] ${context}:`, error)
  }
}

// Interceptor para adicionar token
api.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser
    if (user) {
      try {
        const token = await user.getIdToken()
        config.headers.Authorization = `Bearer ${token}`
      } catch (error) {
        logError('Erro ao obter token', error)
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Erro de rede/timeout
    if (!error.response) {
      const customError = new Error('Erro de conexão. Verifique sua internet.')
      customError.code = 'NETWORK_ERROR'
      return Promise.reject(customError)
    }

    // Erro de autenticação - token expirado
    if (error.response.status === 401) {
      // Força refresh do token na próxima requisição
      const customError = new Error('Sessão expirada. Faça login novamente.')
      customError.code = 'AUTH_EXPIRED'
      return Promise.reject(customError)
    }

    // Erro de permissão
    if (error.response.status === 403) {
      const customError = new Error('Você não tem permissão para esta ação.')
      customError.code = 'FORBIDDEN'
      return Promise.reject(customError)
    }

    // Erro de validação
    if (error.response.status === 422) {
      const detail = error.response.data?.detail
      let message = 'Dados inválidos.'
      
      if (Array.isArray(detail)) {
        message = detail.map(d => d.msg).join('. ')
      } else if (typeof detail === 'string') {
        message = detail
      }
      
      const customError = new Error(message)
      customError.code = 'VALIDATION_ERROR'
      return Promise.reject(customError)
    }

    // Erro não encontrado
    if (error.response.status === 404) {
      const customError = new Error('Recurso não encontrado.')
      customError.code = 'NOT_FOUND'
      return Promise.reject(customError)
    }

    // Erro do servidor
    if (error.response.status >= 500) {
      const customError = new Error('Erro no servidor. Tente novamente mais tarde.')
      customError.code = 'SERVER_ERROR'
      return Promise.reject(customError)
    }

    // Outros erros
    const message = error.response.data?.detail || error.message || 'Erro desconhecido'
    return Promise.reject(new Error(message))
  }
)

export default api
