/**
 * Página de Timesheet Inteligente
 * 
 * Sistema completo de controle de tempo com:
 * - Timer com cronômetro em tempo real
 * - Entradas manuais de tempo
 * - Relatórios diários e mensais
 * - Vinculação com casos/clientes
 * - Cálculo automático de faturamento
 */
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Clock,
  Play,
  Pause,
  Plus,
  Calendar,
  DollarSign,
  TrendingUp,
  FileText,
  Filter,
  Search,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Briefcase,
  User,
  Tag,
  Lightbulb,
  X,
  Save,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameDay, isToday, differenceInMinutes, differenceInSeconds } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import timesheetService from '../services/timesheetService';
import { caseService, clientService } from '../services/crmService';
import { LoadingSpinner, Modal, StandaloneToast } from '../components/common';
import PageHeader from '../components/common/PageHeader';

// Tipos de atividade
const ACTIVITY_TYPES = [
  { value: 'hearing', label: 'Audiência', color: 'bg-red-100 text-red-800', icon: '⚖️' },
  { value: 'meeting', label: 'Reunião', color: 'bg-blue-100 text-blue-800', icon: '👥' },
  { value: 'research', label: 'Pesquisa', color: 'bg-purple-100 text-purple-800', icon: '🔍' },
  { value: 'document', label: 'Documento', color: 'bg-green-100 text-green-800', icon: '📄' },
  { value: 'call', label: 'Ligação', color: 'bg-yellow-100 text-yellow-800', icon: '📞' },
  { value: 'email', label: 'E-mail', color: 'bg-cyan-100 text-cyan-800', icon: '📧' },
  { value: 'travel', label: 'Deslocamento', color: 'bg-orange-100 text-orange-800', icon: '🚗' },
  { value: 'general', label: 'Geral', color: 'bg-gray-100 text-gray-800', icon: '📋' }
];

// Componente de Timer
function ActiveTimer({ timer, onStop, cases, clients }) {
  const [elapsed, setElapsed] = useState(0);
  const [description, setDescription] = useState(timer?.description || '');
  
  useEffect(() => {
    if (!timer?.timer_started_at) return;
    
    const startTime = new Date(timer.timer_started_at);
    const updateElapsed = () => {
      setElapsed(differenceInSeconds(new Date(), startTime));
    };
    
    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    
    return () => clearInterval(interval);
  }, [timer?.timer_started_at]);
  
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const caseName = cases?.find(c => c.id === timer?.case_id)?.title || 'Sem caso';
  const clientName = clients?.find(c => c.id === timer?.client_id)?.name || 'Sem cliente';
  
  return (
    <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 rounded-2xl shadow-xl p-7 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center animate-pulse shadow-lg backdrop-blur-sm">
            <Clock className="w-10 h-10" />
          </div>
          <div>
            <p className="text-sm text-white/90 font-medium mb-1">Timer ativo</p>
            <p className="text-5xl font-mono font-bold tracking-tight">{formatTime(elapsed)}</p>
          </div>
        </div>
        
        <div className="flex-1 mx-10">
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-white/25 border-2 border-white/30 rounded-xl px-5 py-3 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/60 focus:bg-white/30 transition-all backdrop-blur-sm font-medium"
            placeholder="Descrição da atividade..."
          />
          <div className="flex gap-6 mt-3 text-sm text-white/90">
            <span className="flex items-center gap-2"><Briefcase size={14} /> {caseName}</span>
            <span className="flex items-center gap-2"><User size={14} /> {clientName}</span>
          </div>
        </div>
        
        <button
          onClick={() => onStop(timer.id, description)}
          className="flex items-center gap-2.5 bg-white text-red-600 px-7 py-4 rounded-xl font-bold hover:bg-red-50 hover:scale-105 transition-all shadow-lg hover:shadow-xl"
        >
          <Pause className="w-5 h-5" />
          Parar
        </button>
      </div>
    </div>
  );
}

