/**
 * Serviço de Automação de Documentos - API Client
 * 
 * Gerencia requisições para o sistema de geração de documentos.
 * Inclui geração de templates, assembly, versionamento e sugestões.
 */
import api from './api';

const documentAutomationService = {
  // ============================================================
  // DOCUMENTOS GERADOS - CRUD
  // ============================================================

  /**
   * Cria um novo documento manualmente
   * @param {Object} data - Dados do documento
   */
  async create(data) {
    const response = await api.post('/document-automation/documents', data);
    return response.data;
  },

  /**
   * Lista documentos gerados com filtros
   * @param {Object} filters - Filtros opcionais
   */
  async list(filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.category) params.append('category', filters.category);
    if (filters.status) params.append('status', filters.status);
    if (filters.client_id) params.append('client_id', filters.client_id);
    if (filters.case_id) params.append('case_id', filters.case_id);
    if (filters.limit) params.append('limit', filters.limit);
    
    const response = await api.get(`/document-automation/documents?${params.toString()}`);
    return response.data;
  },

  /**
   * Obtém documento por ID
   * @param {string} docId - ID do documento
   */
  async get(docId) {
    const response = await api.get(`/document-automation/documents/${docId}`);
    return response.data;
  },

  /**
   * Atualiza um documento
   * @param {string} docId - ID do documento
   * @param {Object} data - Dados para atualização
   * @param {boolean} createVersion - Se deve criar nova versão
   */
  async update(docId, data, createVersion = true) {
    const response = await api.put(
      `/document-automation/documents/${docId}?create_version=${createVersion}`,
      data
    );
    return response.data;
  },

  /**
   * Remove um documento
   * @param {string} docId - ID do documento
   */
  async delete(docId) {
    const response = await api.delete(`/document-automation/documents/${docId}`);
    return response.data;
  },

  // ============================================================
  // GERAÇÃO DE DOCUMENTOS
  // ============================================================

  /**
   * Gera documento a partir de um template
   * @param {Object} data - Dados para geração
   */
  async generateFromTemplate(data) {
    const response = await api.post('/document-automation/generate', data);
    return response.data;
  },

  /**
   * Combina múltiplos templates em um documento (Assembly)
   * @param {Object} data - Dados para assembly
   */
  async assemblyDocuments(data) {
    const response = await api.post('/document-automation/assembly', data);
    return response.data;
  },

  // ============================================================
  // AUTO-PREENCHIMENTO E SUGESTÕES
  // ============================================================

  /**
   * Obtém dados para auto-preenchimento
   * @param {string} clientId - ID do cliente (opcional)
   * @param {string} caseId - ID do caso (opcional)
   */
  async getAutoFillData(clientId = null, caseId = null) {
    const params = new URLSearchParams();
    if (clientId) params.append('client_id', clientId);
    if (caseId) params.append('case_id', caseId);
    
    const response = await api.get(`/document-automation/auto-fill?${params.toString()}`);
    return response.data;
  },

  /**
   * Obtém sugestões de conteúdo
   * @param {string} documentType - Tipo de documento
   * @param {Object} context - Contexto adicional
   */
  async suggestContent(documentType, context = {}) {
    const response = await api.post('/document-automation/suggest', {
      document_type: documentType,
      context
    });
    return response.data;
  },

  /**
   * Obtém placeholders disponíveis
   */
  async getPlaceholders() {
    const response = await api.get('/document-automation/placeholders');
    return response.data;
  },

  // ============================================================
  // VERSIONAMENTO
  // ============================================================

  /**
   * Lista versões de um documento
   * @param {string} docId - ID do documento
   */
  async getVersions(docId) {
    const response = await api.get(`/document-automation/documents/${docId}/versions`);
    return response.data;
  },

  /**
   * Restaura versão anterior
   * @param {string} docId - ID do documento
   * @param {number} version - Número da versão
   */
  async restoreVersion(docId, version) {
    const response = await api.post(`/document-automation/documents/${docId}/restore/${version}`);
    return response.data;
  },

  // ============================================================
  // ESTATÍSTICAS E CATEGORIAS
  // ============================================================

  /**
   * Obtém estatísticas de documentos
   */
  async getStats() {
    const response = await api.get('/document-automation/stats');
    return response.data;
  },

  /**
   * Obtém categorias disponíveis
   */
  async getCategories() {
    const response = await api.get('/document-automation/categories');
    return response.data;
  }
};

export default documentAutomationService;
