/**
 * PageHeader - Componente padronizado para headers de página
 * Uso: <PageHeader title="Título" description="Descrição" action={<Button />} />
 * Para dual actions: <PageHeader actions={[<Button1 />, <Button2 />]} />
 */

export default function PageHeader({ 
  title, 
  description, 
  action, 
  actions,
  secondaryAction,
  backLink,
  icon: Icon,
  children 
}) {
  // Detecta se tem múltiplas ações
  const hasDualActions = actions && actions.length === 2
  const hasMultipleActions = actions && actions.length > 0
  
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-6">
      {/* Título e Descrição */}
      <div className="flex-1 min-w-0">
        <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-slate-900 leading-tight tracking-tight">{title}</h1>
        {description && (
          <p className="text-slate-500 text-xs sm:text-base mt-1 leading-snug line-clamp-2">{description}</p>
        )}
      </div>
      
      {/* Actions - Desktop: alinhado à direita na mesma linha */}
      {(action || hasMultipleActions || secondaryAction || children) && (
        <div className={`flex items-center gap-2 flex-shrink-0 ${hasDualActions ? 'w-full sm:w-auto' : ''}`}>
          {children}
          {/* Dual actions - divide por igual no mobile */}
          {hasMultipleActions ? (
            actions.map((actionItem, index) => (
              <div key={index} className={hasDualActions ? 'flex-1 sm:flex-none' : 'flex-1 sm:flex-none'}>
                {actionItem}
              </div>
            ))
          ) : (
            <>
              {secondaryAction && (
                <div className="flex-1 sm:flex-none">
                  {secondaryAction}
                </div>
              )}
              {action && (
                <div className="flex-1 sm:flex-none">
                  {action}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
