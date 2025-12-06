import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clientService, caseService } from '@/services/crmService'
import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  FileText, 
  Phone, 
  Mail,
  MapPin,
  Calendar,
  User,
  Building,
  Briefcase,
  AlertTriangle,
  Plus
} from 'lucide-react'
import { Modal, ConfirmDialog, LoadingSpinner, useToast } from '@/components/common'

const CLIENT_TYPE_CONFIG = {
  pessoa_fisica: { label: 'Pessoa Física', icon: User, color: 'bg-blue-100 text-blue-800' },
  pessoa_juridica: { label: 'Pessoa Jurídica', icon: Building, color: 'bg-purple-100 text-purple-800' },
}

export default function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const { data: client, isLoading, isError } = useQuery({
    queryKey: ['client', id],
    queryFn: () => clientService.getById(id),
    enabled: !!id,
  })

  const { data: clientCases = [] } = useQuery({
    queryKey: ['cases', 'client', id],
    queryFn: () => caseService.getByClient(id),
    enabled: !!id,
  })

  const deleteMutation = useMutation({
    mutationFn: () => clientService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['clients'])
      toast.success('Cliente excluído com sucesso!')
      navigate('/clients')
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao excluir cliente')
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (isError || !client) {
    return (
      <div className="text-center py-12">
        <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Cliente não encontrado</h2>
        <p className="text-gray-600 mb-4">O cliente solicitado não existe ou foi removido.</p>
        <Link to="/clients" className="btn btn-primary">
          Voltar para Clientes
        </Link>
      </div>
    )
  }

  const clientType = CLIENT_TYPE_CONFIG[client.client_type] || CLIENT_TYPE_CONFIG.pessoa_fisica
  const TypeIcon = clientType.icon

  const activeCases = clientCases.filter(c => c.status === 'em_andamento').length
  const totalCases = clientCases.length

  return (
    <div className="space-y-5 sm:space-y-7">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/clients')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${clientType.color}`}>
              <TypeIcon size={14} />
              {clientType.label}
            </span>
          </div>
          <p className="text-gray-600 mt-1">{client.cpf_cnpj}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/clients?edit=${id}`)}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Edit size={18} />
            Editar
          </button>
          <button
            onClick={() => setDeleteConfirm(true)}
            className="btn bg-red-100 text-red-700 hover:bg-red-200 flex items-center gap-2"
          >
            <Trash2 size={18} />
            Excluir
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Briefcase size={24} className="text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{totalCases}</p>
            <p className="text-sm text-gray-600">Total de Processos</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="p-3 bg-amber-100 rounded-lg">
            <Briefcase size={24} className="text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{activeCases}</p>
            <p className="text-sm text-gray-600">Processos Ativos</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="p-3 bg-emerald-100 rounded-lg">
            <Calendar size={24} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-medium">
              {client.created_at 
                ? format(parseISO(client.created_at), "dd/MM/yyyy", { locale: ptBR })
                : '-'
              }
            </p>
            <p className="text-sm text-gray-600">Cliente desde</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Info */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Informações de Contato</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Mail size={18} className="text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <a href={`mailto:${client.email}`} className="text-primary-600 hover:text-primary-700">
                  {client.email}
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Phone size={18} className="text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Telefone</p>
                <a href={`tel:${client.phone}`} className="text-primary-600 hover:text-primary-700">
                  {client.phone}
                </a>
              </div>
            </div>

            {client.address && (
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <MapPin size={18} className="text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Endereço</p>
                  <p className="text-gray-900">{client.address}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Observações</h3>
          {client.notes ? (
            <p className="text-gray-700 whitespace-pre-wrap">{client.notes}</p>
          ) : (
            <p className="text-gray-500 italic">Nenhuma observação registrada</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Ações Rápidas</h3>
          <div className="space-y-2">
            <Link
              to={`/cases?client=${id}`}
              className="w-full btn btn-primary flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Novo Processo
            </Link>
            <Link
              to={`/templates`}
              className="w-full btn btn-secondary flex items-center justify-center gap-2"
            >
              <FileText size={18} />
              Gerar Documento
            </Link>
          </div>
        </div>
      </div>

      {/* Cases List */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Processos do Cliente</h3>
          <Link
            to={`/cases?client=${id}`}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            Novo Processo
          </Link>
        </div>

        {clientCases.length === 0 ? (
          <div className="text-center py-8">
            <Briefcase size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Nenhum processo vinculado a este cliente</p>
            <Link
              to={`/cases?client=${id}`}
              className="text-primary-600 hover:text-primary-700 text-sm mt-2 inline-block"
            >
              Criar primeiro processo
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {clientCases.map((caseItem) => {
              const statusColors = {
                novo: 'border-blue-500',
                em_andamento: 'border-amber-500',
                aguardando: 'border-orange-500',
                concluido: 'border-emerald-500',
                arquivado: 'border-gray-500',
              }
              const statusLabels = {
                novo: 'Novo',
                em_andamento: 'Em Andamento',
                aguardando: 'Aguardando',
                concluido: 'Concluído',
                arquivado: 'Arquivado',
              }
              return (
                <Link
                  key={caseItem.id}
                  to={`/cases/${caseItem.id}`}
                  className={`block border-l-4 ${statusColors[caseItem.status] || statusColors.novo} bg-gray-50 rounded-r-lg p-4 hover:shadow-md transition-shadow`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{caseItem.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {caseItem.case_number || 'Sem número'}
                      </p>
                    </div>
                    <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                      {statusLabels[caseItem.status] || caseItem.status}
                    </span>
                  </div>
                  {caseItem.created_at && (
                    <p className="text-xs text-gray-400 mt-2">
                      Criado {formatDistanceToNow(parseISO(caseItem.created_at), { addSuffix: true, locale: ptBR })}
                    </p>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Excluir Cliente"
        message={`Tem certeza que deseja excluir o cliente "${client.name}"? Esta ação não pode ser desfeita e todos os processos vinculados serão desassociados.`}
        confirmText="Excluir"
        confirmVariant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
