/**
 * Validação de Variáveis de Ambiente
 * Garante que todas as configurações necessárias estão presentes
 */

import logger from './logger'

/**
 * Variáveis obrigatórias para o funcionamento da aplicação
 */
const REQUIRED_ENV_VARS = [
  'VITE_API_URL',
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
]

/**
 * Variáveis opcionais (com valores padrão)
 */
const OPTIONAL_ENV_VARS = {
  VITE_FIREBASE_MEASUREMENT_ID: null,
  VITE_APP_VERSION: '1.0.0'
}

/**
 * Valida se todas as variáveis de ambiente necessárias estão configuradas
 * @throws {Error} Se alguma variável obrigatória estiver faltando
 */
export function validateEnvironment() {
  const missing = []
  const warnings = []

  // Verifica variáveis obrigatórias
  REQUIRED_ENV_VARS.forEach(varName => {
    const value = import.meta.env[varName]
    if (!value || value.trim() === '') {
      missing.push(varName)
    }
  })

  if (missing.length > 0) {
    const error = new Error(
      `Configuração inválida: As seguintes variáveis de ambiente são obrigatórias mas não foram encontradas:\n${missing.join('\n')}\n\nVerifique seu arquivo .env`
    )
    logger.error('Validação de ambiente falhou', error, { missing })
    throw error
  }

  // Verifica variáveis opcionais e loga avisos
  Object.entries(OPTIONAL_ENV_VARS).forEach(([varName, defaultValue]) => {
    const value = import.meta.env[varName]
    if (!value && defaultValue !== null) {
      warnings.push(`${varName} não configurado, usando padrão: ${defaultValue}`)
    }
  })

  if (warnings.length > 0) {
    logger.warn('Variáveis de ambiente opcionais não configuradas:', warnings)
  }

  // Validação de formato
  const apiUrl = import.meta.env.VITE_API_URL
  if (apiUrl && !apiUrl.match(/^https?:\/\/.+/)) {
    logger.warn('VITE_API_URL pode estar em formato incorreto:', apiUrl)
  }

  logger.info('✓ Validação de ambiente concluída com sucesso')
  
  return true
}

/**
 * Retorna informações do ambiente (útil para debug)
 */
export function getEnvironmentInfo() {
  return {
    mode: import.meta.env.MODE,
    dev: import.meta.env.DEV,
    prod: import.meta.env.PROD,
    apiUrl: import.meta.env.VITE_API_URL,
    version: import.meta.env.VITE_APP_VERSION || '1.0.0'
  }
}

export default validateEnvironment
