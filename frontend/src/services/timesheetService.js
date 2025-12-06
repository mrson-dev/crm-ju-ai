/**
 * Serviço de Timesheet - API Client
 * 
 * Gerencia requisições para o sistema de controle de tempo.
 * Inclui CRUD, timer, sugestões e relatórios.
 */
import api from './api';

const timesheetService = {
  // ============================================================
  // CRUD DE ENTRADAS DE TEMPO
  // ============================================================

  /**
   * Cria uma nova entrada de tempo
   * @param {Object} entryData - Dados da entrada
   */
  async create(entryData) {
    const response = await api.post('/timesheet', entryData);
    return response.data;
  },

  /**
   * Lista entradas de tempo com filtros
   * @param {Object} filters - Filtros opcionais
   */
  async list(filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.case_id) params.append('case_id', filters.case_id);
    if (filters.client_id) params.append('client_id', filters.client_id);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.is_billable !== undefined) params.append('is_billable', filters.is_billable);
    if (filters.activity_type) params.append('activity_type', filters.activity_type);
    
    const response = await api.get(`/timesheet?${params.toString()}`);
    return response.data;
  },

  /**
   * Obtém uma entrada específica
   * @param {string} entryId - ID da entrada
   */
  async get(entryId) {
    const response = await api.get(`/timesheet/${entryId}`);
    return response.data;
  },

  /**
   * Atualiza uma entrada de tempo
   * @param {string} entryId - ID da entrada
   * @param {Object} updateData - Dados para atualização
   */
  async update(entryId, updateData) {
    const response = await api.put(`/timesheet/${entryId}`, updateData);
    return response.data;
  },

  /**
   * Remove uma entrada de tempo
   * @param {string} entryId - ID da entrada
   */
  async delete(entryId) {
    const response = await api.delete(`/timesheet/${entryId}`);
    return response.data;
  },

  // ============================================================
  // TIMER - CRONÔMETRO
  // ============================================================

  /**
   * Inicia o timer
   * @param {Object} options - Opções do timer
   */
  async startTimer(options = {}) {
    const params = new URLSearchParams();
    
    if (options.case_id) params.append('case_id', options.case_id);
    if (options.client_id) params.append('client_id', options.client_id);
    if (options.description) params.append('description', options.description);
    if (options.activity_type) params.append('activity_type', options.activity_type);
    
    const response = await api.post(`/timesheet/timer/start?${params.toString()}`);
    return response.data;
  },

  /**
   * Para o timer
   * @param {string} entryId - ID da entrada com timer ativo
   * @param {string} description - Descrição atualizada (opcional)
   */
  async stopTimer(entryId, description = null) {
    const params = new URLSearchParams();
    if (description) params.append('description', description);
    
    const response = await api.post(`/timesheet/timer/stop/${entryId}?${params.toString()}`);
    return response.data;
  },

  /**
   * Obtém o timer ativo
   */
  async getActiveTimer() {
    const response = await api.get('/timesheet/timer/active');
    return response.data;
  },

  // ============================================================
  // SUGESTÕES
  // ============================================================

  /**
   * Obtém sugestões de atividade
   * @param {string} caseId - ID do caso para contexto (opcional)
   */
  async getSuggestions(caseId = null) {
    const params = caseId ? `?case_id=${caseId}` : '';
    const response = await api.get(`/timesheet/suggest/activity${params}`);
    return response.data;
  },

  // ============================================================
  // FATURAMENTO
  // ============================================================

  /**
   * Calcula faturamento de uma entrada
   * @param {string} entryId - ID da entrada
   * @param {number} customRate - Taxa personalizada (opcional)
   */
  async calculateBilling(entryId, customRate = null) {
    const params = customRate ? `?custom_rate=${customRate}` : '';
    const response = await api.get(`/timesheet/billing/calculate/${entryId}${params}`);
    return response.data;
  },

  // ============================================================
  // RELATÓRIOS
  // ============================================================

  /**
   * Obtém resumo diário
   * @param {string} date - Data no formato YYYY-MM-DD (opcional, padrão: hoje)
   */
  async getDailySummary(date = null) {
    const params = date ? `?target_date=${date}` : '';
    const response = await api.get(`/timesheet/report/daily${params}`);
    return response.data;
  },

  /**
   * Obtém relatório mensal
   * @param {number} year - Ano
   * @param {number} month - Mês (1-12)
   */
  async getMonthlyReport(year, month) {
    const response = await api.get(`/timesheet/report/monthly?year=${year}&month=${month}`);
    return response.data;
  },

  /**
   * Obtém relatório por caso
   * @param {string} caseId - ID do caso
   * @param {Object} period - Período {start_date, end_date}
   */
  async getCaseReport(caseId, period = {}) {
    const params = new URLSearchParams();
    if (period.start_date) params.append('start_date', period.start_date);
    if (period.end_date) params.append('end_date', period.end_date);
    
    const response = await api.get(`/timesheet/report/case/${caseId}?${params.toString()}`);
    return response.data;
  },

  /**
   * Obtém relatório por cliente
   * @param {string} clientId - ID do cliente
   * @param {Object} period - Período {start_date, end_date}
   */
  async getClientReport(clientId, period = {}) {
    const params = new URLSearchParams();
    if (period.start_date) params.append('start_date', period.start_date);
    if (period.end_date) params.append('end_date', period.end_date);
    
    const response = await api.get(`/timesheet/report/client/${clientId}?${params.toString()}`);
    return response.data;
  }
};

export default timesheetService;