// Componente de Card de Entrada de Tempo
function TimeEntryCard({ entry, onEdit, onDelete, cases, clients }) {
  const activityType = ACTIVITY_TYPES.find(a => a.value === entry.activity_type) || ACTIVITY_TYPES[7];
  const caseName = cases?.find(c => c.id === entry.case_id)?.title || entry.case_title;
  const clientName = clients?.find(c => c.id === entry.client_id)?.name || entry.client_name;
  
  const formatDuration = (minutes) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}min`;
    }
    return `${mins}min`;
  };
  
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg hover:scale-[1.01] transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-sm ${activityType.color}`}>
            {activityType.icon}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-slate-900 text-base">{entry.description}</p>
            <div className="flex flex-wrap gap-2.5 mt-2 text-xs text-slate-500">
              {caseName && (
                <span className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg">
                  <Briefcase className="w-3.5 h-3.5" />
                  {caseName}
                </span>
              )}
              {clientName && (
                <span className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg">
                  <User className="w-3.5 h-3.5" />
                  {clientName}
                </span>
              )}
              <span className={`px-2.5 py-1 rounded-lg font-medium ${activityType.color}`}>
                {activityType.label}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-5">
          <div className="text-right">
            <p className="text-xl font-bold text-slate-900">
              {formatDuration(entry.duration_minutes || 0)}
            </p>
            {entry.is_billable && entry.total_amount > 0 && (
              <p className="text-sm text-green-600 font-bold">
                R$ {entry.total_amount.toFixed(2)}
              </p>
            )}
            {!entry.is_billable && (
              <span className="text-xs text-slate-400 font-medium">Não faturável</span>
            )}
          </div>
          
          <div className="flex gap-1.5">
            <button
              onClick={() => onEdit(entry)}
              className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-all hover:scale-110"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(entry.id)}
              className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-all hover:scale-110"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente de Estatísticas
function DailyStats({ summary }) {
  const stats = [
    {
      label: 'Horas Hoje',
      value: summary?.total_hours?.toFixed(1) || '0',
      suffix: 'h',
      icon: Clock,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      label: 'Faturável',
      value: summary?.billable_hours?.toFixed(1) || '0',
      suffix: 'h',
      icon: DollarSign,
      color: 'text-green-600',
      bg: 'bg-green-50'
    },
    {
      label: 'Valor Total',
      value: `R$ ${(summary?.total_amount || 0).toFixed(0)}`,
      suffix: '',
      icon: TrendingUp,
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    },
    {
      label: 'Atividades',
      value: summary?.total_entries || '0',
      suffix: '',
      icon: FileText,
      color: 'text-orange-600',
      bg: 'bg-orange-50'
    }
  ];
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div key={index} className={`${stat.bg} rounded-xl p-4`}>
          <div className="flex items-center gap-2 mb-2">
            <stat.icon className={`w-5 h-5 ${stat.color}`} />
            <span className="text-sm text-gray-600">{stat.label}</span>
          </div>
          <p className={`text-2xl font-bold ${stat.color}`}>
            {stat.value}{stat.suffix}
          </p>
        </div>
      ))}
    </div>
  );
}

