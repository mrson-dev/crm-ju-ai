/**
 * Sistema de Logging Condicional
 * Logs são exibidos apenas em desenvolvimento
 */

const isDev = import.meta.env.DEV
const isProd = import.meta.env.PROD

/**
 * Logger condicional para desenvolvimento
 */
export const logger = {
  /**
   * Log de informação (apenas dev)
   */
  info: (...args) => {
    if (isDev) {
      console.log('[INFO]', ...args)
    }
  },

  /**
   * Log de aviso (apenas dev)
   */
  warn: (...args) => {
    if (isDev) {
      console.warn('[WARN]', ...args)
    }
  },

  /**
   * Log de erro (dev: console, prod: serviço de monitoramento)
   */
  error: (context, error, metadata = {}) => {
    if (isDev) {
      console.error(`[ERROR] ${context}:`, error, metadata)
    } else {
      // TODO: Integrar com serviço de monitoramento (Sentry, LogRocket)
      // sendToErrorTracking({ context, error, metadata })
    }
  },

  /**
   * Log de debug (apenas dev)
   */
  debug: (...args) => {
    if (isDev) {
      console.debug('[DEBUG]', ...args)
    }
  },

  /**
   * Medição de performance (apenas dev)
   */
  performance: (label, callback) => {
    if (!isDev) {
      return callback()
    }

    const start = performance.now()
    const result = callback()
    const end = performance.now()
    const duration = end - start

    if (duration > 16) { // Mais de 1 frame (60fps)
      console.warn(`[PERF] ${label} levou ${duration.toFixed(2)}ms`)
    }

    return result
  },

  /**
   * Tabela de dados (apenas dev)
   */
  table: (data) => {
    if (isDev && console.table) {
      console.table(data)
    }
  },

  /**
   * Grupo de logs (apenas dev)
   */
  group: (label, callback) => {
    if (isDev) {
      console.group(label)
      callback()
      console.groupEnd()
    } else {
      callback()
    }
  },
}

/**
 * Assert para validações (apenas dev)
 */
export function assert(condition, message) {
  if (isDev && !condition) {
    throw new Error(`Assertion failed: ${message}`)
  }
}

/**
 * Validador de props (apenas dev)
 */
export function validateProps(componentName, props, schema) {
  if (!isDev) return

  Object.entries(schema).forEach(([key, validator]) => {
    if (validator.required && !(key in props)) {
      logger.error(
        `${componentName}: Prop obrigatória "${key}" não fornecida`,
        new Error('Missing required prop')
      )
    }

    if (key in props && validator.type) {
      const actualType = typeof props[key]
      const expectedType = validator.type

      if (actualType !== expectedType) {
        logger.error(
          `${componentName}: Prop "${key}" deveria ser ${expectedType}, mas é ${actualType}`,
          new Error('Invalid prop type')
        )
      }
    }
  })
}

export default logger
