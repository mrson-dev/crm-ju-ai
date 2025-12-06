import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X, Loader2 } from 'lucide-react';

/**
 * Sistema de notificações (toasts) moderno com animações.
 */

const ToastContext = createContext(null);

// Hook para usar o sistema de toasts
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast deve ser usado dentro de ToastProvider');
  }
  return context;
}

// Provider do sistema de toasts
export function ToastProvider({ children, position = 'bottom-right', maxToasts = 5 }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    const newToast = { id, ...toast, isExiting: false };
    
    setToasts((prev) => {
      const updated = [...prev, newToast];
      // Limitar número de toasts
      if (updated.length > maxToasts) {
        return updated.slice(-maxToasts);
      }
      return updated;
    });

    // Auto-remove após duration (default 5s)
    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, [maxToasts]);

  const removeToast = useCallback((id) => {
    // Primeiro marca como saindo (para animação)
    setToasts((prev) => 
      prev.map((t) => (t.id === id ? { ...t, isExiting: true } : t))
    );
    // Remove após animação
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  const clearAll = useCallback(() => {
    setToasts((prev) => prev.map((t) => ({ ...t, isExiting: true })));
    setTimeout(() => setToasts([]), 300);
  }, []);

  // Helpers para diferentes tipos
  const success = useCallback((message, options = {}) => {
    return addToast({ type: 'success', message, ...options });
  }, [addToast]);

  const error = useCallback((message, options = {}) => {
    return addToast({ type: 'error', message, duration: 7000, ...options });
  }, [addToast]);

  const warning = useCallback((message, options = {}) => {
    return addToast({ type: 'warning', message, ...options });
  }, [addToast]);

  const info = useCallback((message, options = {}) => {
    return addToast({ type: 'info', message, ...options });
  }, [addToast]);

  const loading = useCallback((message, options = {}) => {
    return addToast({ type: 'loading', message, duration: 0, ...options });
  }, [addToast]);

  // Promise-based toast
  const promise = useCallback(async (promiseFn, { loading: loadingMsg, success: successMsg, error: errorMsg }) => {
    const id = addToast({ type: 'loading', message: loadingMsg, duration: 0 });
    
    try {
      const result = await promiseFn;
      setToasts((prev) => 
        prev.map((t) => (t.id === id ? { ...t, type: 'success', message: successMsg } : t))
      );
      setTimeout(() => removeToast(id), 3000);
      return result;
    } catch (err) {
      setToasts((prev) => 
        prev.map((t) => (t.id === id ? { ...t, type: 'error', message: errorMsg || err.message } : t))
      );
      setTimeout(() => removeToast(id), 5000);
      throw err;
    }
  }, [addToast, removeToast]);

  return (
    <ToastContext.Provider value={{ 
      addToast, removeToast, clearAll, 
      success, error, warning, info, loading, promise 
    }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} position={position} />
    </ToastContext.Provider>
  );
}

// Container que renderiza os toasts
function ToastContainer({ toasts, onRemove, position }) {
  if (toasts.length === 0) return null;

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  const isTop = position.startsWith('top');

  return (
    <div
      className={`fixed z-[100] flex flex-col gap-3 pointer-events-none ${positionClasses[position]}`}
      role="region"
      aria-label="Notificações"
    >
      {(isTop ? toasts : [...toasts].reverse()).map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={() => onRemove(toast.id)} />
      ))}
    </div>
  );
}

