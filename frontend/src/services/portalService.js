/**
 * Portal Service - API para o Portal do Cliente.
 * 
 * Permite que clientes acessem seus processos usando autenticação por código.
 */

import axios from 'axios';
import { API_URL } from '@/config/constants';
import logger from '@/utils/logger';

// Status dos casos com labels amigáveis
export const CASE_STATUSES = {
  novo: { label: 'Novo', color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
  em_andamento: { label: 'Em Andamento', color: 'yellow', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
  aguardando: { label: 'Aguardando', color: 'orange', bgColor: 'bg-orange-100', textColor: 'text-orange-800' },
  concluido: { label: 'Concluído', color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-800' },
  arquivado: { label: 'Arquivado', color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-800' },
};

// Armazena o token do portal
let portalToken = localStorage.getItem('portal_token');
let clientData = JSON.parse(localStorage.getItem('portal_client') || 'null');

// Axios instance para o portal
const portalApi = axios.create({
  baseURL: `${API_URL}/api/v1/portal`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Interceptor para adicionar token nas requests
portalApi.interceptors.request.use((config) => {
  if (portalToken) {
    config.params = { ...config.params, token: portalToken };
  }
  return config;
});

// Interceptor para tratar erros
portalApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido - limpa dados locais
      logger.warn('Portal token expirado ou inválido, limpando autenticação')
      // O redirecionamento será feito pelo PortalPrivateRoute
      portalToken = null;
      clientData = null;
      localStorage.removeItem('portal_token');
      localStorage.removeItem('portal_client');
    }
    
    // Erro de rede/timeout
    if (!error.response) {
      logger.error('Erro de conexão no portal', error)
      const customError = new Error('Erro de conexão. Verifique sua internet.');
      customError.code = 'NETWORK_ERROR';
      return Promise.reject(customError);
    }
    
    return Promise.reject(error);
  }
);

/**
 * Service para o Portal do Cliente
 */
const portalService = {
  /**
   * Verifica se o usuário está autenticado
   */
  isAuthenticated() {
    return !!portalToken && !!clientData;
  },

  /**
   * Retorna dados do cliente autenticado
   */
  getClientData() {
    return clientData;
  },

  /**
   * Solicita código de acesso por email
   */
  async requestAccess(email) {
    const response = await portalApi.post('/request-access', { email });
    return response.data;
  },

  /**
   * Verifica código e obtém token
   */
  async verifyCode(email, code) {
    const response = await portalApi.post('/verify-code', { email, code });
    const { access_token, client_id, client_name, expires_in } = response.data;

    // Salva token e dados do cliente
    portalToken = access_token;
    clientData = { id: client_id, name: client_name };

    localStorage.setItem('portal_token', access_token);
    localStorage.setItem('portal_client', JSON.stringify(clientData));

    return response.data;
  },

  /**
   * Faz logout - invalida token no backend e limpa dados locais
   */
  async logout() {
    // Tenta invalidar token no backend (não bloqueia se falhar)
    if (portalToken) {
      try {
        await portalApi.post('/logout');
      } catch (error) {
        console.warn('Erro ao invalidar token no servidor:', error);
      }
    }
    
    // Sempre limpa dados locais
    portalToken = null;
    clientData = null;
    localStorage.removeItem('portal_token');
    localStorage.removeItem('portal_client');
  },

  /**
   * Busca dados do dashboard
   */
  async getDashboard() {
    const response = await portalApi.get('/dashboard');
    return response.data;
  },

  /**
   * Lista casos do cliente
   */
  async getCases(status = null) {
    const params = status ? { status } : {};
    const response = await portalApi.get('/cases', { params });
    return response.data;
  },

  /**
   * Busca detalhes de um caso
   */
  async getCase(caseId) {
    const response = await portalApi.get(`/cases/${caseId}`);
    return response.data;
  },

  /**
   * Lista documentos de um caso
   */
  async getCaseDocuments(caseId) {
    const response = await portalApi.get(`/cases/${caseId}/documents`);
    return response.data;
  },

  /**
   * Lista mensagens
   */
  async getMessages(caseId = null, unreadOnly = false) {
    const params = {};
    if (caseId) params.case_id = caseId;
    if (unreadOnly) params.unread_only = true;

    const response = await portalApi.get('/messages', { params });
    return response.data;
  },

  /**
   * Envia mensagem
   */
  async sendMessage(subject, content, caseId = null) {
    const response = await portalApi.post('/messages', {
      subject,
      content,
      case_id: caseId,
    });
    return response.data;
  },

  /**
   * Marca mensagem como lida
   */
  async markMessageRead(messageId) {
    const response = await portalApi.put(`/messages/${messageId}/read`);
    return response.data;
  },

  /**
   * Busca perfil do cliente
   */
  async getProfile() {
    const response = await portalApi.get('/profile');
    return response.data;
  },
};

export default portalService;
