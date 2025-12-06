/**
 * Página de Automação de Documentos
 * 
 * Sistema completo de geração de documentos jurídicos com:
 * - Geração a partir de templates
 * - Assembly de múltiplos templates
 * - Auto-preenchimento inteligente
 * - Editor WYSIWYG
 * - Versionamento
 * - Sugestões de conteúdo
 */
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Copy,
  Download,
  Eye,
  Layers,
  Wand2,
  Clock,
  CheckCircle,
  FileCheck,
  Send,
  History,
  Lightbulb,
  ChevronRight,
  X,
  Save,
  RefreshCw,
  Briefcase,
  User,
  Calendar,
  Tag,
  MoreVertical,
  FileCode,
  PenTool
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import documentAutomationService from '../services/documentAutomationService';
import { templateService } from '../services/templateService';
import { caseService, clientService } from '../services/crmService';
import { LoadingSpinner, Modal, StandaloneToast } from '../components/common';
import WYSIWYGEditor from '../components/WYSIWYGEditor';
import logger from '../utils/logger';
import { sanitizeHTML } from '../utils/sanitize';
import PageHeader from '../components/common/PageHeader';
import SearchFilter from '../components/common/SearchFilter';

// Status de documentos
const DOCUMENT_STATUS = {
  draft: { label: 'Rascunho', color: 'bg-gray-100 text-gray-700', icon: Edit2 },
  review: { label: 'Em Revisão', color: 'bg-yellow-100 text-yellow-700', icon: Eye },
  approved: { label: 'Aprovado', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  signed: { label: 'Assinado', color: 'bg-blue-100 text-blue-700', icon: FileCheck }
};

// Categorias de documentos
const DOCUMENT_CATEGORIES = {
  peticao: { label: 'Petições', icon: '📜', color: 'bg-blue-50 text-blue-700' },
  contrato: { label: 'Contratos', icon: '📋', color: 'bg-green-50 text-green-700' },
  procuracao: { label: 'Procurações', icon: '✍️', color: 'bg-purple-50 text-purple-700' },
  recurso: { label: 'Recursos', icon: '⚖️', color: 'bg-red-50 text-red-700' },
  parecer: { label: 'Pareceres', icon: '📝', color: 'bg-orange-50 text-orange-700' },
  notificacao: { label: 'Notificações', icon: '📨', color: 'bg-cyan-50 text-cyan-700' },
  acordo: { label: 'Acordos', icon: '🤝', color: 'bg-teal-50 text-teal-700' },
  outro: { label: 'Outros', icon: '📄', color: 'bg-gray-50 text-gray-700' }
};

// Card de Documento
function DocumentCard({ document, onView, onEdit, onDelete, onDuplicate }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const category = DOCUMENT_CATEGORIES[document.category] || DOCUMENT_CATEGORIES.outro;
  const status = DOCUMENT_STATUS[document.status] || DOCUMENT_STATUS.draft;
  const StatusIcon = status.icon;
  
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-xl hover:scale-[1.01] transition-all duration-200 group">
      <div className="flex items-start justify-between">
        <div className="flex gap-4 flex-1">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl shadow-sm ${category.color}`}>
            {category.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900 text-base truncate group-hover:text-blue-600 transition-colors group-hover:underline">
              {document.title}
            </h3>
            <div className="flex flex-wrap gap-2 mt-2.5">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                <StatusIcon className="w-3.5 h-3.5" />
                {status.label}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${category.color}`}>
                {category.label}
              </span>
              {document.version > 1 && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                  v{document.version}
                </span>
              )}
            </div>
            <div className="flex gap-5 mt-3 text-xs text-slate-500">
              {document.client_name && (
                <span className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg">
                  <User className="w-3.5 h-3.5" />
                  {document.client_name}
                </span>
              )}
              {document.case_title && (
                <span className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg">
                  <Briefcase className="w-3.5 h-3.5" />
                  {document.case_title}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {format(
                  typeof document.updated_at === 'string' 
                    ? parseISO(document.updated_at) 
                    : document.updated_at?.toDate?.() || new Date(),
                  "dd/MM/yyyy",
                  { locale: ptBR }
                )}
              </span>
            </div>
          </div>
        </div>
        
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2.5 hover:bg-slate-100 rounded-lg transition-all opacity-60 group-hover:opacity-100 hover:scale-110\"
          >
            <MoreVertical className="w-5 h-5 text-slate-400" />
          </button>
          
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-20">
                <button
                  onClick={() => { onView(document); setMenuOpen(false); }}
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2.5 transition-colors font-medium"
                >
                  <Eye className="w-4 h-4" />
                  Visualizar
                </button>
                <button
                  onClick={() => { onEdit(document); setMenuOpen(false); }}
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-emerald-50 hover:text-emerald-600 flex items-center gap-2.5 transition-colors font-medium"
                >
                  <Edit2 className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={() => { onDuplicate(document); setMenuOpen(false); }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Duplicar
                </button>
                <hr className="my-2" />
                <button
                  onClick={() => { onDelete(document); setMenuOpen(false); }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Modal de Geração de Documento
function GenerateDocumentModal({ isOpen, onClose, onGenerate, templates, cases, clients }) {
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedCase, setSelectedCase] = useState('');
  const [title, setTitle] = useState('');
  const [placeholders, setPlaceholders] = useState({});
  const [autoFillData, setAutoFillData] = useState({});
  const [loading, setLoading] = useState(false);
  
  // Busca dados de auto-preenchimento
  useEffect(() => {
    async function fetchAutoFill() {
      if (selectedClient || selectedCase) {
        try {
          const response = await documentAutomationService.getAutoFillData(
            selectedClient || null,
            selectedCase || null
          );
          setAutoFillData(response.data || {});
        } catch (error) {
          logger.error('Erro ao buscar auto-fill', error, { selectedClient, selectedCase });
        }
      }
    }
    fetchAutoFill();
  }, [selectedClient, selectedCase]);
  
  const handleNext = () => {
    if (step === 1 && selectedTemplate) {
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };
  
  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };
  
  const handleGenerate = async () => {
    setLoading(true);
    try {
      await onGenerate({
        template_id: selectedTemplate.id,
        placeholders: { ...autoFillData, ...placeholders },
        client_id: selectedClient || null,
        case_id: selectedCase || null,
        title: title || `${selectedTemplate.title} - ${format(new Date(), 'dd/MM/yyyy')}`
      });
      onClose();
      // Reset
      setStep(1);
      setSelectedTemplate(null);
      setSelectedClient('');
      setSelectedCase('');
      setTitle('');
      setPlaceholders({});
    } catch (error) {
      logger.error('Erro ao gerar documento', error, { template_id: selectedTemplate?.id });
    } finally {
      setLoading(false);
    }
  };
  
  const renderStep1 = () => (
    <div className="space-y-4">
      <p className="text-gray-600 mb-4">Selecione um template para gerar o documento:</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
        {templates.map(template => {
          const cat = DOCUMENT_CATEGORIES[template.category] || DOCUMENT_CATEGORIES.outro;
          return (
            <button
              key={template.id}
              onClick={() => setSelectedTemplate(template)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                selectedTemplate?.id === template.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{cat.icon}</span>
                <div>
                  <p className="font-medium text-gray-900">{template.title}</p>
                  <p className="text-xs text-gray-500">{cat.label}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
  
  const renderStep2 = () => (
    <div className="space-y-4">
      <p className="text-gray-600 mb-4">Vincule a um cliente ou processo para auto-preenchimento:</p>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
        <select
          value={selectedClient}
          onChange={(e) => setSelectedClient(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">Selecione um cliente...</option>
          {clients.map(client => (
            <option key={client.id} value={client.id}>{client.name}</option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Processo</label>
        <select
          value={selectedCase}
          onChange={(e) => setSelectedCase(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">Selecione um processo...</option>
          {cases.map(c => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Título do documento</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={`${selectedTemplate?.title || 'Documento'} - ${format(new Date(), 'dd/MM/yyyy')}`}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        />
      </div>
      
      {Object.keys(autoFillData).length > 0 && (
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              {Object.keys(autoFillData).length} campos preenchidos automaticamente
            </span>
          </div>
          <p className="text-xs text-green-600">
            Dados do cliente e processo serão utilizados no documento.
          </p>
        </div>
      )}
    </div>
  );
  
  const renderStep3 = () => {
    const templatePlaceholders = selectedTemplate?.placeholders || [];
    const missingPlaceholders = templatePlaceholders.filter(p => !autoFillData[p]);
    
    return (
      <div className="space-y-4">
        {missingPlaceholders.length > 0 ? (
          <>
            <p className="text-gray-600 mb-4">
              Preencha os campos adicionais necessários:
            </p>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {missingPlaceholders.map(placeholder => (
                <div key={placeholder}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {placeholder.replace(/\./g, ' › ')}
                  </label>
                  <input
                    type="text"
                    value={placeholders[placeholder] || ''}
                    onChange={(e) => setPlaceholders(prev => ({
                      ...prev,
                      [placeholder]: e.target.value
                    }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder={`Digite ${placeholder}`}
                  />
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Tudo pronto!</h3>
            <p className="text-gray-600 mt-2">
              Todos os campos foram preenchidos automaticamente.
            </p>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gerar Documento" size="lg">
      {/* Steps */}
      <div className="flex items-center justify-center mb-6">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {s}
            </div>
            {s < 3 && (
              <div className={`w-16 h-1 mx-2 ${step > s ? 'bg-blue-600' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>
      
      <div className="text-center mb-4 text-sm text-gray-500">
        {step === 1 && 'Escolha o Template'}
        {step === 2 && 'Configure os Dados'}
        {step === 3 && 'Revise e Gere'}
      </div>
      
      {/* Content */}
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      
      {/* Actions */}
      <div className="flex justify-between pt-6 border-t mt-6">
        <button
          onClick={step === 1 ? onClose : handleBack}
          className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {step === 1 ? 'Cancelar' : 'Voltar'}
        </button>
        
        {step < 3 ? (
          <button
            onClick={handleNext}
            disabled={step === 1 && !selectedTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            Próximo
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {loading ? <LoadingSpinner size="sm" /> : <Wand2 className="w-4 h-4" />}
            Gerar Documento
          </button>
        )}
      </div>
    </Modal>
  );
}

// Modal de Assembly (combinar templates)
function AssemblyModal({ isOpen, onClose, onAssembly, templates, cases, clients }) {
  const [selectedTemplates, setSelectedTemplates] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedCase, setSelectedCase] = useState('');
  const [title, setTitle] = useState('Documento Combinado');
  const [loading, setLoading] = useState(false);
  
  const toggleTemplate = (template) => {
    setSelectedTemplates(prev => {
      const exists = prev.find(t => t.id === template.id);
      if (exists) {
        return prev.filter(t => t.id !== template.id);
      } else {
        return [...prev, template];
      }
    });
  };
  
  const moveTemplate = (index, direction) => {
    const newArr = [...selectedTemplates];
    const newIndex = index + direction;
    if (newIndex >= 0 && newIndex < newArr.length) {
      [newArr[index], newArr[newIndex]] = [newArr[newIndex], newArr[index]];
      setSelectedTemplates(newArr);
    }
  };
  
  const handleAssembly = async () => {
    if (selectedTemplates.length < 2) return;
    
    setLoading(true);
    try {
      await onAssembly({
        template_ids: selectedTemplates.map(t => t.id),
        placeholders: {},
        client_id: selectedClient || null,
        case_id: selectedCase || null,
        title
      });
      onClose();
      setSelectedTemplates([]);
      setSelectedClient('');
      setSelectedCase('');
      setTitle('Documento Combinado');
    } catch (error) {
      logger.error('Erro ao combinar templates', error, { template_ids: selectedTemplates.map(t => t.id) });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Combinar Templates" size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Templates disponíveis */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Templates Disponíveis</h4>
            <div className="border rounded-lg p-2 max-h-64 overflow-y-auto space-y-2">
              {templates.map(template => {
                const isSelected = selectedTemplates.find(t => t.id === template.id);
                const cat = DOCUMENT_CATEGORIES[template.category] || DOCUMENT_CATEGORIES.outro;
                return (
                  <button
                    key={template.id}
                    onClick={() => toggleTemplate(template)}
                    className={`w-full p-2 rounded-lg text-left text-sm transition-colors ${
                      isSelected
                        ? 'bg-blue-100 border-blue-300 border'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <span className="mr-2">{cat.icon}</span>
                    {template.title}
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Templates selecionados (ordem) */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">
              Ordem ({selectedTemplates.length} selecionados)
            </h4>
            <div className="border rounded-lg p-2 max-h-64 overflow-y-auto space-y-2">
              {selectedTemplates.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  Selecione templates à esquerda
                </p>
              ) : (
                selectedTemplates.map((template, index) => {
                  const cat = DOCUMENT_CATEGORIES[template.category] || DOCUMENT_CATEGORIES.outro;
                  return (
                    <div
                      key={template.id}
                      className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg"
                    >
                      <span className="text-sm font-medium text-gray-500 w-6">
                        {index + 1}.
                      </span>
                      <span className="flex-1 text-sm">
                        {cat.icon} {template.title}
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => moveTemplate(index, -1)}
                          disabled={index === 0}
                          className="p-1 hover:bg-blue-100 rounded disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveTemplate(index, 1)}
                          disabled={index === selectedTemplates.length - 1}
                          className="p-1 hover:bg-blue-100 rounded disabled:opacity-30"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => toggleTemplate(template)}
                          className="p-1 hover:bg-red-100 text-red-600 rounded"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Selecione...</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Processo</label>
            <select
              value={selectedCase}
              onChange={(e) => setSelectedCase(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Selecione...</option>
              {cases.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>
      
      <div className="flex justify-end gap-3 pt-6 border-t mt-6">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          Cancelar
        </button>
        <button
          onClick={handleAssembly}
          disabled={selectedTemplates.length < 2 || loading}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? <LoadingSpinner size="sm" /> : <Layers className="w-4 h-4" />}
          Combinar Templates
        </button>
      </div>
    </Modal>
  );
}

// Modal de Editor
function EditorModal({ isOpen, onClose, document, onSave }) {
  const [content, setContent] = useState(document?.content || '');
  const [title, setTitle] = useState(document?.title || '');
  const [status, setStatus] = useState(document?.status || 'draft');
  const [saving, setSaving] = useState(false);
  
  useEffect(() => {
    if (document) {
      setContent(document.content || '');
      setTitle(document.title || '');
      setStatus(document.status || 'draft');
    }
  }, [document]);
  
  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(document.id, { content, title, status });
      onClose();
    } catch (error) {
      logger.error('Erro ao salvar documento', error, { document_id: document?.id });
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Documento" size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              {Object.entries(DOCUMENT_STATUS).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Conteúdo</label>
          <div className="border rounded-lg overflow-hidden">
            <WYSIWYGEditor
              value={content}
              onChange={setContent}
              placeholder="Digite o conteúdo do documento..."
            />
          </div>
        </div>
      </div>
      
      <div className="flex justify-end gap-3 pt-6 border-t mt-6">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4" />}
          Salvar
        </button>
      </div>
    </Modal>
  );
}

// Modal de Visualização
function ViewModal({ isOpen, onClose, document }) {
  if (!document) return null;
  
  const category = DOCUMENT_CATEGORIES[document.category] || DOCUMENT_CATEGORIES.outro;
  const status = DOCUMENT_STATUS[document.status] || DOCUMENT_STATUS.draft;
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={document.title} size="xl">
      <div className="space-y-4">
        {/* Meta info */}
        <div className="flex flex-wrap gap-2">
          <span className={`px-3 py-1 rounded-full text-sm ${status.color}`}>
            {status.label}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm ${category.color}`}>
            {category.icon} {category.label}
          </span>
          {document.version > 1 && (
            <span className="px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-700">
              Versão {document.version}
            </span>
          )}
        </div>
        
        {/* Content */}
        <div className="bg-white border rounded-lg p-6 max-h-[60vh] overflow-y-auto">
          <div 
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizeHTML(document.content) }}
          />
        </div>
        
        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Fechar
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download className="w-4 h-4" />
            Imprimir / PDF
          </button>
        </div>
      </div>
    </Modal>
  );
}

// Componente Principal
export default function Documents() {
  const queryClient = useQueryClient();
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showAssemblyModal, setShowAssemblyModal] = useState(false);
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [filters, setFilters] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null);
  
  // Queries
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['generated-documents', filters],
    queryFn: () => documentAutomationService.list(filters)
  });
  
  const { data: templates = [] } = useQuery({
    queryKey: ['templates-for-generation'],
    queryFn: () => templateService.getAll()
  });
  
  const { data: cases = [] } = useQuery({
    queryKey: ['cases-for-docs'],
    queryFn: () => caseService.getAll()
  });
  
  const { data: clients = [] } = useQuery({
    queryKey: ['clients-for-docs'],
    queryFn: () => clientService.getAll()
  });
  
  const { data: stats } = useQuery({
    queryKey: ['document-stats'],
    queryFn: documentAutomationService.getStats
  });
  
  // Mutations
  const generateMutation = useMutation({
    mutationFn: documentAutomationService.generateFromTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generated-documents'] });
      queryClient.invalidateQueries({ queryKey: ['document-stats'] });
      setToast({ type: 'success', message: 'Documento gerado com sucesso!' });
    },
    onError: (error) => {
      setToast({ type: 'error', message: error.message || 'Erro ao gerar documento' });
    }
  });
  
  const assemblyMutation = useMutation({
    mutationFn: documentAutomationService.assemblyDocuments,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generated-documents'] });
      queryClient.invalidateQueries({ queryKey: ['document-stats'] });
      setToast({ type: 'success', message: 'Documentos combinados com sucesso!' });
    },
    onError: (error) => {
      setToast({ type: 'error', message: error.message || 'Erro ao combinar documentos' });
    }
  });
  
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => documentAutomationService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generated-documents'] });
      setToast({ type: 'success', message: 'Documento atualizado!' });
    },
    onError: (error) => {
      setToast({ type: 'error', message: error.message || 'Erro ao atualizar documento' });
    }
  });
  
  const deleteMutation = useMutation({
    mutationFn: documentAutomationService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generated-documents'] });
      queryClient.invalidateQueries({ queryKey: ['document-stats'] });
      setToast({ type: 'success', message: 'Documento removido!' });
    },
    onError: (error) => {
      setToast({ type: 'error', message: error.message || 'Erro ao remover documento' });
    }
  });
  
  // Handlers
  const handleView = (doc) => {
    setSelectedDocument(doc);
    setShowViewModal(true);
  };
  
  const handleEdit = (doc) => {
    setSelectedDocument(doc);
    setShowEditorModal(true);
  };
  
  const handleDelete = (doc) => {
    if (confirm(`Tem certeza que deseja excluir "${doc.title}"?`)) {
      deleteMutation.mutate(doc.id);
    }
  };
  
  const handleDuplicate = async (doc) => {
    try {
      await documentAutomationService.create({
        title: `${doc.title} (Cópia)`,
        content: doc.content,
        category: doc.category,
        client_id: doc.client_id,
        case_id: doc.case_id
      });
      queryClient.invalidateQueries({ queryKey: ['generated-documents'] });
      setToast({ type: 'success', message: 'Documento duplicado!' });
    } catch (error) {
      setToast({ type: 'error', message: 'Erro ao duplicar documento' });
    }
  };
  
  const handleSave = async (docId, data) => {
    await updateMutation.mutateAsync({ id: docId, data });
  };
  
  // Filtrar documentos por busca
  const filteredDocuments = documents.filter(doc =>
    doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.case_title?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div className="space-y-5 sm:space-y-7">
      <PageHeader
        title="Documentos"
        description="Gere e gerencie documentos jurídicos automaticamente."
        icon={FileText}
        actions={[
          <button
            key="combine"
            onClick={() => setShowAssemblyModal(true)}
            className="btn bg-violet-100 text-violet-700 hover:bg-violet-200 w-full flex items-center justify-center gap-2"
          >
            <Layers className="w-4 h-4" />
            Combinar
          </button>,
          <button
            key="generate"
            onClick={() => setShowGenerateModal(true)}
            className="btn btn-primary w-full flex items-center justify-center gap-2"
          >
            <Wand2 className="w-4 h-4" />
            Gerar Documento
          </button>
        ]}
      />
      
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-gray-600">Total</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.total || 0}</p>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Edit2 className="w-5 h-5 text-yellow-600" />
              <span className="text-sm text-gray-600">Rascunhos</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.by_status?.draft || 0}
            </p>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-600">Aprovados</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.by_status?.approved || 0}
            </p>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileCheck className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-gray-600">Assinados</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.by_status?.signed || 0}
            </p>
          </div>
        </div>
      )}
      
      <SearchFilter
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onClearSearch={() => setSearchQuery('')}
        placeholder="Buscar documentos..."
        filterOptions={[
          {
            placeholder: 'Categoria',
            value: filters.category || '',
            onChange: (value) => setFilters(prev => ({ ...prev, category: value || undefined })),
            options: Object.entries(DOCUMENT_CATEGORIES).map(([key, val]) => ({
              value: key,
              label: `${val.icon} ${val.label}`
            }))
          },
          {
            placeholder: 'Status',
            value: filters.status || '',
            onChange: (value) => setFilters(prev => ({ ...prev, status: value || undefined })),
            options: Object.entries(DOCUMENT_STATUS).map(([key, val]) => ({
              value: key,
              label: val.label
            }))
          }
        ]}
        resultsCount={filteredDocuments.length}
        totalCount={documents.length}
        entityName="documento"
      />
      
      {/* Documents Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum documento encontrado
          </h3>
          <p className="text-gray-500 mb-6">
            Comece gerando seu primeiro documento a partir de um template.
          </p>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Wand2 className="w-4 h-4" />
            Gerar Documento
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map(doc => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
            />
          ))}
        </div>
      )}
      
      {/* Modals */}
      <GenerateDocumentModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        onGenerate={generateMutation.mutateAsync}
        templates={templates}
        cases={cases}
        clients={clients}
      />
      
      <AssemblyModal
        isOpen={showAssemblyModal}
        onClose={() => setShowAssemblyModal(false)}
        onAssembly={assemblyMutation.mutateAsync}
        templates={templates}
        cases={cases}
        clients={clients}
      />
      
      <EditorModal
        isOpen={showEditorModal}
        onClose={() => { setShowEditorModal(false); setSelectedDocument(null); }}
        document={selectedDocument}
        onSave={handleSave}
      />
      
      <ViewModal
        isOpen={showViewModal}
        onClose={() => { setShowViewModal(false); setSelectedDocument(null); }}
        document={selectedDocument}
      />
      
      {/* Toast */}
      {toast && (
        <StandaloneToast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