// Componente individual do toast
function Toast({ toast, onClose }) {
  const { type, message, title, action, isExiting } = toast;
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);

  const variants = {
    success: {
      icon: CheckCircle,
      gradient: 'from-success-500 to-success-600',
      bg: 'bg-white',
      ring: 'ring-success-100',
      iconBg: 'bg-success-100',
      iconColor: 'text-success-500',
      progressColor: 'bg-success-500',
    },
    error: {
      icon: XCircle,
      gradient: 'from-danger-500 to-danger-600',
      bg: 'bg-white',
      ring: 'ring-danger-100',
      iconBg: 'bg-danger-100',
      iconColor: 'text-danger-500',
      progressColor: 'bg-danger-500',
    },
    warning: {
      icon: AlertTriangle,
      gradient: 'from-warning-500 to-warning-600',
      bg: 'bg-white',
      ring: 'ring-warning-100',
      iconBg: 'bg-warning-100',
      iconColor: 'text-warning-500',
      progressColor: 'bg-warning-500',
    },
    info: {
      icon: Info,
      gradient: 'from-primary-500 to-primary-600',
      bg: 'bg-white',
      ring: 'ring-primary-100',
      iconBg: 'bg-primary-100',
      iconColor: 'text-primary-500',
      progressColor: 'bg-primary-500',
    },
    loading: {
      icon: Loader2,
      gradient: 'from-gray-500 to-gray-600',
      bg: 'bg-white',
      ring: 'ring-gray-100',
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-500',
      progressColor: 'bg-gray-500',
      animate: true,
    },
  };

  const variant = variants[type] || variants.info;
  const Icon = variant.icon;

  // Progress bar animation
  useEffect(() => {
    if (toast.duration && toast.duration > 0 && !isPaused && type !== 'loading') {
      const interval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev - (100 / (toast.duration / 100));
          return newProgress <= 0 ? 0 : newProgress;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [toast.duration, isPaused, type]);

  return (
    <div
      className={`
        pointer-events-auto
        ${variant.bg} rounded-2xl shadow-xl ring-1 ${variant.ring}
        min-w-[320px] max-w-md overflow-hidden
        transform transition-all duration-300 ease-out
        ${isExiting 
          ? 'opacity-0 translate-x-8 scale-95' 
          : 'opacity-100 translate-x-0 scale-100 animate-slide-in-right'}
      `}
      role="alert"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Top accent gradient */}
      <div className={`h-1 w-full bg-gradient-to-r ${variant.gradient}`} />
      
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`flex-shrink-0 p-2 rounded-xl ${variant.iconBg}`}>
            <Icon 
              className={`w-5 h-5 ${variant.iconColor} ${variant.animate ? 'animate-spin' : ''}`} 
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pt-0.5">
            {title && (
              <h4 className="font-semibold text-gray-900 text-sm">{title}</h4>
            )}
            <p className={`text-sm text-gray-600 ${title ? 'mt-0.5' : ''}`}>
              {message}
            </p>
            
            {/* Action button */}
            {action && (
              <button
                onClick={action.onClick}
                className={`mt-2 text-sm font-medium ${variant.iconColor} hover:underline`}
              >
                {action.label}
              </button>
            )}
          </div>

          {/* Close button */}
          {type !== 'loading' && (
            <button
              onClick={onClose}
              className="flex-shrink-0 p-1.5 text-gray-400 hover:text-gray-600 
                hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Fechar notificação"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {toast.duration && toast.duration > 0 && type !== 'loading' && (
        <div className="h-1 w-full bg-gray-100">
          <div 
            className={`h-full ${variant.progressColor} transition-all duration-100 ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Componente de toast standalone (sem context)
 */
export function StandaloneToast({ 
  type = 'info', 
  message, 
  title, 
  onClose,
  className = '' 
}) {
  const variants = {
    success: {
      icon: CheckCircle,
      bg: 'bg-success-50',
      border: 'border-success-200',
      iconColor: 'text-success-500',
      textColor: 'text-success-800',
    },
    error: {
      icon: XCircle,
      bg: 'bg-danger-50',
      border: 'border-danger-200',
      iconColor: 'text-danger-500',
      textColor: 'text-danger-800',
    },
    warning: {
      icon: AlertTriangle,
      bg: 'bg-warning-50',
      border: 'border-warning-200',
      iconColor: 'text-warning-500',
      textColor: 'text-warning-800',
    },
    info: {
      icon: Info,
      bg: 'bg-primary-50',
      border: 'border-primary-200',
      iconColor: 'text-primary-500',
      textColor: 'text-primary-800',
    },
  };

  const variant = variants[type];
  const Icon = variant.icon;

  return (
    <div className={`
      ${variant.bg} ${variant.border} border rounded-xl p-4 
      flex items-start gap-3 ${className}
    `}>
      <Icon className={`w-5 h-5 ${variant.iconColor} flex-shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        {title && <h4 className={`font-medium ${variant.textColor}`}>{title}</h4>}
        <p className={`text-sm ${variant.textColor} ${title ? 'mt-1 opacity-90' : ''}`}>
          {message}
        </p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className={`${variant.iconColor} hover:opacity-70 flex-shrink-0`}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

/**
 * Banner de alerta fixo (para mensagens persistentes)
 */
export function AlertBanner({
  type = 'info',
  message,
  title,
  action,
  onDismiss,
  className = '',
}) {
  const variants = {
    success: {
      bg: 'bg-gradient-to-r from-success-500 to-success-600',
      text: 'text-white',
    },
    error: {
      bg: 'bg-gradient-to-r from-danger-500 to-danger-600',
      text: 'text-white',
    },
    warning: {
      bg: 'bg-gradient-to-r from-warning-400 to-warning-500',
      text: 'text-warning-900',
    },
    info: {
      bg: 'bg-gradient-to-r from-primary-500 to-primary-600',
      text: 'text-white',
    },
  };

  const variant = variants[type];

  return (
    <div className={`${variant.bg} ${variant.text} px-4 py-3 ${className}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex-1">
          {title && <strong className="font-semibold">{title}: </strong>}
          <span>{message}</span>
        </div>
        <div className="flex items-center gap-3">
          {action && (
            <button
              onClick={action.onClick}
              className="font-medium underline hover:no-underline"
            >
              {action.label}
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
