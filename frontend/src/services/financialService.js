/**
 * Serviço de Controle Financeiro
 * Gerencia honorários, despesas, faturas e relatórios
 */

import api from './api'
import logger from '../utils/logger'

// ==================== HELPER DE ERROS ====================

class FinancialError extends Error {
  constructor(message, code, originalError = null) {
    super(message)
    this.name = 'FinancialError'
    this.code = code
    this.originalError = originalError
  }
}

const handleError = (error, context) => {
  logger.error(context, error, { service: 'FinancialService' })
  
  if (error.response) {
    const status = error.response.status
    const message = error.response.data?.detail || error.response.data?.message
    
    switch (status) {
      case 400:
        throw new FinancialError(message || 'Dados inválidos', 'INVALID_DATA', error)
      case 401:
        throw new FinancialError('Sessão expirada. Faça login novamente.', 'UNAUTHORIZED', error)
      case 403:
        throw new FinancialError('Sem permissão para esta operação', 'FORBIDDEN', error)
      case 404:
        throw new FinancialError('Registro não encontrado', 'NOT_FOUND', error)
      case 422:
        throw new FinancialError(message || 'Dados de entrada inválidos', 'VALIDATION_ERROR', error)
      case 500:
        throw new FinancialError('Erro interno do servidor', 'SERVER_ERROR', error)
      default:
        throw new FinancialError(message || 'Erro desconhecido', 'UNKNOWN_ERROR', error)
    }
  }
  
  if (error.request) {
    throw new FinancialError('Servidor indisponível. Verifique sua conexão.', 'NETWORK_ERROR', error)
  }
  
  throw new FinancialError(error.message || 'Erro inesperado', 'UNEXPECTED_ERROR', error)
}

// ==================== HONORÁRIOS ====================

export const feeService = {
  /**
   * Cria um novo honorário
   */
  create: async (data) => {
    try {
      const response = await api.post('/financial/fees', data)
      return response.data
    } catch (error) {
      handleError(error, 'Erro ao criar honorário')
    }
  },

  /**
   * Lista honorários com filtros
   */
  list: async (filters = {}) => {
    try {
      const params = new URLSearchParams()
      if (filters.client_id) params.append('client_id', filters.client_id)
      if (filters.case_id) params.append('case_id', filters.case_id)
      if (filters.status) params.append('status', filters.status)
      if (filters.limit) params.append('limit', filters.limit)
      
      const response = await api.get(`/financial/fees?${params}`)
      return response.data
    } catch (error) {
      handleError(error, 'Erro ao listar honorários')
    }
  },

  /**
   * Obtém detalhes de um honorário
   */
  get: async (feeId) => {
    try {
      const response = await api.get(`/financial/fees/${feeId}`)
      return response.data
    } catch (error) {
      handleError(error, `Erro ao buscar honorário ${feeId}`)
    }
  },

  /**
   * Registra pagamento de honorário
   */
  recordPayment: async (feeId, paymentData) => {
    try {
      const response = await api.post(`/financial/fees/${feeId}/payment`, paymentData)
      return response.data
    } catch (error) {
      handleError(error, `Erro ao registrar pagamento do honorário ${feeId}`)
    }
  }
}

// ==================== DESPESAS ====================

export const expenseService = {
  /**
   * Cria uma nova despesa
   */
  create: async (data) => {
    try {
      const response = await api.post('/financial/expenses', data)
      return response.data
    } catch (error) {
      handleError(error, 'Erro ao criar despesa')
    }
  },

  /**
   * Lista despesas com filtros
   */
  list: async (filters = {}) => {
    try {
      const params = new URLSearchParams()
      if (filters.client_id) params.append('client_id', filters.client_id)
      if (filters.case_id) params.append('case_id', filters.case_id)
      if (filters.category) params.append('category', filters.category)
      if (filters.status) params.append('status', filters.status)
      if (filters.start_date) params.append('start_date', filters.start_date)
      if (filters.end_date) params.append('end_date', filters.end_date)
      if (filters.limit) params.append('limit', filters.limit)
      
      const response = await api.get(`/financial/expenses?${params}`)
      return response.data
    } catch (error) {
      handleError(error, 'Erro ao listar despesas')
    }
  },

  /**
   * Obtém detalhes de uma despesa
   */
  get: async (expenseId) => {
    try {
      const response = await api.get(`/financial/expenses/${expenseId}`)
      return response.data
    } catch (error) {
      handleError(error, `Erro ao buscar despesa ${expenseId}`)
    }
  },

  /**
   * Atualiza status de uma despesa
   */
  updateStatus: async (expenseId, status, notes = null) => {
    try {
      const response = await api.patch(`/financial/expenses/${expenseId}/status`, { status, notes })
      return response.data
    } catch (error) {
      handleError(error, `Erro ao atualizar status da despesa ${expenseId}`)
    }
  }
}

// ==================== FATURAS ====================

