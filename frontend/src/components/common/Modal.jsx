import { useEffect, useRef, Fragment, useState } from 'react'
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react'

/**
 * Componente Modal moderno com animações e variantes.
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Se o modal está aberto
 * @param {Function} props.onClose - Callback ao fechar
 * @param {string} props.title - Título do modal
 * @param {React.ReactNode} props.children - Conteúdo do modal
 * @param {string} [props.size='md'] - Tamanho: 'sm', 'md', 'lg', 'xl', 'full'
 * @param {boolean} [props.closeOnOverlayClick=true] - Fechar ao clicar no overlay
 * @param {string} [props.variant='default'] - Variante: 'default', 'success', 'warning', 'danger', 'info'
 * @param {boolean} [props.showCloseButton=true] - Mostrar botão de fechar
 * @param {React.ReactNode} [props.footer] - Conteúdo do footer
 * @param {React.ReactNode} [props.icon] - Ícone personalizado
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  variant = 'default',
  showCloseButton = true,
  footer,
  icon,
}) {
  const modalRef = useRef(null)
  const [isVisible, setIsVisible] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)

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

  // Fechar com ESC e gerenciar scroll
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      const handleTab = (e) => {
        if (e.key === 'Tab') {
          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      };

      document.addEventListener('keydown', handleTab);
      firstElement?.focus();

      return () => document.removeEventListener('keydown', handleTab);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-[95vw] min-h-[90vh]',
  };

  const variantConfig = {
    default: {
      headerBg: 'bg-white',
      headerBorder: 'border-gray-200',
      icon: null,
      iconBg: '',
    },
    success: {
      headerBg: 'bg-gradient-to-r from-success-50 to-white',
      headerBorder: 'border-success-200',
      icon: <CheckCircle className="w-6 h-6 text-success-500" />,
      iconBg: 'bg-success-100',
    },
    warning: {
      headerBg: 'bg-gradient-to-r from-warning-50 to-white',
      headerBorder: 'border-warning-200',
      icon: <AlertTriangle className="w-6 h-6 text-warning-500" />,
      iconBg: 'bg-warning-100',
    },
    danger: {
      headerBg: 'bg-gradient-to-r from-danger-50 to-white',
      headerBorder: 'border-danger-200',
      icon: <AlertCircle className="w-6 h-6 text-danger-500" />,
      iconBg: 'bg-danger-100',
    },
    info: {
      headerBg: 'bg-gradient-to-r from-primary-50 to-white',
      headerBorder: 'border-primary-200',
      icon: <Info className="w-6 h-6 text-primary-500" />,
      iconBg: 'bg-primary-100',
    },
  };

  const config = variantConfig[variant] || variantConfig.default;
  const displayIcon = icon || config.icon;

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4
        transition-all duration-200 ease-out
        ${isVisible ? 'bg-gray-900/60 backdrop-blur-sm' : 'bg-transparent'}`}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className={`
          bg-white rounded-2xl shadow-2xl w-full overflow-hidden
          transition-all duration-200 ease-out
          ${sizeClasses[size]}
          ${isVisible 
            ? 'opacity-100 scale-100 translate-y-0' 
            : 'opacity-0 scale-95 translate-y-4'}
        `}
        role="document"
      >
        {/* Header */}
        <div className={`
          sticky top-0 z-10 px-6 py-4 
          flex items-center gap-4
          border-b ${config.headerBorder} ${config.headerBg}
        `}>
          {displayIcon && (
            <div className={`p-2 rounded-xl ${config.iconBg}`}>
              {displayIcon}
            </div>
          )}
          
          <h2 id="modal-title" className="flex-1 text-xl font-semibold text-gray-900">
            {title}
          </h2>
          
          {showCloseButton && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 
                rounded-xl transition-all duration-200 hover:rotate-90"
              aria-label="Fechar modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Modal de Confirmação moderno.
 */
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmar ação',
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  isLoading = false,
}) {
  const buttonVariants = {
    default: 'btn-primary',
    success: 'bg-success-500 hover:bg-success-600 text-white',
    warning: 'bg-warning-500 hover:bg-warning-600 text-white',
    danger: 'bg-danger-500 hover:bg-danger-600 text-white',
    info: 'btn-primary',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      variant={variant}
      footer={
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="btn-secondary"
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl font-medium transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              ${buttonVariants[variant]}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
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
      }
    >
      <p className="text-gray-600">{message}</p>
    </Modal>
  );
}

/**
 * Modal de Alerta.
 */
export function AlertModal({
  isOpen,
  onClose,
  title,
  message,
  variant = 'info',
  buttonText = 'Entendi',
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      variant={variant}
      footer={
        <div className="flex justify-end">
          <button onClick={onClose} className="btn-primary">
            {buttonText}
          </button>
        </div>
      }
    >
      <p className="text-gray-600">{message}</p>
    </Modal>
  );
}

/**
 * Modal Drawer (lateral).
 */
export function DrawerModal({
  isOpen,
  onClose,
  title,
  children,
  position = 'right',
  size = 'md',
  footer,
}) {
  const [isVisible, setIsVisible] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)

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
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!shouldRender) return null;

  const sizeClasses = {
    sm: 'w-80',
    md: 'w-[480px]',
    lg: 'w-[640px]',
    xl: 'w-[800px]',
  };

  const positionClasses = {
    right: {
      container: 'justify-end',
      panel: isVisible ? 'translate-x-0' : 'translate-x-full',
      rounded: 'rounded-l-2xl',
    },
    left: {
      container: 'justify-start',
      panel: isVisible ? 'translate-x-0' : '-translate-x-full',
      rounded: 'rounded-r-2xl',
    },
  };

  const pos = positionClasses[position];

  return (
    <div
      className={`fixed inset-0 z-50 flex ${pos.container}
        transition-all duration-300 ease-out
        ${isVisible ? 'bg-gray-900/60 backdrop-blur-sm' : 'bg-transparent'}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`
          h-full bg-white shadow-2xl flex flex-col
          transition-transform duration-300 ease-out
          ${sizeClasses[size]} ${pos.panel} ${pos.rounded}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 
              rounded-xl transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Full Screen Modal.
 */
export function FullScreenModal({
  isOpen,
  onClose,
  title,
  children,
  headerActions,
}) {
  const [isVisible, setIsVisible] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)

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
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-50 bg-white flex flex-col
        transition-all duration-300 ease-out
        ${isVisible ? 'opacity-100' : 'opacity-0'}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 
              rounded-xl transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        </div>
        {headerActions && (
          <div className="flex items-center gap-2">
            {headerActions}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
