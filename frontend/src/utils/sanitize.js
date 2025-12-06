/**
 * Utilitários de sanitização e segurança
 */

/**
 * Sanitiza HTML removendo scripts e tags perigosas
 * IMPORTANTE: Use apenas para conteúdo de templates/documentos confiáveis
 * Para conteúdo de usuário não confiável, considere usar DOMPurify
 */
export function sanitizeHTML(html) {
  if (!html) return ''
  
  // Remove scripts e event handlers
  let sanitized = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/on\w+\s*=\s*[^\s>]*/gi, '')
    .replace(/javascript:/gi, '')
  
  return sanitized
}

/**
 * Escapa caracteres HTML para prevenir XSS
 */
export function escapeHTML(text) {
  if (!text) return ''
  
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/**
 * Remove tags HTML mantendo apenas texto
 */
export function stripHTML(html) {
  if (!html) return ''
  
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent || div.innerText || ''
}

/**
 * Valida se uma URL é segura
 */
export function isSafeURL(url) {
  if (!url) return false
  
  try {
    const parsed = new URL(url, window.location.origin)
    // Permite apenas http, https e mailto
    return ['http:', 'https:', 'mailto:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

/**
 * Sanitiza objeto removendo propriedades sensíveis
 */
export function sanitizeObject(obj, sensitiveKeys = ['password', 'token', 'secret', 'apiKey']) {
  if (!obj || typeof obj !== 'object') return obj
  
  const sanitized = { ...obj }
  
  for (const key of Object.keys(sanitized)) {
    // Remove propriedades sensíveis
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
      sanitized[key] = '[REDACTED]'
    }
    
    // Recursivo para objetos aninhados
    if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key], sensitiveKeys)
    }
  }
  
  return sanitized
}

export default {
  sanitizeHTML,
  escapeHTML,
  stripHTML,
  isSafeURL,
  sanitizeObject
}
