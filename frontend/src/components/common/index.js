// Exporta todos os componentes comuns

// Modal e variantes
export { 
  default as Modal, 
  ConfirmModal, 
  AlertModal, 
  DrawerModal, 
  FullScreenModal 
} from './Modal';

// Confirm Dialog e variantes
export { 
  default as ConfirmDialog, 
  DeleteConfirmDialog, 
  SaveConfirmDialog 
} from './ConfirmDialog';

// Loading e Skeletons
export { 
  default as LoadingSpinner, 
  PageLoading,
  CardLoading,
  TableLoading,
  ListLoading,
  InlineLoading
} from './LoadingSpinner';

// Toast e sistema de notificações
export { 
  ToastProvider, 
  useToast, 
  StandaloneToast, 
  AlertBanner 
} from './Toast';

// Empty States
export { 
  default as EmptyState, 
  SearchEmptyState, 
  ClientsEmptyState, 
  CasesEmptyState, 
  CalendarEmptyState, 
  DocumentsEmptyState, 
  IllustratedEmptyState, 
  CompactEmptyState 
} from './EmptyState';

// Error Boundary
export { 
  default as ErrorBoundary, 
  withErrorBoundary, 
  InlineError, 
  PageError, 
  NotFound 
} from './ErrorBoundary';

// Breadcrumb
export { default as Breadcrumb } from './Breadcrumb';

// Page Header
export { default as PageHeader } from './PageHeader';

// Search Filter
export { default as SearchFilter } from './SearchFilter';