export const invoiceService = {
  /**
   * Cria uma nova fatura
   */
  create: async (data) => {
    try {
      const response = await api.post('/financial/invoices', data)
      return response.data
    } catch (error) {
      handleError(error, 'Erro ao criar fatura')
    }
  },

  /**
   * Lista faturas com filtros
   */
  list: async (filters = {}) => {
    try {
      const params = new URLSearchParams()
      if (filters.client_id) params.append('client_id', filters.client_id)
      if (filters.case_id) params.append('case_id', filters.case_id)
      if (filters.status) params.append('status', filters.status)
      if (filters.limit) params.append('limit', filters.limit)
      
      const response = await api.get(`/financial/invoices?${params}`)
      return response.data
    } catch (error) {
      handleError(error, 'Erro ao listar faturas')
    }
  },

  /**
   * Obtém detalhes de uma fatura
   */
  get: async (invoiceId) => {
    try {
      const response = await api.get(`/financial/invoices/${invoiceId}`)
      return response.data
    } catch (error) {
      handleError(error, `Erro ao buscar fatura ${invoiceId}`)
    }
  },

  /**
   * Envia fatura para o cliente
   */
  send: async (invoiceId) => {
    try {
      const response = await api.post(`/financial/invoices/${invoiceId}/send`)
      return response.data
    } catch (error) {
      handleError(error, `Erro ao enviar fatura ${invoiceId}`)
    }
  },

  /**
   * Registra pagamento de fatura
   */
  recordPayment: async (invoiceId, paymentData) => {
    try {
      const response = await api.post(`/financial/invoices/${invoiceId}/payment`, paymentData)
      return response.data
    } catch (error) {
      handleError(error, `Erro ao registrar pagamento da fatura ${invoiceId}`)
    }
  },

  /**
   * Cancela uma fatura
   */
  cancel: async (invoiceId, reason) => {
    try {
      const response = await api.post(`/financial/invoices/${invoiceId}/cancel`, { reason })
      return response.data
    } catch (error) {
      handleError(error, `Erro ao cancelar fatura ${invoiceId}`)
    }
  }
}

// ==================== RELATÓRIOS ====================

export const financialReportService = {
  /**
   * Obtém resumo financeiro
   */
  getSummary: async (filters = {}) => {
    try {
      const params = new URLSearchParams()
      if (filters.start_date) params.append('start_date', filters.start_date)
      if (filters.end_date) params.append('end_date', filters.end_date)
      if (filters.client_id) params.append('client_id', filters.client_id)
      
      const response = await api.get(`/financial/reports/summary?${params}`)
      return response.data
    } catch (error) {
      handleError(error, 'Erro ao buscar resumo financeiro')
    }
  },

  /**
   * Obtém fluxo de caixa
   */
  getCashFlow: async (months = 6) => {
    try {
      const response = await api.get(`/financial/reports/cash-flow?months=${months}`)
      return response.data
    } catch (error) {
      handleError(error, 'Erro ao buscar fluxo de caixa')
    }
  },

  /**
   * Obtém saldo de um cliente
   */
  getClientBalance: async (clientId) => {
    try {
      const response = await api.get(`/financial/reports/client/${clientId}/balance`)
      return response.data
    } catch (error) {
      handleError(error, `Erro ao buscar saldo do cliente ${clientId}`)
    }
  },

  /**
   * Lista itens em atraso
   */
  getOverdue: async () => {
    try {
      const response = await api.get('/financial/reports/overdue')
      return response.data
    } catch (error) {
      handleError(error, 'Erro ao buscar itens em atraso')
    }
  },

  /**
   * Ranking de casos por receita
   */
  getRevenueByCase: async (limit = 10) => {
    try {
      const response = await api.get(`/financial/reports/revenue-by-case?limit=${limit}`)
      return response.data
    } catch (error) {
      handleError(error, 'Erro ao buscar receita por caso')
    }
  }
}

// ==================== OPÇÕES ====================

export const financialOptionsService = {
  /**
   * Lista tipos de honorários
   */
  getFeeTypes: async () => {
    try {
      const response = await api.get('/financial/options/fee-types')
      return response.data
    } catch (error) {
      handleError(error, 'Erro ao buscar tipos de honorários')
    }
  },

  /**
   * Lista categorias de despesas
   */
  getExpenseCategories: async () => {
    try {
      const response = await api.get('/financial/options/expense-categories')
      return response.data
    } catch (error) {
      handleError(error, 'Erro ao buscar categorias de despesas')
    }
  },

  /**
   * Lista métodos de pagamento
   */
  getPaymentMethods: async () => {
    try {
      const response = await api.get('/financial/options/payment-methods')
      return response.data
    } catch (error) {
      handleError(error, 'Erro ao buscar métodos de pagamento')
    }
  }
}

// Export consolidado
export default {
  fees: feeService,
  expenses: expenseService,
  invoices: invoiceService,
  reports: financialReportService,
  options: financialOptionsService
}

// Export da classe de erro para uso externo
export { FinancialError }
