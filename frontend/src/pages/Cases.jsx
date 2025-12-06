import { useState, useMemo, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { caseService, clientService } from '@/services/crmService'
import { Plus, Edit, Trash2, Eye, ArrowRight, Briefcase, Search, X, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { CASE_STATUS, CASE_PRIORITY } from '@/config/constants'
import { Modal, ConfirmDialog, LoadingSpinner, CardLoading, useToast, PageHeader, SearchFilter } from '@/components/common'

// Hook para debounce
function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value)
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  
  return debouncedValue
}

export default function Cases() {
  const [showModal, setShowModal] = useState(false)
  const [editingCase, setEditingCase] = useState(null)
  const [statusFilter, setStatusFilter] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, caseItem: null })
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('created') // 'title' | 'priority' | 'created'
  const [sortOrder, setSortOrder] = useState('desc') // 'asc' | 'desc'
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12
  
  const debouncedSearch = useDebounce(searchQuery, 300)
  
  const queryClient = useQueryClient()
  const toast = useToast()

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm()

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ['cases', statusFilter],
    queryFn: () => caseService.getAll(statusFilter),
  })

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientService.getAll(),
  })

  const createMutation = useMutation({
    mutationFn: caseService.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['cases'])
      setShowModal(false)
      reset()
      toast.success('Processo criado com sucesso!')
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao criar processo')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => caseService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['cases'])
      setShowModal(false)
      setEditingCase(null)
      reset()
      toast.success('Processo atualizado com sucesso!')
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao atualizar processo')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: caseService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['cases'])
      setDeleteConfirm({ open: false, caseItem: null })
      toast.success('Processo excluído com sucesso!')
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao excluir processo')
      setDeleteConfirm({ open: false, caseItem: null })
    },
  })

  const onSubmit = (data) => {
    const tags = data.tags ? data.tags.split(',').map(t => t.trim()) : []
    const payload = { ...data, tags }
    
    if (editingCase) {
      updateMutation.mutate({ id: editingCase.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleEdit = (caseItem) => {
    setEditingCase(caseItem)
    Object.keys(caseItem).forEach(key => {
      if (key === 'tags') {
        setValue(key, caseItem[key].join(', '))
      } else {
        setValue(key, caseItem[key])
      }
    })
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingCase(null)
    reset()
  }

  const handleDeleteClick = (caseItem) => {
    setDeleteConfirm({ open: true, caseItem })
  }

  const handleConfirmDelete = () => {
    if (deleteConfirm.caseItem) {
      deleteMutation.mutate(deleteConfirm.caseItem.id)
    }
  }

  const getStatusBadge = (status) => {
    const colors = {
      novo: 'bg-blue-100 text-blue-800',
      em_andamento: 'bg-yellow-100 text-yellow-800',
      aguardando: 'bg-orange-100 text-orange-800',
      concluido: 'bg-green-100 text-green-800',
      arquivado: 'bg-gray-100 text-gray-800',
    }
    return colors[status] || colors.novo
  }

  // Filtro com busca e ordenação
  const filteredCases = useMemo(() => {
    const query = debouncedSearch.toLowerCase().trim()
    
    let result = cases.filter(caseItem => {
      // Filtro por status
      if (statusFilter && caseItem.status !== statusFilter) return false
      
      // Filtro por busca
      if (query) {
        const titleMatch = caseItem.title?.toLowerCase().includes(query)
        const numberMatch = caseItem.case_number?.toLowerCase().includes(query)
        const descMatch = caseItem.description?.toLowerCase().includes(query)
        const tagsMatch = caseItem.tags?.some(tag => tag.toLowerCase().includes(query))
        
        return titleMatch || numberMatch || descMatch || tagsMatch
      }
      
      return true
    })
    
    // Ordenação
    result.sort((a, b) => {
      let comparison = 0
      if (sortBy === 'title') {
        comparison = (a.title || '').localeCompare(b.title || '')
      } else if (sortBy === 'priority') {
        const priorityOrder = { urgente: 0, alta: 1, normal: 2, baixa: 3 }
        comparison = (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2)
      } else if (sortBy === 'created') {
        comparison = new Date(a.created_at || 0) - new Date(b.created_at || 0)
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })
    
    return result
  }, [cases, statusFilter, debouncedSearch, sortBy, sortOrder])

  // Paginação
  const totalPages = Math.ceil(filteredCases.length / itemsPerPage)
  const paginatedCases = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredCases.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredCases, currentPage, itemsPerPage])

  // Reset página quando filtro muda
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch, statusFilter, sortBy, sortOrder])

  // Contagem por status
  const statusCounts = useMemo(() => {
    const counts = {}
    cases.forEach(c => {
      counts[c.status] = (counts[c.status] || 0) + 1
    })
    return counts
  }, [cases])

  const clearSearch = useCallback(() => {
    setSearchQuery('')
  }, [])

  const toggleSort = useCallback((field) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }, [sortBy])

  const getPriorityBadge = (priority) => {
    const colors = {
      urgente: 'bg-red-100 text-red-800',
      alta: 'bg-orange-100 text-orange-800',
      normal: 'bg-blue-100 text-blue-800',
      baixa: 'bg-gray-100 text-gray-800',
    }
    return colors[priority] || colors.normal
  }

  return (
    <div className="space-y-5 sm:space-y-7">
      {/* Page Header */}
      <PageHeader 
        title="Processos"
        description="Acompanhe todos os processos jurídicos e seus andamentos."
        icon={Briefcase}
        action={
          <button onClick={() => setShowModal(true)} className="btn btn-primary w-full sm:w-auto">
            <Plus size={16} />
            <span>Novo Processo</span>
          </button>
        }
      />

      <SearchFilter
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onClearSearch={clearSearch}
        placeholder="Buscar por título, número, descrição..."
        sortOptions={[
          { value: 'created-desc', label: 'Mais recentes' },
          { value: 'created-asc', label: 'Mais antigos' },
          { value: 'title-asc', label: 'Título A-Z' },
          { value: 'title-desc', label: 'Título Z-A' },
          { value: 'priority-desc', label: 'Maior prioridade' },
          { value: 'priority-asc', label: 'Menor prioridade' }
        ]}
        sortValue={`${sortBy}-${sortOrder}`}
        onSortChange={(value) => {
          const [field, order] = value.split('-')
          setSortBy(field)
          setSortOrder(order)
        }}
        resultsCount={filteredCases.length}
        totalCount={cases.length}
        entityName="processo"
      />

      {/* Status Filter */}
      <div className="card p-3">
        <div className="flex gap-1.5 sm:gap-2 flex-wrap">
          <button
            onClick={() => setStatusFilter(null)}
            className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded text-xs sm:text-sm ${!statusFilter ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}
          >
            Todos {cases.length > 0 && `(${cases.length})`}
          </button>
          {Object.entries(CASE_STATUS).map(([key, value]) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded text-xs sm:text-sm ${statusFilter === value ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}
            >
              {key.replace('_', ' ')} {statusCounts[value] ? `(${statusCounts[value]})` : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Cases List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
        {isLoading ? (
          <>
            <CardLoading />
            <CardLoading />
            <CardLoading />
          </>
        ) : cases.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Briefcase className="mx-auto text-gray-300 mb-3" size={48} />
            <p className="text-gray-500 text-xs sm:text-sm">Nenhum processo cadastrado ainda</p>
            <p className="text-gray-400 text-[10px] sm:text-xs mt-1">Clique em "Novo Processo" para começar</p>
          </div>
        ) : filteredCases.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Search className="mx-auto text-gray-300 mb-3" size={48} />
            <p className="text-gray-500 text-xs sm:text-sm">Nenhum processo encontrado</p>
            <p className="text-gray-400 text-[10px] sm:text-xs mt-1">Tente ajustar os filtros ou a busca</p>
          </div>
        ) : (
          paginatedCases.map((caseItem) => (
            <div key={caseItem.id} className="card p-4 sm:p-5 hover:shadow-xl hover:scale-[1.02] transition-all duration-200 group border border-slate-200">
              <div className="flex justify-between items-start mb-3">
                <Link to={`/cases/${caseItem.id}`} className="flex-1">
                  <h3 className="font-bold text-base sm:text-lg hover:text-primary-600 transition-colors leading-tight group-hover:underline">
                    {caseItem.title}
                  </h3>
                </Link>
                <div className="flex gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                  <Link 
                    to={`/cases/${caseItem.id}`}
                    className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-all"
                    aria-label={`Ver ${caseItem.title}`}
                  >
                    <Eye size={17} />
                  </Link>
                  <button 
                    onClick={() => handleEdit(caseItem)} 
                    className="text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 p-2 rounded-lg transition-all"
                    aria-label={`Editar ${caseItem.title}`}
                  >
                    <Edit size={17} />
                  </button>
                  <button 
                    onClick={() => handleDeleteClick(caseItem)} 
                    className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all"
                    aria-label={`Excluir ${caseItem.title}`}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">{caseItem.description}</p>
              
              {caseItem.case_number && (
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="text-xs text-slate-500 font-medium">Nº {caseItem.case_number}</span>
                </div>
              )}

              {caseItem.client_id && (
                <p className="text-xs text-slate-500 mb-2.5">
                  Cliente: <span className="font-semibold text-slate-700">Cliente #{caseItem.client_id}</span>
                </p>
              )}

              {caseItem.created_at && (
                <p className="text-xs text-slate-400 mb-3">
                  Criado em {new Date(caseItem.created_at).toLocaleDateString('pt-BR')}
                </p>
              )}
              
              <div className="flex gap-2 mb-3 flex-wrap">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusBadge(caseItem.status)}`}>
                  {caseItem.status.replace('_', ' ')}
                </span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getPriorityBadge(caseItem.priority)}`}>
                  {caseItem.priority}
                </span>
              </div>
              
              {caseItem.tags.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                  {caseItem.tags.map((tag, i) => (
                    <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md font-medium hover:bg-slate-200 transition-colors">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {!isLoading && filteredCases.length > itemsPerPage && (
        <div className="card p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Page info */}
            <p className="text-[10px] sm:text-xs text-gray-600">
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredCases.length)} de {filteredCases.length}
            </p>
            
            {/* Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 sm:p-2 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Página anterior"
              >
                <ChevronLeft size={16} />
              </button>
              
              {/* Desktop: page numbers */}
              <div className="hidden sm:flex gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-3 py-1 rounded text-xs ${
                      currentPage === i + 1
                        ? 'bg-primary-600 text-white'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              
              {/* Mobile: current page */}
              <span className="sm:hidden text-[10px] text-gray-600">
                {currentPage} / {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 sm:p-2 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Próxima página"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Criação/Edição */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingCase ? 'Editar Processo' : 'Novo Processo'}
        size="md"
      >
        <div className="max-h-[60vh] sm:max-h-[70vh] overflow-y-auto pr-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1">Título *</label>
              <input 
                {...register('title', { required: 'Título é obrigatório' })} 
                className={`input text-xs sm:text-sm ${errors.title ? 'border-red-500' : ''}`}
              />
              {errors.title && <p className="text-red-500 text-[10px] sm:text-xs mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1">Descrição *</label>
              <textarea 
                {...register('description', { required: 'Descrição é obrigatória' })} 
                className={`input text-xs sm:text-sm ${errors.description ? 'border-red-500' : ''}`} 
                rows="3" 
              />
              {errors.description && <p className="text-red-500 text-[10px] sm:text-xs mt-1">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">Cliente *</label>
                <select 
                  {...register('client_id', { required: 'Cliente é obrigatório' })} 
                  className={`input text-xs sm:text-sm ${errors.client_id ? 'border-red-500' : ''}`}
                >
                  <option value="">Selecione...</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
                {errors.client_id && <p className="text-red-500 text-[10px] sm:text-xs mt-1">{errors.client_id.message}</p>}
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">Número do Processo</label>
                <input {...register('case_number')} className="input text-xs sm:text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">Status</label>
                <select {...register('status')} className="input text-xs sm:text-sm">
                  {Object.entries(CASE_STATUS).map(([key, value]) => (
                    <option key={value} value={value}>
                      {key.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">Prioridade</label>
                <select {...register('priority')} className="input text-xs sm:text-sm">
                  {Object.entries(CASE_PRIORITY).map(([key, value]) => (
                    <option key={value} value={value}>
                      {key}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1">Fórum/Tribunal</label>
              <input {...register('court')} className="input text-xs sm:text-sm" />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1">Tags (separadas por vírgula)</label>
              <input {...register('tags')} className="input text-xs sm:text-sm" placeholder="trabalhista, urgente, etc" />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end pt-4 border-t">
              <button 
                type="button" 
                onClick={handleCloseModal} 
                className="btn btn-secondary text-xs sm:text-sm flex-1 sm:flex-initial"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn btn-primary text-xs sm:text-sm flex items-center justify-center gap-2 flex-1 sm:flex-initial"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) && <LoadingSpinner size="sm" />}
                {editingCase ? 'Atualizar' : 'Criar'}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Diálogo de Confirmação de Exclusão */}
      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirm({ open: false, caseItem: null })}
        title="Excluir Processo"
        message={`Tem certeza que deseja excluir o processo "${deleteConfirm.caseItem?.title}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
