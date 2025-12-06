import React from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown, Bug } from 'lucide-react';
import logger from '../../utils/logger';

/**
 * Error Boundary moderno para capturar erros de renderização React.
 * 
 * Previne que erros em um componente derrubem toda a aplicação.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, showDetails: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })
    
    // Log apenas em desenvolvimento
    if (import.meta.env.DEV) {
      logger.error('ErrorBoundary caught an error:', error, errorInfo)
    }
    
    // TODO: Integrar com serviço de monitoramento em produção
    // if (import.meta.env.PROD) {
    //   reportErrorToService(error, errorInfo)
    // }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false });
  };

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      // Renderizar fallback customizado se fornecido
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          resetError: this.handleReset,
        });
      }

      // Fallback padrão moderno
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="text-center max-w-lg">
            {/* Animated Icon */}
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 bg-danger-100 rounded-2xl animate-pulse-soft" />
              <div className="relative w-24 h-24 bg-gradient-to-br from-danger-500 to-danger-600 rounded-2xl flex items-center justify-center shadow-lg shadow-danger-500/30">
                <AlertTriangle className="w-12 h-12 text-white" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Oops! Algo deu errado
            </h2>
            
            <p className="text-gray-600 mb-8 leading-relaxed">
              Ocorreu um erro inesperado na aplicação. Nossa equipe foi notificada. 
              Tente recarregar a página ou volte para o início.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
              <button
                onClick={this.handleReset}
                className="btn-primary inline-flex items-center justify-center gap-2 group"
              >
                <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                Tentar novamente
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="btn-secondary inline-flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Voltar ao início
              </button>
            </div>

            {/* Error Details (Development) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="text-left">
                <button
                  onClick={this.toggleDetails}
                  className="w-full flex items-center justify-between px-4 py-3 
                    bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors
                    text-sm font-medium text-gray-700"
                >
                  <span className="flex items-center gap-2">
                    <Bug className="w-4 h-4" />
                    Detalhes do erro (desenvolvimento)
                  </span>
                  <ChevronDown 
                    className={`w-4 h-4 transition-transform duration-200 
                      ${this.state.showDetails ? 'rotate-180' : ''}`} 
                  />
                </button>
                
                {this.state.showDetails && (
                  <div className="mt-3 bg-gray-900 rounded-xl p-4 overflow-hidden">
                    <div className="text-xs font-mono text-danger-400 mb-2">
                      {this.state.error.name}: {this.state.error.message}
                    </div>
                    <pre className="text-xs text-gray-400 overflow-auto max-h-48 custom-scrollbar">
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

/**
 * HOC para envolver componentes com ErrorBoundary.
 */
export function withErrorBoundary(WrappedComponent, fallback) {
  return function WithErrorBoundary(props) {
    return (
      <ErrorBoundary fallback={fallback}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}

/**
 * Componente de erro inline para seções menores.
 */
export function InlineError({ 
  message = 'Erro ao carregar', 
  onRetry,
  className = '' 
}) {
  return (
    <div className={`flex items-center justify-center p-6 ${className}`}>
      <div className="flex items-center gap-4 bg-danger-50 border border-danger-200 rounded-xl px-4 py-3">
        <div className="p-2 bg-danger-100 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-danger-500" />
        </div>
        <div>
          <p className="text-sm font-medium text-danger-800">{message}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="ml-2 p-2 text-danger-600 hover:bg-danger-100 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Page-level error component.
 */
export function PageError({
  title = 'Erro ao carregar página',
  message = 'Não foi possível carregar o conteúdo desta página.',
  onRetry,
  showHomeButton = true,
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-danger-500 to-danger-600 
          rounded-2xl flex items-center justify-center shadow-lg shadow-danger-500/30">
          <AlertTriangle className="w-10 h-10 text-white" />
        </div>
        
        <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        
        <div className="flex gap-3 justify-center">
          {onRetry && (
            <button onClick={onRetry} className="btn-primary">
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar novamente
            </button>
          )}
          {showHomeButton && (
            <button
              onClick={() => window.location.href = '/'}
              className="btn-secondary"
            >
              <Home className="w-4 h-4 mr-2" />
              Página inicial
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 404 Not Found page.
 */
export function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        {/* 404 Display */}
        <div className="relative mb-8">
          <div className="text-[150px] font-black text-gray-100 leading-none select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-accent-500 
              rounded-2xl flex items-center justify-center shadow-xl">
              <span className="text-3xl">🔍</span>
            </div>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Página não encontrada
        </h1>
        <p className="text-gray-600 mb-8">
          A página que você está procurando não existe ou foi movida.
        </p>
        
        <button
          onClick={() => window.location.href = '/'}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Home className="w-4 h-4" />
          Voltar ao início
        </button>
      </div>
    </div>
  );
}
