import { useState, useMemo, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import { clientService } from '@/services/crmService'
import { Plus, Search, Edit, Trash2, Eye, UserPlus, Users, ArrowUpDown, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { ConfirmDialog, TableLoading, useToast, PageHeader, SearchFilter } from '@/components/common'

// Hook para debounce
function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value)
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  
  return debouncedValue
}

export default function Clients() {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('name') // 'name' | 'email' | 'created'
  const [sortOrder, setSortOrder] = useState('asc') // 'asc' | 'desc'
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, client: null })
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15 // Itens por página
  
  const debouncedSearch = useDebounce(searchQuery, 300)
  
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const toast = useToast()

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientService.getAll(),
  })

  const deleteMutation = useMutation({
    mutationFn: clientService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['clients'])
      setDeleteConfirm({ open: false, client: null })
      toast.success('Cliente excluído com sucesso!')
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao excluir cliente')
      setDeleteConfirm({ open: false, client: null })
    },
  })

  const handleDeleteClick = (client) => {
    setDeleteConfirm({ open: true, client })
  }

  const handleConfirmDelete = () => {
    if (deleteConfirm.client) {
      deleteMutation.mutate(deleteConfirm.client.id)
    }
  }

  // Filtro com busca normalizada (case-insensitive para todos os campos)
  const filteredClients = useMemo(() => {
    const query = debouncedSearch.toLowerCase().trim()
    
    let result = clients.filter(client => {
      if (!query) return true
      
      const nameMatch = client.name?.toLowerCase().includes(query)
      const emailMatch = client.email?.toLowerCase().includes(query)
      const cpfMatch = client.cpf_cnpj?.replace(/\D/g, '').includes(query.replace(/\D/g, ''))
      const phoneMatch = client.phone?.replace(/\D/g, '').includes(query.replace(/\D/g, ''))
      
      return nameMatch || emailMatch || cpfMatch || phoneMatch
    })
    
    // Ordenação
    result.sort((a, b) => {
      let comparison = 0
      if (sortBy === 'name') {
        comparison = (a.name || '').localeCompare(b.name || '')
      } else if (sortBy === 'email') {
        comparison = (a.email || '').localeCompare(b.email || '')
      } else if (sortBy === 'created') {
        comparison = new Date(a.created_at || 0) - new Date(b.created_at || 0)
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })
    
    return result
  }, [clients, debouncedSearch, sortBy, sortOrder])

  // Paginação
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage)
  const paginatedClients = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredClients.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredClients, currentPage, itemsPerPage])

  // Reset página quando filtro muda
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch, sortBy, sortOrder])

  const toggleSort = useCallback((field) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }, [sortBy])

  const clearSearch = useCallback(() => {
    setSearchQuery('')
  }, [])

  return (
    <div className="space-y-5 sm:space-y-7">
      {/* Page Header */}
      <PageHeader 
        title="Clientes"
        description="Gerencie sua carteira de clientes e informações de contato."
        icon={Users}
        action={
          <button 
            onClick={() => navigate('/clients/new')} 
            className="btn btn-primary w-full sm:w-auto"
          >
            <UserPlus size={16} className="sm:w-[18px] sm:h-[18px]" />
            <span className="text-sm">Novo Cliente</span>
          </button>
        }
      />

      <SearchFilter
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onClearSearch={clearSearch}
        placeholder="Buscar nome, email, CPF..."
        sortOptions={[
          { value: 'name-asc', label: 'Nome A-Z' },
          { value: 'name-desc', label: 'Nome Z-A' },
          { value: 'email-asc', label: 'Email A-Z' },
          { value: 'created-desc', label: 'Mais recentes' },
          { value: 'created-asc', label: 'Mais antigos' }
        ]}
        sortValue={`${sortBy}-${sortOrder}`}
        onSortChange={(value) => {
          const [field, order] = value.split('-')
          setSortBy(field)
          setSortOrder(order)
        }}
        resultsCount={filteredClients.length}
        totalCount={clients.length}
        entityName="cliente"
      />

      {/* Clients List */}
      <div className="card">
        {isLoading ? (
          <TableLoading columns={5} rows={5} />
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-8 sm:py-12 px-4">
            {debouncedSearch ? (
              // Estado: busca sem resultados
              <>
                <Search className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-slate-300 mb-3" />
                <h3 className="text-sm sm:text-lg font-medium text-slate-900 mb-1">
                  Nenhum resultado para "{debouncedSearch}"
                </h3>
                <p className="text-slate-500 text-xs sm:text-sm mb-4">
                  Tente buscar por outro termo ou limpe a busca.
                </p>
                <button 
                  onClick={clearSearch}
                  className="btn btn-secondary text-sm"
                >
                  Limpar busca
                </button>
              </>
            ) : (
              // Estado: nenhum cliente cadastrado
              <>
                <UserPlus className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-slate-300 mb-3" />
                <h3 className="text-sm sm:text-lg font-medium text-slate-900 mb-1">
                  Nenhum cliente cadastrado
                </h3>
                <p className="text-slate-500 text-xs sm:text-sm mb-4">
                  Comece cadastrando seu primeiro cliente.
                </p>
                <button 
                  onClick={() => navigate('/clients/new')} 
                  className="btn btn-primary text-sm"
                >
                  <UserPlus size={16} />
                  Cadastrar Cliente
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
                    <th 
                      className="text-left py-4 px-6 font-semibold text-slate-700 text-sm cursor-pointer hover:bg-slate-200/50 transition-all group"
                      onClick={() => toggleSort('name')}
                    >
                      <span className="flex items-center gap-2">
                        Nome
                        <ArrowUpDown size={14} className={`transition-transform ${sortBy === 'name' ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'} ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                      </span>
                    </th>
                    <th 
                      className="text-left py-4 px-6 font-semibold text-slate-700 text-sm cursor-pointer hover:bg-slate-200/50 transition-all group"
                      onClick={() => toggleSort('email')}
                    >
                      <span className="flex items-center gap-2">
                        Email
                        <ArrowUpDown size={14} className={`transition-transform ${sortBy === 'email' ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'} ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                      </span>
                    </th>
                    <th className="text-left py-4 px-6 font-semibold text-slate-700 text-sm">Telefone</th>
                    <th className="text-left py-4 px-6 font-semibold text-slate-700 text-sm">CPF/CNPJ</th>
                    <th className="text-center py-4 px-6 font-semibold text-slate-700 text-sm w-32">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedClients.map((client) => (
                    <tr key={client.id} className="hover:bg-blue-50/30 transition-all duration-150 group">
                      <td className="py-4 px-6">
                        <Link 
                          to={`/clients/${client.id}`}
                          className="font-medium text-slate-900 hover:text-blue-600 transition-colors inline-flex items-center gap-2 group-hover:underline"
                        >
                          {client.name}
                        </Link>
                        {client.is_minor && (
                          <span className="ml-2 px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
                            Menor
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-slate-600">{client.email || <span className="text-slate-400">-</span>}</td>
                      <td className="py-4 px-6 text-slate-600">{client.phone || <span className="text-slate-400">-</span>}</td>
                      <td className="py-4 px-6 text-slate-600 font-mono text-sm">{client.cpf_cnpj || <span className="text-slate-400">-</span>}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-1.5">
                          <Link
                            to={`/clients/${client.id}`}
                            className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-all duration-150 hover:scale-110"
                            title="Visualizar"
                            aria-label={`Visualizar ${client.name}`}
                          >
                            <Eye size={16} />
                          </Link>
                          <Link
                            to={`/clients/${client.id}/edit`}
                            className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-100 rounded-lg transition-all duration-150 hover:scale-110"
                            title="Editar"
                            aria-label={`Editar ${client.name}`}
                          >
                            <Edit size={16} />
                          </Link>
                          <button
                            onClick={() => handleDeleteClick(client)}
                            className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-all duration-150 hover:scale-110"
                            title="Excluir"
                            aria-label={`Excluir ${client.name}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden divide-y divide-slate-100">
              {paginatedClients.map((client) => (
                <div key={client.id} className="p-2.5 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <Link 
                        to={`/clients/${client.id}`}
                        className="font-medium text-slate-900 hover:text-blue-600 transition-colors text-sm"
                      >
                        {client.name}
                      </Link>
                      {client.is_minor && (
                        <span className="ml-2 px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] rounded-full">
                          Menor
                        </span>
                      )}
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{client.email || 'Sem email'}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-[11px] text-slate-500">
                        {client.phone && <span>{client.phone}</span>}
                        {client.cpf_cnpj && <span className="font-mono">{client.cpf_cnpj}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <Link
                        to={`/clients/${client.id}`}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        aria-label={`Visualizar ${client.name}`}
                      >
                        <Eye size={16} />
                      </Link>
                      <Link
                        to={`/clients/${client.id}/edit`}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        aria-label={`Editar ${client.name}`}
                      >
                        <Edit size={16} />
                      </Link>
                      <button
                        onClick={() => handleDeleteClick(client)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        aria-label={`Excluir ${client.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-3 py-2.5 sm:px-4 sm:py-3 border-t border-slate-100 bg-slate-50/50">
                <p className="text-[10px] sm:text-xs text-slate-500">
                  Página {currentPage} de {totalPages}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 sm:p-2 rounded-lg text-slate-500 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label="Página anterior"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  
                  {/* Números de página - Desktop */}
                  <div className="hidden sm:flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                            currentPage === pageNum
                              ? 'bg-primary-600 text-white'
                              : 'text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                  </div>
                  
                  {/* Mobile - apenas atual/total */}
                  <span className="sm:hidden text-xs text-slate-600 font-medium px-2">
                    {currentPage}/{totalPages}
                  </span>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 sm:p-2 rounded-lg text-slate-500 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label="Próxima página"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Diálogo de Confirmação de Exclusão */}
      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirm({ open: false, client: null })}
        title="Excluir Cliente"
        message={`Tem certeza que deseja excluir o cliente "${deleteConfirm.client?.name}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
