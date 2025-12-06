import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { templateService } from '@/services/templateService'
import { Plus, FileText, Edit, Trash2, Copy, Eye } from 'lucide-react'
import WYSIWYGEditor from '@/components/WYSIWYGEditor'
import { Modal, ConfirmDialog, LoadingSpinner, CardLoading, useToast, PageHeader, SearchFilter } from '@/components/common'
import { sanitizeHTML } from '@/utils/sanitize'

export default function Templates() {
  const [showModal, setShowModal] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [previewTemplate, setPreviewTemplate] = useState(null)
  const [categoryFilter, setCategoryFilter] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, template: null })
  const [formData, setFormData] = useState({
    title: '',
    category: 'contrato',
    description: '',
    content: '',
    is_public: false
  })
  
  const queryClient = useQueryClient()
  const toast = useToast()

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates', categoryFilter],
    queryFn: () => templateService.getAll(categoryFilter),
  })

  const { data: placeholders = {} } = useQuery({
    queryKey: ['placeholders'],
    queryFn: templateService.getPlaceholders,
  })

  const createMutation = useMutation({
    mutationFn: templateService.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['templates'])
      handleCloseModal()
      toast.success('Template criado com sucesso!')
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao criar template')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => templateService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['templates'])
      handleCloseModal()
      toast.success('Template atualizado com sucesso!')
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao atualizar template')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: templateService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['templates'])
      setDeleteConfirm({ open: false, template: null })
      toast.success('Template excluído com sucesso!')
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao excluir template')
      setDeleteConfirm({ open: false, template: null })
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleEdit = (template) => {
    setEditingTemplate(template)
    setFormData({
      title: template.title,
      category: template.category,
      description: template.description || '',
      content: template.content,
      is_public: template.is_public || false
    })
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingTemplate(null)
    setFormData({
      title: '',
      category: 'contrato',
      description: '',
      content: '',
      is_public: false
    })
  }

  const handlePreview = (template) => {
    setPreviewTemplate(template)
    setShowPreview(true)
  }

  const handleDeleteClick = (template) => {
    setDeleteConfirm({ open: true, template })
  }

  const handleConfirmDelete = () => {
    if (deleteConfirm.template) {
      deleteMutation.mutate(deleteConfirm.template.id)
    }
  }

  const handleGenerateDocument = (template) => {
    toast.info('Em breve: Gerar documento a partir deste template')
  }

  const categories = {
    contrato: 'Contrato',
    procuracao: 'Procuração',
    peticao: 'Petição',
    ata: 'Ata',
    declaracao: 'Declaração',
    outros: 'Outros'
  }

  const getCategoryBadge = (category) => {
    const colors = {
      contrato: 'bg-blue-100 text-blue-800',
      procuracao: 'bg-purple-100 text-purple-800',
      peticao: 'bg-green-100 text-green-800',
      ata: 'bg-yellow-100 text-yellow-800',
      declaracao: 'bg-orange-100 text-orange-800',
      outros: 'bg-gray-100 text-gray-800',
    }
    return colors[category] || colors.outros
  }

  return (
    <div className="space-y-5 sm:space-y-7">
      {/* Page Header */}
      <PageHeader 
        title="Templates"
        description="Crie e gerencie modelos para agilizar a produção de documentos."
        icon={FileText}
        action={
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary w-full sm:w-auto"
          >
            <Plus size={16} />
            <span>Novo Template</span>
          </button>
        }
      />

      <SearchFilter
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onClearSearch={() => setSearchQuery('')}
        placeholder="Buscar templates..."
        filterOptions={[
          {
            placeholder: 'Categoria',
            value: categoryFilter || '',
            onChange: (value) => setCategoryFilter(value || null),
            options: Object.entries(categories).map(([key, label]) => ({
              value: key,
              label
            }))
          }
        ]}
        resultsCount={templates.filter(t => 
          !searchQuery || 
          t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.description?.toLowerCase().includes(searchQuery.toLowerCase())
        ).length}
        totalCount={templates.length}
        entityName="template"
      />

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
        {isLoading ? (
          <>
            <CardLoading />
            <CardLoading />
            <CardLoading />
          </>
        ) : templates.filter(t => 
          !searchQuery || 
          t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.description?.toLowerCase().includes(searchQuery.toLowerCase())
        ).length === 0 ? (
          <div className="col-span-full text-center py-12">
            <FileText className="mx-auto text-gray-300 mb-3" size={48} />
            <p className="text-gray-500 text-xs sm:text-sm">
              {searchQuery ? `Nenhum template encontrado para "${searchQuery}"` : 'Nenhum template cadastrado ainda'}
            </p>
            <p className="text-gray-400 text-[10px] sm:text-xs mt-1">
              {searchQuery ? 'Tente buscar com outros termos' : 'Clique em "Novo Template" para começar'}
            </p>
          </div>
        ) : (
          templates
            .filter(t => 
              !searchQuery || 
              t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              t.description?.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map(template => (
            <div key={template.id} className="card p-5 sm:p-6 hover:shadow-xl hover:scale-[1.01] transition-all duration-200 group border border-slate-200">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 rounded-xl">
                    <FileText size={20} className="text-blue-600" />
                  </div>
                  <h3 className="font-bold text-base sm:text-lg leading-tight text-slate-900 group-hover:text-blue-600 transition-colors">{template.title}</h3>
                </div>
                {template.is_public && (
                  <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full font-semibold flex-shrink-0">
                    Público
                  </span>
                )}
              </div>

              {template.description && (
                <p className="text-sm text-slate-600 mb-3 line-clamp-2 leading-relaxed">
                  {template.description}
                </p>
              )}

              <div className="flex items-center gap-2.5 mb-4">
                <span className={`text-xs px-3 py-1 rounded-full font-semibold ${getCategoryBadge(template.category)}`}>
                  {categories[template.category]}
                </span>
                <span className="text-xs text-slate-500 font-medium bg-slate-100 px-3 py-1 rounded-full">
                  Usado {template.usage_count || 0}x
                </span>
              </div>

              {template.placeholders && template.placeholders.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-slate-600 mb-2 font-medium">Placeholders:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {template.placeholders.slice(0, 3).map((ph, i) => (
                      <span key={i} className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-medium">
                        {ph}
                      </span>
                    ))}
                    {template.placeholders.length > 3 && (
                      <span className="text-xs text-slate-500 px-2 py-1">
                        +{template.placeholders.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => handlePreview(template)}
                  className="flex-1 btn btn-secondary flex items-center justify-center gap-2 text-sm py-2.5 hover:bg-slate-100"
                  title="Visualizar"
                >
                  <Eye size={16} />
                  <span>Ver</span>
                </button>
                <button
                  onClick={() => handleEdit(template)}
                  className="btn bg-blue-600 text-white hover:bg-blue-700 p-2.5 hover:scale-110 transition-all"
                  title="Editar"
                  aria-label={`Editar ${template.title}`}
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleGenerateDocument(template)}
                  className="btn bg-green-600 text-white hover:bg-green-700 p-2.5 hover:scale-110 transition-all"
                  title="Gerar Documento"
                  aria-label={`Gerar documento a partir de ${template.title}`}
                >
                  <Copy size={16} />
                </button>
                <button
                  onClick={() => handleDeleteClick(template)}
                  className="btn bg-red-600 text-white hover:bg-red-700 p-2.5 hover:scale-110 transition-all"
                  title="Deletar"
                  aria-label={`Excluir ${template.title}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingTemplate ? 'Editar Template' : 'Novo Template'}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1">Título *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input text-xs sm:text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1">Categoria</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input text-xs sm:text-sm"
              >
                {Object.entries(categories).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium mb-1">Descrição (opcional)</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input text-xs sm:text-sm"
              placeholder="Breve descrição do template"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium mb-1">Conteúdo *</label>
            <WYSIWYGEditor
              content={formData.content}
              onChange={(content) => setFormData({ ...formData, content })}
              placeholders={placeholders}
            />
            <p className="text-[10px] sm:text-xs text-gray-500 mt-2">
              Use placeholders como {`{{cliente.nome}}`} para inserir dados automaticamente
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_public"
              checked={formData.is_public}
              onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="is_public" className="text-xs sm:text-sm">
              Tornar template público (outros usuários poderão usar)
            </label>
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
              {editingTemplate ? 'Atualizar' : 'Criar Template'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreview && previewTemplate !== null}
        onClose={() => {
          setShowPreview(false)
          setPreviewTemplate(null)
        }}
        title={previewTemplate?.title || 'Visualizar Template'}
        size="lg"
      >
        <div
          className="prose max-w-none border rounded p-6"
          dangerouslySetInnerHTML={{ __html: sanitizeHTML(previewTemplate?.content || '') }}
        />
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => {
              setShowPreview(false)
              setPreviewTemplate(null)
            }}
            className="btn btn-secondary"
          >
            Fechar
          </button>
        </div>
      </Modal>

      {/* Diálogo de Confirmação de Exclusão */}
      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirm({ open: false, template: null })}
        title="Excluir Template"
        message={`Tem certeza que deseja excluir o template "${deleteConfirm.template?.title}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
