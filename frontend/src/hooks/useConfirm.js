import { useState, useCallback } from 'react';

/**
 * Hook para gerenciar diálogos de confirmação.
 * 
 * @example
 * const { confirm, ConfirmDialogComponent } = useConfirm();
 * 
 * const handleDelete = async () => {
 *   const confirmed = await confirm({
 *     title: 'Confirmar exclusão',
 *     message: 'Tem certeza que deseja excluir?',
 *     variant: 'danger',
 *   });
 *   
 *   if (confirmed) {
 *     // Executar ação
 *   }
 * };
 * 
 * return (
 *   <>
 *     <button onClick={handleDelete}>Excluir</button>
 *     <ConfirmDialogComponent />
 *   </>
 * );
 */
export function useConfirm() {
  const [state, setState] = useState({
    isOpen: false,
    resolve: null,
    options: {},
  });

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        resolve,
        options: {
          title: 'Confirmar',
          message: 'Tem certeza que deseja continuar?',
          confirmText: 'Confirmar',
          cancelText: 'Cancelar',
          variant: 'warning',
          ...options,
        },
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    state.resolve?.(true);
    setState((prev) => ({ ...prev, isOpen: false }));
  }, [state.resolve]);

  const handleCancel = useCallback(() => {
    state.resolve?.(false);
    setState((prev) => ({ ...prev, isOpen: false }));
  }, [state.resolve]);

  // Componente do diálogo que precisa ser renderizado
  const ConfirmDialogComponent = useCallback(() => {
    // Import dinâmico para evitar dependência circular
    const ConfirmDialog = require('../components/common/ConfirmDialog').default;
    
    return (
      <ConfirmDialog
        isOpen={state.isOpen}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        {...state.options}
      />
    );
  }, [state.isOpen, state.options, handleConfirm, handleCancel]);

  return {
    confirm,
    ConfirmDialogComponent,
    isOpen: state.isOpen,
  };
}

export default useConfirm;
