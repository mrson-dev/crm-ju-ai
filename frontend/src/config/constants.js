// Configuração da API
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Configuração do Firebase
export const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Status de processos
export const CASE_STATUS = {
  NOVO: 'novo',
  EM_ANDAMENTO: 'em_andamento',
  AGUARDANDO: 'aguardando',
  CONCLUIDO: 'concluido',
  ARQUIVADO: 'arquivado',
}

// Prioridades de processos
export const CASE_PRIORITY = {
  BAIXA: 'baixa',
  NORMAL: 'normal', // Corrigido de MEDIA
  ALTA: 'alta',
  URGENTE: 'urgente',
}

// Constantes de paginação
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 15,
  CASES_PAGE_SIZE: 12,
  MAX_PAGE_SIZE: 100,
}

// Constantes de tempo (em ms)
export const TIME_CONSTANTS = {
  DEBOUNCE_DELAY: 300,
  THROTTLE_DELAY: 100,
  QUERY_STALE_TIME: 5 * 60 * 1000, // 5 minutos
  QUERY_GC_TIME: 10 * 60 * 1000, // 10 minutos
}

// Ambiente
export const IS_DEV = import.meta.env.DEV
export const IS_PROD = import.meta.env.PROD
