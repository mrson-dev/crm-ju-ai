import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Plus, 
  Search, 
  FolderOpen, 
  FileX, 
  Users,
  Briefcase,
  Calendar,
  FileText,
  Inbox
} from 'lucide-react';

/**
 * Componente EmptyState moderno com ilustrações e variantes.
 */
export default function EmptyState({ 
  icon: CustomIcon, 
  title, 
  description, 
  actionLabel, 
  actionHref,
  onAction,
  variant = 'default',
  size = 'md',
  className = '' 
}) {
  const variants = {
    default: {
      icon: Inbox,
      bg: 'bg-gray-100',
      iconColor: 'text-gray-400',
      pattern: false,
    },
    search: {
      icon: Search,
      bg: 'bg-primary-50',
      iconColor: 'text-primary-400',
      pattern: true,
    },
    folder: {
      icon: FolderOpen,
      bg: 'bg-warning-50',
      iconColor: 'text-warning-400',
      pattern: false,
    },
    file: {
      icon: FileX,
      bg: 'bg-gray-100',
      iconColor: 'text-gray-400',
      pattern: false,
    },
    users: {
      icon: Users,
      bg: 'bg-accent-50',
      iconColor: 'text-accent-400',
      pattern: true,
    },
    cases: {
      icon: Briefcase,
      bg: 'bg-primary-50',
      iconColor: 'text-primary-400',
      pattern: true,
    },
    calendar: {
      icon: Calendar,
      bg: 'bg-success-50',
      iconColor: 'text-success-400',
      pattern: false,
    },
    documents: {
      icon: FileText,
      bg: 'bg-warning-50',
      iconColor: 'text-warning-400',
      pattern: true,
    },
  };

  const sizes = {
    sm: {
      container: 'py-8',
      iconWrapper: 'w-16 h-16',
      iconSize: 'w-8 h-8',
      title: 'text-base',
      description: 'text-sm max-w-xs',
    },
    md: {
      container: 'py-12',
      iconWrapper: 'w-20 h-20',
      iconSize: 'w-10 h-10',
      title: 'text-lg',
      description: 'text-sm max-w-sm',
    },
    lg: {
      container: 'py-16',
      iconWrapper: 'w-24 h-24',
      iconSize: 'w-12 h-12',
      title: 'text-xl',
      description: 'text-base max-w-md',
    },
  };

  const config = variants[variant] || variants.default;
  const sizeConfig = sizes[size];
  const Icon = CustomIcon || config.icon;

  return (
    <div className={`flex flex-col items-center justify-center text-center ${sizeConfig.container} ${className}`}>
      {/* Decorative Pattern Background */}
      {config.pattern && (
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="empty-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="1.5" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#empty-pattern)" />
          </svg>
        </div>
      )}

      {/* Icon with animation */}
      <div className={`
        relative ${sizeConfig.iconWrapper} rounded-2xl ${config.bg}
        flex items-center justify-center mb-4
        animate-pulse-soft
      `}>
        {/* Decorative rings */}
        <div className={`absolute inset-0 ${config.bg} rounded-2xl opacity-50 animate-ping-slow`} />
        <Icon className={`${sizeConfig.iconSize} ${config.iconColor}`} />
      </div>
      
      {/* Title */}
      <h3 className={`font-semibold text-gray-900 mb-2 ${sizeConfig.title}`}>
        {title}
      </h3>
      
      {/* Description */}
      {description && (
        <p className={`text-gray-500 mb-6 ${sizeConfig.description}`}>
          {description}
        </p>
      )}
      
      {/* Action Button */}
      {actionLabel && (actionHref || onAction) && (
        actionHref ? (
          <Link 
            to={actionHref}
            className="btn-primary inline-flex items-center gap-2 group"
          >
            <Plus className="w-4 h-4" />
            {actionLabel}
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        ) : (
          <button 
            onClick={onAction}
            className="btn-primary inline-flex items-center gap-2 group"
          >
            <Plus className="w-4 h-4" />
            {actionLabel}
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        )
      )}
    </div>
  );
}

/**
 * Empty State para resultados de busca.
 */
export function SearchEmptyState({ query, onClear }) {
  return (
    <EmptyState
      variant="search"
      title="Nenhum resultado encontrado"
      description={
        query 
          ? `Não encontramos resultados para "${query}". Tente usar termos diferentes.`
          : 'Digite algo para iniciar sua busca.'
      }
      actionLabel={query ? "Limpar busca" : undefined}
      onAction={onClear}
    />
  );
}

/**
 * Empty State para listas de clientes.
 */
export function ClientsEmptyState({ onAdd }) {
  return (
    <EmptyState
      variant="users"
      title="Nenhum cliente cadastrado"
      description="Comece adicionando seu primeiro cliente para gerenciar seus processos e documentos."
      actionLabel="Adicionar Cliente"
      onAction={onAdd}
    />
  );
}

/**
 * Empty State para listas de processos.
 */
export function CasesEmptyState({ onAdd }) {
  return (
    <EmptyState
      variant="cases"
      title="Nenhum processo cadastrado"
      description="Adicione um novo processo para começar a gerenciar suas ações judiciais."
      actionLabel="Novo Processo"
      onAction={onAdd}
    />
  );
}

/**
 * Empty State para agenda.
 */
export function CalendarEmptyState({ onAdd }) {
  return (
    <EmptyState
      variant="calendar"
      title="Nenhum evento agendado"
      description="Sua agenda está livre. Adicione compromissos, audiências ou prazos."
      actionLabel="Agendar Evento"
      onAction={onAdd}
    />
  );
}

/**
 * Empty State para documentos.
 */
export function DocumentsEmptyState({ onUpload }) {
  return (
    <EmptyState
      variant="documents"
      title="Nenhum documento encontrado"
      description="Faça upload de documentos ou gere a partir de templates."
      actionLabel="Fazer Upload"
      onAction={onUpload}
    />
  );
}

/**
 * Empty State com ilustração personalizada.
 */
export function IllustratedEmptyState({
  illustration,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 text-center ${className}`}>
      {/* Illustration container */}
      <div className="relative w-48 h-48 mb-6">
        {illustration || (
          <svg className="w-full h-full" viewBox="0 0 200 200" fill="none">
            {/* Default abstract illustration */}
            <circle cx="100" cy="100" r="80" className="fill-gray-100" />
            <circle cx="100" cy="100" r="60" className="fill-gray-50" />
            <path 
              d="M80 90 L100 70 L120 90 L100 110 Z" 
              className="fill-primary-200"
            />
            <circle cx="100" cy="90" r="20" className="fill-primary-100" />
            <rect x="85" y="120" width="30" height="4" rx="2" className="fill-gray-200" />
            <rect x="75" y="130" width="50" height="4" rx="2" className="fill-gray-200" />
          </svg>
        )}
      </div>
      
      <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
      
      {description && (
        <p className="text-gray-500 max-w-md mb-8 leading-relaxed">{description}</p>
      )}
      
      {actionLabel && (actionHref || onAction) && (
        <div className="flex gap-3">
          {actionHref ? (
            <Link to={actionHref} className="btn-primary">
              {actionLabel}
            </Link>
          ) : (
            <button onClick={onAction} className="btn-primary">
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Empty State compacto para cards/seções.
 */
export function CompactEmptyState({ icon: Icon, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      {Icon && (
        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
          <Icon className="w-6 h-6 text-gray-400" />
        </div>
      )}
      <p className="text-sm text-gray-500 mb-3">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