// Modal de Nova Entrada / Edição
function TimeEntryModal({ isOpen, onClose, onSave, entry, cases, clients, suggestions }) {
  const [formData, setFormData] = useState({
    description: '',
    case_id: '',
    client_id: '',
    activity_type: 'general',
    duration_minutes: 30,
    is_billable: true,
    billing_rate: 300,
    notes: ''
  });
  const [durationHours, setDurationHours] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  useEffect(() => {
    if (entry) {
      setFormData({
        description: entry.description || '',
        case_id: entry.case_id || '',
        client_id: entry.client_id || '',
        activity_type: entry.activity_type || 'general',
        duration_minutes: entry.duration_minutes || 30,
        is_billable: entry.is_billable !== false,
        billing_rate: entry.billing_rate || 300,
        notes: entry.notes || ''
      });
      const hrs = Math.floor((entry.duration_minutes || 0) / 60);
      const mins = (entry.duration_minutes || 0) % 60;
      setDurationHours(hrs);
      setDurationMinutes(mins);
    } else {
      setFormData({
        description: '',
        case_id: '',
        client_id: '',
        activity_type: 'general',
        duration_minutes: 30,
        is_billable: true,
        billing_rate: 300,
        notes: ''
      });
      setDurationHours(0);
      setDurationMinutes(30);
    }
  }, [entry, isOpen]);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    const totalMinutes = (durationHours * 60) + durationMinutes;
    onSave({
      ...formData,
      duration_minutes: totalMinutes
    });
  };
  
  const selectSuggestion = (suggestion) => {
    setFormData(prev => ({ ...prev, description: suggestion }));
    setShowSuggestions(false);
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={entry ? 'Editar Entrada' : 'Nova Entrada de Tempo'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Descrição com Sugestões */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descrição *
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              onFocus={() => suggestions?.length > 0 && setShowSuggestions(true)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: Elaboração de petição inicial..."
              required
              minLength={5}
            />
            {suggestions?.length > 0 && (
              <button
                type="button"
                onClick={() => setShowSuggestions(!showSuggestions)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-yellow-500 hover:text-yellow-600"
                title="Ver sugestões"
              >
                <Lightbulb className="w-5 h-5" />
              </button>
            )}
          </div>
          
          {showSuggestions && suggestions?.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
              <div className="p-2 border-b border-gray-100 flex items-center gap-2 text-sm text-gray-600">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                Sugestões de atividade
              </div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => selectSuggestion(suggestion)}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Caso e Cliente */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Caso
            </label>
            <select
              value={formData.case_id}
              onChange={(e) => setFormData(prev => ({ ...prev, case_id: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Sem caso vinculado</option>
              {cases?.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cliente
            </label>
            <select
              value={formData.client_id}
              onChange={(e) => setFormData(prev => ({ ...prev, client_id: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Sem cliente vinculado</option>
              {clients?.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Tipo de Atividade */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Atividade
          </label>
          <div className="grid grid-cols-4 gap-2">
            {ACTIVITY_TYPES.map(type => (
              <button
                key={type.value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, activity_type: type.value }))}
                className={`flex flex-col items-center p-2 rounded-lg border-2 transition-all ${
                  formData.activity_type === type.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-xl">{type.icon}</span>
                <span className="text-xs mt-1">{type.label}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Duração */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Duração
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              max="23"
              value={durationHours}
              onChange={(e) => setDurationHours(parseInt(e.target.value) || 0)}
              className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center"
            />
            <span className="text-gray-500">h</span>
            <input
              type="number"
              min="0"
              max="59"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
              className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center"
            />
            <span className="text-gray-500">min</span>
            
            {/* Atalhos de duração */}
            <div className="flex gap-1 ml-4">
              {[15, 30, 60, 120].map(mins => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => {
                    setDurationHours(Math.floor(mins / 60));
                    setDurationMinutes(mins % 60);
                  }}
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                >
                  {mins < 60 ? `${mins}min` : `${mins/60}h`}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Faturamento */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_billable}
              onChange={(e) => setFormData(prev => ({ ...prev, is_billable: e.target.checked }))}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Faturável</span>
          </label>
          
          {formData.is_billable && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Taxa:</span>
              <input
                type="number"
                min="0"
                step="50"
                value={formData.billing_rate}
                onChange={(e) => setFormData(prev => ({ ...prev, billing_rate: parseFloat(e.target.value) || 0 }))}
                className="w-24 px-3 py-1 border border-gray-300 rounded-lg text-sm"
              />
              <span className="text-sm text-gray-500">R$/hora</span>
            </div>
          )}
        </div>
        
        {/* Notas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notas (opcional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={2}
            placeholder="Observações adicionais..."
          />
        </div>
        
        {/* Botões */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            {entry ? 'Salvar' : 'Criar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Modal Iniciar Timer
function StartTimerModal({ isOpen, onClose, onStart, cases, clients }) {
  const [formData, setFormData] = useState({
    description: 'Timer ativo',
    case_id: '',
    client_id: '',
    activity_type: 'general'
  });
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onStart(formData);
    onClose();
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Iniciar Timer">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descrição
          </label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="O que você vai fazer?"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Caso
            </label>
            <select
              value={formData.case_id}
              onChange={(e) => setFormData(prev => ({ ...prev, case_id: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Selecione...</option>
              {cases?.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cliente
            </label>
            <select
              value={formData.client_id}
              onChange={(e) => setFormData(prev => ({ ...prev, client_id: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Selecione...</option>
              {clients?.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Atividade
          </label>
          <select
            value={formData.activity_type}
            onChange={(e) => setFormData(prev => ({ ...prev, activity_type: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          >
            {ACTIVITY_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.icon} {type.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Play className="w-4 h-4" />
            Iniciar Timer
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Componente Principal
export default function Timesheet() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('day'); // day, week, month
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [filters, setFilters] = useState({});
  const [toast, setToast] = useState(null);
  
  // Queries
  const { data: entries = [], isLoading: loadingEntries } = useQuery({
    queryKey: ['timesheet-entries', format(selectedDate, 'yyyy-MM-dd'), filters],
    queryFn: () => timesheetService.list({
      start_date: format(selectedDate, 'yyyy-MM-dd'),
      end_date: format(selectedDate, 'yyyy-MM-dd'),
      ...filters
    })
  });
  
  const { data: activeTimer } = useQuery({
    queryKey: ['active-timer'],
    queryFn: timesheetService.getActiveTimer,
    refetchInterval: 30000 // Refresh every 30 seconds
  });
  
  const { data: dailySummary } = useQuery({
    queryKey: ['daily-summary', format(selectedDate, 'yyyy-MM-dd')],
    queryFn: () => timesheetService.getDailySummary(format(selectedDate, 'yyyy-MM-dd'))
  });
  
  const { data: suggestions = [] } = useQuery({
    queryKey: ['timesheet-suggestions'],
    queryFn: () => timesheetService.getSuggestions(),
    select: (data) => data?.suggestions || []
  });
  
  const { data: cases = [] } = useQuery({
    queryKey: ['cases-list'],
    queryFn: () => caseService.getAll()
  });
  
  const { data: clients = [] } = useQuery({
    queryKey: ['clients-list'],
    queryFn: () => clientService.getAll()
  });
  
  // Mutations
  const createEntry = useMutation({
    mutationFn: timesheetService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheet-entries'] });
      queryClient.invalidateQueries({ queryKey: ['daily-summary'] });
      setShowEntryModal(false);
      setToast({ type: 'success', message: 'Entrada criada com sucesso!' });
    },
    onError: (error) => {
      setToast({ type: 'error', message: error.message || 'Erro ao criar entrada' });
    }
  });
  
  const updateEntry = useMutation({
    mutationFn: ({ id, data }) => timesheetService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheet-entries'] });
      queryClient.invalidateQueries({ queryKey: ['daily-summary'] });
      setShowEntryModal(false);
      setEditingEntry(null);
      setToast({ type: 'success', message: 'Entrada atualizada!' });
    },
    onError: (error) => {
      setToast({ type: 'error', message: error.message || 'Erro ao atualizar entrada' });
    }
  });
  
  const deleteEntry = useMutation({
    mutationFn: timesheetService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheet-entries'] });
      queryClient.invalidateQueries({ queryKey: ['daily-summary'] });
      setToast({ type: 'success', message: 'Entrada removida!' });
    },
    onError: (error) => {
      setToast({ type: 'error', message: error.message || 'Erro ao remover entrada' });
    }
  });
  
  const startTimer = useMutation({
    mutationFn: timesheetService.startTimer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-timer'] });
      setToast({ type: 'success', message: 'Timer iniciado!' });
    },
    onError: (error) => {
      setToast({ type: 'error', message: error.message || 'Erro ao iniciar timer' });
    }
  });
  
  const stopTimer = useMutation({
    mutationFn: ({ id, description }) => timesheetService.stopTimer(id, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-timer'] });
      queryClient.invalidateQueries({ queryKey: ['timesheet-entries'] });
      queryClient.invalidateQueries({ queryKey: ['daily-summary'] });
      setToast({ type: 'success', message: 'Timer parado e entrada registrada!' });
    },
    onError: (error) => {
      setToast({ type: 'error', message: error.message || 'Erro ao parar timer' });
    }
  });
  
  // Handlers
  const handleSaveEntry = (data) => {
    if (editingEntry) {
      updateEntry.mutate({ id: editingEntry.id, data });
    } else {
      createEntry.mutate(data);
    }
  };
  
  const handleEditEntry = (entry) => {
    setEditingEntry(entry);
    setShowEntryModal(true);
  };
  
  const handleDeleteEntry = (entryId) => {
    if (confirm('Tem certeza que deseja remover esta entrada?')) {
      deleteEntry.mutate(entryId);
    }
  };
  
  const handleStartTimer = (data) => {
    startTimer.mutate(data);
  };
  
  const handleStopTimer = (id, description) => {
    stopTimer.mutate({ id, description });
  };
  
  // Navigation
  const navigateDate = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + direction);
    setSelectedDate(newDate);
  };
  
  const goToToday = () => {
    setSelectedDate(new Date());
  };
  
  // Agrupar entradas por período (para visualização)
  const groupedEntries = entries.reduce((acc, entry) => {
    const hour = entry.start_time 
      ? format(parseISO(entry.start_time), 'HH:00')
      : 'Sem horário';
    if (!acc[hour]) acc[hour] = [];
    acc[hour].push(entry);
    return acc;
  }, {});
  
  return (
    <div className="space-y-5 sm:space-y-7">
      <PageHeader
        title="Timesheet"
        description="Controle seu tempo e maximize sua produtividade."
        icon={Clock}
        actions={
          !activeTimer ? [
            <button
              key="timer"
              onClick={() => setShowTimerModal(true)}
              className="btn bg-success-600 text-white hover:bg-success-700 w-full flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              Iniciar Timer
            </button>,
            <button
              key="entry"
              onClick={() => { setEditingEntry(null); setShowEntryModal(true); }}
              className="btn btn-primary w-full flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nova Entrada
            </button>
          ] : undefined
        }
      />
      
      {/* Timer Ativo */}
      {activeTimer && (
        <ActiveTimer
          timer={activeTimer}
          onStop={handleStopTimer}
          cases={cases}
          clients={clients}
        />
      )}
      
      {/* Estatísticas do Dia */}
      <DailyStats summary={dailySummary} />
      
      {/* Navegação de Data */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateDate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <button
              onClick={goToToday}
              className={`px-4 py-2 rounded-lg transition-colors ${
                isToday(selectedDate)
                  ? 'bg-blue-100 text-blue-700'
                  : 'hover:bg-gray-100'
              }`}
            >
              {isToday(selectedDate) ? 'Hoje' : format(selectedDate, "d 'de' MMMM, yyyy", { locale: ptBR })}
            </button>
            
            <button
              onClick={() => navigateDate(1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>
      </div>
      
      {/* Lista de Entradas */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">
            Entradas de {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
          </h2>
        </div>
        
        {loadingEntries ? (
          <div className="p-8 text-center">
            <LoadingSpinner />
          </div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhuma entrada para este dia</p>
            <button
              onClick={() => {
                setEditingEntry(null);
                setShowEntryModal(true);
              }}
              className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              + Adicionar entrada
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 p-4 space-y-3">
            {entries.map(entry => (
              <TimeEntryCard
                key={entry.id}
                entry={entry}
                onEdit={handleEditEntry}
                onDelete={handleDeleteEntry}
                cases={cases}
                clients={clients}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Modals */}
      <TimeEntryModal
        isOpen={showEntryModal}
        onClose={() => {
          setShowEntryModal(false);
          setEditingEntry(null);
        }}
        onSave={handleSaveEntry}
        entry={editingEntry}
        cases={cases}
        clients={clients}
        suggestions={suggestions}
      />
      
      <StartTimerModal
        isOpen={showTimerModal}
        onClose={() => setShowTimerModal(false)}
        onStart={handleStartTimer}
        cases={cases}
        clients={clients}
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
