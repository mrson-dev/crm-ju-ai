/**
 * Task Service - Serviço para gerenciamento de tarefas com Taskscore.
 * 
 * Sistema de gamificação inspirado na ADVBOX.
 */

import api from './api';

/**
 * Tipos de tarefa disponíveis
 */
export const TASK_TYPES = {
  audiencia: { label: 'Audiência', score: 100, icon: '⚖️' },
  prazo_fatal: { label: 'Prazo Fatal', score: 90, icon: '🚨' },
  peticao: { label: 'Petição', score: 80, icon: '📄' },
  analise: { label: 'Análise', score: 70, icon: '🔍' },
  diligencia: { label: 'Diligência', score: 60, icon: '🏃' },
  prazo_comum: { label: 'Prazo Comum', score: 50, icon: '📅' },
  reuniao: { label: 'Reunião', score: 40, icon: '👥' },
  contato_cliente: { label: 'Contato Cliente', score: 30, icon: '📞' },
  outro: { label: 'Outro', score: 25, icon: '📌' },
  administrativo: { label: 'Administrativo', score: 20, icon: '📋' },
};

/**
 * Prioridades e seus multiplicadores
 */
export const TASK_PRIORITIES = {
  baixa: { label: 'Baixa', multiplier: 0.8, color: 'gray' },
  media: { label: 'Média', multiplier: 1.0, color: 'blue' },
  alta: { label: 'Alta', multiplier: 1.3, color: 'orange' },
  urgente: { label: 'Urgente', multiplier: 1.5, color: 'red' },
};

/**
 * Status das tarefas
 */
export const TASK_STATUSES = {
  pendente: { label: 'Pendente', color: 'yellow' },
  em_andamento: { label: 'Em Andamento', color: 'blue' },
  concluida: { label: 'Concluída', color: 'green' },
  cancelada: { label: 'Cancelada', color: 'gray' },
};

/**
 * Níveis de alerta para prazos
 */
export const ALERT_LEVELS = {
  normal: { label: 'Normal', color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-800' },
  attention: { label: '7 dias', color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
  warning: { label: '3 dias', color: 'yellow', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
  critical: { label: '1 dia', color: 'orange', bgColor: 'bg-orange-100', textColor: 'text-orange-800' },
  fatal: { label: 'Hoje', color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-800' },
  overdue: { label: 'Vencida', color: 'red', bgColor: 'bg-red-200', textColor: 'text-red-900' },
};

/**
 * Calcula a pontuação de uma tarefa
 */
export function calculateTaskScore(taskType, priority) {
  const baseScore = TASK_TYPES[taskType]?.score || 25;
  const multiplier = TASK_PRIORITIES[priority]?.multiplier || 1.0;
  return Math.round(baseScore * multiplier);
}

/**
 * Service para API de tarefas
 */
const taskService = {
  /**
   * Lista tarefas com filtros
   */
  async list(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.case_id) params.append('case_id', filters.case_id);
    if (filters.client_id) params.append('client_id', filters.client_id);
    if (filters.assigned_to) params.append('assigned_to', filters.assigned_to);
    if (filters.alert_level) params.append('alert_level', filters.alert_level);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);
    
    const response = await api.get(`/tasks/?${params.toString()}`);
    return response.data;
  },

  /**
   * Busca uma tarefa por ID
   */
  async get(taskId) {
    const response = await api.get(`/tasks/${taskId}`);
    return response.data;
  },

  /**
   * Cria uma nova tarefa
   */
  async create(taskData) {
    const response = await api.post('/tasks/', taskData);
    return response.data;
  },

  /**
   * Atualiza uma tarefa
   */
  async update(taskId, taskData) {
    const response = await api.put(`/tasks/${taskId}`, taskData);
    return response.data;
  },

  /**
   * Remove uma tarefa
   */
  async delete(taskId) {
    const response = await api.delete(`/tasks/${taskId}`);
    return response.data;
  },

  /**
   * Marca uma tarefa como concluída
   */
  async complete(taskId) {
    const response = await api.post(`/tasks/${taskId}/complete`);
    return response.data;
  },

  /**
   * Lista tarefas vencidas
   */
  async getOverdue() {
    const response = await api.get('/tasks/overdue');
    return response.data;
  },

  /**
   * Lista próximas tarefas
   */
  async getUpcoming(days = 7) {
    const response = await api.get(`/tasks/upcoming?days=${days}`);
    return response.data;
  },

  /**
   * Busca estatísticas de tarefas
   */
  async getStats() {
    const response = await api.get('/tasks/stats');
    return response.data;
  },

  /**
   * Busca ranking do Taskscore
   */
  async getRanking(startDate = null, endDate = null) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate.toISOString());
    if (endDate) params.append('end_date', endDate.toISOString());
    
    const response = await api.get(`/tasks/taskscore/ranking?${params.toString()}`);
    return response.data;
  },

  /**
   * Busca o Taskscore do usuário atual
   */
  async getMyScore(startDate = null, endDate = null) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate.toISOString());
    if (endDate) params.append('end_date', endDate.toISOString());
    
    const response = await api.get(`/tasks/taskscore/my-score?${params.toString()}`);
    return response.data;
  },

  /**
   * Completa múltiplas tarefas
   */
  async batchComplete(taskIds) {
    const response = await api.post('/tasks/batch/complete', taskIds);
    return response.data;
  },

  /**
   * Atualiza status de múltiplas tarefas
   */
  async batchUpdateStatus(taskIds, newStatus) {
    const response = await api.post('/tasks/batch/update-status', {
      task_ids: taskIds,
      new_status: newStatus,
    });
    return response.data;
  },
};

export default taskService;
