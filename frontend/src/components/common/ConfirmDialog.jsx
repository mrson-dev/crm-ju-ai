import React, { useEffect, useState } from 'react';
import { AlertTriangle, Info, CheckCircle, XCircle, Trash2, LogOut, Save } from 'lucide-react';

/**
 * Diálogo de confirmação moderno com animações.
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Se o diálogo está aberto
 * @param {Function} props.onConfirm - Callback ao confirmar
 * @param {Function} props.onCancel - Callback ao cancelar
 * @param {string} props.title - Título do diálogo
 * @param {string} props.message - Mensagem de confirmação
 * @param {string} [props.confirmText='Confirmar'] - Texto do botão de confirmação
 * @param {string} [props.cancelText='Cancelar'] - Texto do botão de cancelar
 * @param {string} [props.variant='warning'] - Variante: 'warning', 'danger', 'info', 'success'
 * @param {boolean} [props.isLoading=false] - Se está processando
 * @param {React.ReactNode} [props.icon] - Ícone personalizado
 */
export default function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'warning',
  isLoading = false,
  icon: customIcon,
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Animação de entrada/saída
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setShouldRender(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Fechar com ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && !isLoading) onCancel();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isLoading, onCancel]);

  if (!shouldRender) return null;

  const variants = {
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-warning-500',
      iconBg: 'bg-warning-100',
      gradient: 'from-warning-500 to-warning-600',
      buttonColor: 'bg-warning-500 hover:bg-warning-600 focus:ring-warning-500',
    },
    danger: {
      icon: Trash2,
      iconColor: 'text-danger-500',
      iconBg: 'bg-danger-100',
      gradient: 'from-danger-500 to-danger-600',
      buttonColor: 'bg-danger-500 hover:bg-danger-600 focus:ring-danger-500',
    },
    info: {
      icon: Info,
      iconColor: 'text-primary-500',
      iconBg: 'bg-primary-100',
      gradient: 'from-primary-500 to-primary-600',
      buttonColor: 'bg-primary-500 hover:bg-primary-600 focus:ring-primary-500',
    },
    success: {
      icon: CheckCircle,
      iconColor: 'text-success-500',
      iconBg: 'bg-success-100',
      gradient: 'from-success-500 to-success-600',
      buttonColor: 'bg-success-500 hover:bg-success-600 focus:ring-success-500',
    },
    logout: {
      icon: LogOut,
      iconColor: 'text-gray-500',
      iconBg: 'bg-gray-100',
      gradient: 'from-gray-500 to-gray-600',
      buttonColor: 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500',
    },
  };

  const config = variants[variant] || variants.warning;
  const Icon = customIcon || config.icon;

  return (
    <div
      className={`
        fixed inset-0 z-50 flex items-center justify-center p-4
        transition-all duration-200 ease-out
        ${isVisible ? 'bg-gray-900/60 backdrop-blur-sm' : 'bg-transparent'}
      `}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-message"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onCancel();
      }}
    >
      <div 
        className={`
          bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden
          transition-all duration-200 ease-out
          ${isVisible 
            ? 'opacity-100 scale-100 translate-y-0' 
            : 'opacity-0 scale-95 translate-y-4'}
        `}
      >
        {/* Top accent */}
        <div className={`h-1 w-full bg-gradient-to-r ${config.gradient}`} />
        
        <div className="p-6">
          <div className="flex flex-col items-center text-center">
            {/* Icon */}
            <div className={`
              w-16 h-16 rounded-2xl ${config.iconBg} 
              flex items-center justify-center mb-4
              animate-bounce-subtle
            `}>
              <Icon className={`w-8 h-8 ${config.iconColor}`} />
            </div>
            
            {/* Title */}
            <h3 
              id="confirm-title" 
              className="text-xl font-semibold text-gray-900 mb-2"
            >
              {title}
            </h3>
            
            {/* Message */}
            <p 
              id="confirm-message" 
              className="text-gray-600 leading-relaxed"
            >
              {message}
            </p>
          </div>
        </div>
        
        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`
              flex-1 px-4 py-2.5 rounded-xl font-medium text-white
              transition-all duration-200 
              focus:outline-none focus:ring-2 focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed
              ${config.buttonColor}
            `}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processando...
              </span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Dialog de confirmação para exclusão.
 */
export function DeleteConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  itemName,
  itemType = 'item',
  isLoading = false,
}) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onConfirm={onConfirm}
      onCancel={onCancel}
      title={`Excluir ${itemType}?`}
      message={
        itemName 
          ? `Tem certeza que deseja excluir "${itemName}"? Esta ação não pode ser desfeita.`
          : `Tem certeza que deseja excluir este ${itemType}? Esta ação não pode ser desfeita.`
      }
      confirmText="Excluir"
      cancelText="Cancelar"
      variant="danger"
      isLoading={isLoading}
    />
  );
}

/**
 * Dialog de confirmação para salvar alterações.
 */
export function SaveConfirmDialog({
  isOpen,
  onSave,
  onDiscard,
  onCancel,
  isLoading = false,
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setShouldRender(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && !isLoading) onCancel();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isLoading, onCancel]);

  if (!shouldRender) return null;

  return (
    <div
      className={`
        fixed inset-0 z-50 flex items-center justify-center p-4
        transition-all duration-200 ease-out
        ${isVisible ? 'bg-gray-900/60 backdrop-blur-sm' : 'bg-transparent'}
      `}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onCancel();
      }}
    >
      <div 
        className={`
          bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden
          transition-all duration-200 ease-out
          ${isVisible 
            ? 'opacity-100 scale-100 translate-y-0' 
            : 'opacity-0 scale-95 translate-y-4'}
        `}
      >
        <div className="h-1 w-full bg-gradient-to-r from-primary-500 to-accent-500" />
        
        <div className="p-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center mb-4">
              <Save className="w-8 h-8 text-primary-500" />
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Alterações não salvas
            </h3>
            
            <p className="text-gray-600">
              Você tem alterações não salvas. Deseja salvar antes de sair?
            </p>
          </div>
        </div>
        
        <div className="px-6 py-4 bg-gray-50 flex gap-3">
          <button
            onClick={onDiscard}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-xl font-medium text-danger-600 
              bg-danger-50 hover:bg-danger-100 transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Descartar
          </button>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={isLoading}
            className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}
