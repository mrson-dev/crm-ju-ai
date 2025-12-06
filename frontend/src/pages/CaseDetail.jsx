import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { caseService, clientService, documentService } from '@/services/crmService'
import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  FileText, 
  Upload, 
  Calendar,
  User,
  Tag,
  AlertTriangle,
  CheckCircle,
  Clock,
  Briefcase,
  MessageSquare,
  Paperclip,
  MoreVertical,
  Download,
  Eye
} from 'lucide-react'
import { Modal, ConfirmDialog, LoadingSpinner, useToast } from '@/components/common'

const STATUS_CONFIG = {
  novo: { label: 'Novo', color: 'bg-blue-100 text-blue-800', icon: Briefcase },
  em_andamento: { label: 'Em Andamento', color: 'bg-amber-100 text-amber-800', icon: Clock },
  aguardando: { label: 'Aguardando', color: 'bg-orange-100 text-orange-800', icon: Clock },
  concluido: { label: 'Concluído', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
  arquivado: { label: 'Arquivado', color: 'bg-gray-100 text-gray-800', icon: FileText },
}

const PRIORITY_CONFIG = {
  baixa: { label: 'Baixa', color: 'bg-gray-100 text-gray-700' },
  media: { label: 'Média', color: 'bg-blue-100 text-blue-700' },
  alta: { label: 'Alta', color: 'bg-orange-100 text-orange-700' },
  urgente: { label: 'Urgente', color: 'bg-red-100 text-red-700' },
}

export default function CaseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('overview')
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const { data: caseData, isLoading, isError } = useQuery({
    queryKey: ['case', id],
    queryFn: () => caseService.getById(id),
    enabled: !!id,
  })

  const { data: client } = useQuery({
    queryKey: ['client', caseData?.client_id],
    queryFn: () => clientService.getById(caseData.client_id),
    enabled: !!caseData?.client_id,
  })

  const deleteMutation = useMutation({
    mutationFn: () => caseService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['cases'])
      toast.success('Processo excluído com sucesso!')
      navigate('/cases')
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao excluir processo')
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (isError || !caseData) {
    return (
      <div className="text-center py-12">
        <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Processo não encontrado</h2>
        <p className="text-gray-600 mb-4">O processo solicitado não existe ou foi removido.</p>
        <Link to="/cases" className="btn btn-primary">
          Voltar para Processos
        </Link>
      </div>
    )
  }

  const status = STATUS_CONFIG[caseData.status] || STATUS_CONFIG.novo
  const priority = PRIORITY_CONFIG[caseData.priority] || PRIORITY_CONFIG.media
  const StatusIcon = status.icon

  // Timeline de eventos simulada
  const timeline = [
    {
      id: 1,
      type: 'created',
      title: 'Processo criado',
      description: 'Processo cadastrado no sistema',
      date: caseData.created_at,
      icon: Briefcase,
      iconColor: 'text-blue-500',
      iconBg: 'bg-blue-100',
    },
    ...(caseData.status !== 'novo' ? [{
      id: 2,
      type: 'status_change',
      title: 'Status atualizado',
      description: `Status alterado para "${status.label}"`,
      date: caseData.updated_at,
      icon: Clock,
      iconColor: 'text-amber-500',
      iconBg: 'bg-amber-100',
    }] : []),
  ]

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: Eye },
    { id: 'documents', label: 'Documentos', icon: FileText },
    { id: 'timeline', label: 'Histórico', icon: Clock },
    { id: 'notes', label: 'Anotações', icon: MessageSquare },
  ]

  return (
    <div className="space-y-5 sm:space-y-7">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/cases')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{caseData.title}</h1>
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
              <StatusIcon size={14} />
              {status.label}
            </span>
          </div>
          <p className="text-gray-600 mt-1">
            {caseData.case_number || 'Sem número de processo'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/cases?edit=${id}`)}
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

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <User size={24} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Cliente</p>
            <p className="font-medium">{client?.name || 'Carregando...'}</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className={`p-3 rounded-lg ${priority.color}`}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-600">Prioridade</p>
            <p className="font-medium">{priority.label}</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="p-3 bg-purple-100 rounded-lg">
            <Calendar size={24} className="text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Criado em</p>
            <p className="font-medium">
              {caseData.created_at 
                ? format(parseISO(caseData.created_at), "dd/MM/yyyy", { locale: ptBR })
                : '-'
              }
            </p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="p-3 bg-emerald-100 rounded-lg">
            <Tag size={24} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Tags</p>
            <p className="font-medium">
              {caseData.tags?.length > 0 ? caseData.tags.join(', ') : 'Nenhuma'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px]">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Descrição</h3>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {caseData.description || 'Nenhuma descrição fornecida.'}
                </p>
              </div>

              {caseData.tags?.length > 0 && (
                <div className="card">
                  <h3 className="text-lg font-semibold mb-4">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {caseData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Informações do Cliente</h3>
                {client ? (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Nome</p>
                      <p className="font-medium">{client.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{client.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Telefone</p>
                      <p className="font-medium">{client.phone}</p>
                    </div>
                    <Link
                      to={`/clients?id=${client.id}`}
                      className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1 mt-4"
                    >
                      Ver perfil completo <ArrowLeft size={14} className="rotate-180" />
                    </Link>
                  </div>
                ) : (
                  <p className="text-gray-500">Carregando informações...</p>
                )}
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Datas</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Criado</p>
                    <p className="font-medium">
                      {caseData.created_at 
                        ? formatDistanceToNow(parseISO(caseData.created_at), { addSuffix: true, locale: ptBR })
                        : '-'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Última atualização</p>
                    <p className="font-medium">
                      {caseData.updated_at 
                        ? formatDistanceToNow(parseISO(caseData.updated_at), { addSuffix: true, locale: ptBR })
                        : '-'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Documentos</h3>
              <button className="btn btn-primary flex items-center gap-2">
                <Upload size={18} />
                Enviar Documento
              </button>
            </div>
            <div className="text-center py-12 text-gray-500">
              <Paperclip size={48} className="mx-auto mb-4 text-gray-300" />
              <p>Nenhum documento vinculado a este processo</p>
              <p className="text-sm mt-1">Envie documentos para manter tudo organizado</p>
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="card">
            <h3 className="text-lg font-semibold mb-6">Histórico de Eventos</h3>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
              <div className="space-y-6">
                {timeline.map((event) => {
                  const Icon = event.icon
                  return (
                    <div key={event.id} className="relative flex items-start gap-4 pl-2">
                      <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full ${event.iconBg}`}>
                        <Icon size={16} className={event.iconColor} />
                      </div>
                      <div className="flex-1 min-w-0 pb-6">
                        <p className="font-medium text-gray-900">{event.title}</p>
                        <p className="text-sm text-gray-600">{event.description}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {event.date 
                            ? format(parseISO(event.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                            : 'Data não disponível'
                          }
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Anotações</h3>
              <button className="btn btn-primary flex items-center gap-2">
                <MessageSquare size={18} />
                Nova Anotação
              </button>
            </div>
            <div className="text-center py-12 text-gray-500">
              <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
              <p>Nenhuma anotação ainda</p>
              <p className="text-sm mt-1">Adicione notas para acompanhar o processo</p>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Excluir Processo"
        message={`Tem certeza que deseja excluir o processo "${caseData.title}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        confirmVariant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
