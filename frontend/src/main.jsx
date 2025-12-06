import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import validateEnvironment from './utils/validateEnv'
import logger from './utils/logger'

// Validar ambiente antes de inicializar o app
try {
  validateEnvironment()
} catch (error) {
  // Em caso de erro crítico de configuração, mostrar mensagem amigável
  document.getElementById('root').innerHTML = `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      font-family: system-ui, -apple-system, sans-serif;
      padding: 20px;
    ">
      <div style="
        background: white;
        border-radius: 16px;
        padding: 40px;
        max-width: 600px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      ">
        <h1 style="color: #e53e3e; font-size: 24px; margin-bottom: 16px;">
          ⚠️ Erro de Configuração
        </h1>
        <p style="color: #4a5568; margin-bottom: 16px;">
          A aplicação não pode ser iniciada devido a problemas de configuração:
        </p>
        <pre style="
          background: #f7fafc;
          padding: 16px;
          border-radius: 8px;
          border-left: 4px solid #e53e3e;
          overflow-x: auto;
          color: #2d3748;
          font-size: 14px;
        ">${error.message}</pre>
        <p style="color: #718096; margin-top: 16px; font-size: 14px;">
          Verifique o arquivo <code>.env</code> na raiz do projeto e certifique-se de que todas as variáveis necessárias estão configuradas.
        </p>
      </div>
    </div>
  `
  throw error
}

// Log de inicialização
logger.info('🚀 Aplicação iniciando...', {
  mode: import.meta.env.MODE,
  version: import.meta.env.VITE_APP_VERSION || '1.0.0'
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
