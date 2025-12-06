/**
 * Tasks Page - Sistema de Tarefas com Gamificação (Taskscore)
 * 
 * Inspirado no sistema Taskscore da ADVBOX.
 * Features:
 * - Lista de tarefas com filtros avançados
 * - Sistema de pontuação gamificado
 * - Alertas visuais de prazos
 * - Ranking de produtividade
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Filter,
  Trophy,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Circle,
  PlayCircle,
  XCircle,
  Calendar,
  Target,
  Zap,
  Medal,
  ChevronDown,
  ChevronUp,
  Star,
  TrendingUp,
  BarChart2,
  AlertOctagon,
  RefreshCw,
} from 'lucide-react';
import { format, formatDistanceToNow, isToday, isTomorrow, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import taskService, {
  TASK_TYPES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  ALERT_LEVELS,
  calculateTaskScore,
} from '../services/taskService';
import { Modal, LoadingSpinner, StandaloneToast } from '../components/common';
import PageHeader from '../components/common/PageHeader';
import SearchFilter from '../components/common/SearchFilter';

/**
 * Componente Card de Taskscore
 */
function TaskscoreCard({ score, tasksCompleted, rank }) {
  // Determina o nível baseado na pontuação
  const getLevel = (score) => {
    if (score >= 5000) return { level: 'Mestre', icon: '👑', color: 'text-yellow-500' };
    if (score >= 3000) return { level: 'Expert', icon: '🏆', color: 'text-purple-500' };
    if (score >= 1500) return { level: 'Avançado', icon: '⭐', color: 'text-blue-500' };
    if (score >= 500) return { level: 'Intermediário', icon: '🎯', color: 'text-green-500' };
    return { level: 'Iniciante', icon: '🌱', color: 'text-gray-500' };
  };

  const levelInfo = getLevel(score);
  const nextLevelScore = score < 500 ? 500 : score < 1500 ? 1500 : score < 3000 ? 3000 : score < 5000 ? 5000 : null;
  const progress = nextLevelScore ? (score / nextLevelScore) * 100 : 100;

  return (
    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-6 h-6" />
          <span className="font-semibold">Meu Taskscore</span>
        </div>
        {rank && (
          <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full">
            <Medal className="w-4 h-4" />
            <span className="text-sm font-medium">#{rank}</span>
          </div>
        )}
      </div>

      <div className="text-center mb-4">
        <span className="text-5xl font-bold">{score.toLocaleString()}</span>
        <span className="text-xl ml-2">pts</span>
      </div>

      <div className="flex items-center justify-center gap-2 mb-4">
        <span className="text-2xl">{levelInfo.icon}</span>
        <span className="font-medium">{levelInfo.level}</span>
      </div>

      {nextLevelScore && (
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1 opacity-80">
            <span>Próximo nível</span>
            <span>{nextLevelScore.toLocaleString()} pts</span>
          </div>
          <div className="w-full bg-white/30 rounded-full h-2">
            <div
              className="bg-white rounded-full h-2 transition-all duration-500"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex justify-around text-center border-t border-white/20 pt-4">
        <div>
          <div className="text-2xl font-bold">{tasksCompleted}</div>
          <div className="text-xs opacity-80">Tarefas</div>
        </div>
        <div>
          <div className="text-2xl font-bold">{Math.round(score / Math.max(tasksCompleted, 1))}</div>
          <div className="text-xs opacity-80">Média/Tarefa</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Componente Card de Estatísticas
 */
function StatsCard({ title, value, icon: Icon, color, subtitle }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <div className="bg-gradient-to-br from-white to-slate-50 rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200">
      <div className="flex items-center gap-4">
        <div className={`p-4 rounded-xl ${colorClasses[color]} shadow-sm`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <div className="text-3xl font-bold text-slate-900">{value}</div>
          <div className="text-sm text-slate-600 font-medium">{title}</div>
          {subtitle && <div className="text-xs text-slate-500 mt-0.5">{subtitle}</div>}
        </div>
      </div>
    </div>
  );
}

/**
 * Componente Card de Tarefa
 */
function TaskCard({ task, onComplete, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  
  const statusIcon = {
    pendente: Circle,
    em_andamento: PlayCircle,
    concluida: CheckCircle2,
    cancelada: XCircle,
  };
  
  const StatusIcon = statusIcon[task.status] || Circle;
  const typeInfo = TASK_TYPES[task.task_type] || TASK_TYPES.outro;
  const priorityInfo = TASK_PRIORITIES[task.priority] || TASK_PRIORITIES.media;
  const alertInfo = ALERT_LEVELS[task.alert_level] || ALERT_LEVELS.normal;
  const statusInfo = TASK_STATUSES[task.status] || TASK_STATUSES.pendente;

  const isCompleted = task.status === 'concluida';
  const isOverdue = task.alert_level === 'overdue';

  const formatDueDate = (date) => {
    if (!date) return null;
    const d = new Date(date);
    if (isToday(d)) return 'Hoje';
    if (isTomorrow(d)) return 'Amanhã';
    if (isPast(d)) return `Venceu ${formatDistanceToNow(d, { locale: ptBR, addSuffix: true })}`;
    return format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  return (
    <div
      className={`bg-white rounded-xl border transition-all duration-200 hover:shadow-lg hover:scale-[1.01] ${
        isOverdue && !isCompleted ? 'border-red-300 bg-red-50/50 shadow-sm' : 'border-slate-200 shadow-sm'
      } ${isCompleted ? 'opacity-70' : ''}`}
    >
      <div className="p-5">
        <div className="flex items-start gap-3">
          {/* Status Icon / Complete Button */}
          <button
            onClick={() => !isCompleted && onComplete(task.id)}
            disabled={isCompleted}
            className={`mt-0.5 flex-shrink-0 transition-all ${
              isCompleted
                ? 'text-green-500 cursor-default'
                : 'text-slate-400 hover:text-green-500 hover:scale-110'
            }`}
            title={isCompleted ? 'Concluída' : 'Marcar como concluída'}
          >
            <StatusIcon className="w-6 h-6" />
          </button>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-2">
              <span className="text-xl">{typeInfo.icon}</span>
              <h3 className={`font-semibold text-slate-900 text-base ${isCompleted ? 'line-through' : ''}`}>
                {task.title}
              </h3>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${alertInfo.bgColor} ${alertInfo.textColor}`}>
                {task.due_date ? formatDueDate(task.due_date) : 'Sem prazo'}
              </span>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-medium bg-${priorityInfo.color}-100 text-${priorityInfo.color}-700`}
              >
                {priorityInfo.label}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                {typeInfo.label}
              </span>
            </div>

            {/* Description (expandable) */}
            {task.description && (
              <p className={`text-sm text-gray-600 ${expanded ? '' : 'line-clamp-2'}`}>
                {task.description}
              </p>
            )}
          </div>

          {/* Score Badge */}
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-3 py-1 rounded-full shadow-sm">
              <Star className="w-4 h-4" />
              <span className="font-bold text-sm">{task.score}</span>
            </div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-gray-400 hover:text-gray-600"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Expanded Details */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              {task.case_id && (
                <div className="flex flex-col">
                  <span className="text-slate-500 text-xs mb-1">Caso:</span>
                  <span className="text-slate-800 font-medium">{task.case_id}</span>
                </div>
              )}
              {task.client_id && (
                <div className="flex flex-col">
                  <span className="text-slate-500 text-xs mb-1">Cliente:</span>
                  <span className="text-slate-800 font-medium">{task.client_id}</span>
                </div>
              )}
              {task.location && (
                <div className="flex flex-col">
                  <span className="text-slate-500 text-xs mb-1">Local:</span>
                  <span className="text-slate-800 font-medium">{task.location}</span>
                </div>
              )}
              {task.process_number && (
                <div className="flex flex-col">
                  <span className="text-slate-500 text-xs mb-1">Processo:</span>
                  <span className="text-slate-800 font-medium">{task.process_number}</span>
                </div>
              )}
              {task.completed_at && (
                <div className="flex flex-col">
                  <span className="text-slate-500 text-xs mb-1">Concluída em:</span>
                  <span className="ml-2 text-gray-700">
                    {format(new Date(task.completed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => onEdit(task)}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Editar
              </button>
              <button
                onClick={() => onDelete(task.id)}
                className="px-3 py-1.5 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded-lg hover:bg-red-50"
              >
                Excluir
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Modal de Criação/Edição de Tarefa
 */
function TaskFormModal({ isOpen, onClose, task, onSave }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    task_type: 'outro',
    priority: 'media',
    status: 'pendente',
    due_date: '',
    case_id: '',
    client_id: '',
    location: '',
    process_number: '',
    notes: '',
  });

  useEffect(() => {
    if (task) {
      setFormData({
        ...task,
        due_date: task.due_date ? format(new Date(task.due_date), "yyyy-MM-dd'T'HH:mm") : '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        task_type: 'outro',
        priority: 'media',
        status: 'pendente',
        due_date: '',
        case_id: '',
        client_id: '',
        location: '',
        process_number: '',
        notes: '',
      });
    }
  }, [task, isOpen]);

  const calculatedScore = calculateTaskScore(formData.task_type, formData.priority);

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null,
    };
    // Remove empty strings
    Object.keys(data).forEach((key) => {
      if (data[key] === '') data[key] = null;
    });
    onSave(data);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={task ? 'Editar Tarefa' : 'Nova Tarefa'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Preview de Pontuação */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-600" />
            <span className="font-medium text-gray-700">Pontuação prevista:</span>
          </div>
          <div className="flex items-center gap-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 rounded-full">
            <Star className="w-5 h-5" />
            <span className="font-bold text-lg">{calculatedScore}</span>
            <span className="text-sm">pts</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Título */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Ex: Preparar petição inicial"
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
            <select
              value={formData.task_type}
              onChange={(e) => setFormData({ ...formData, task_type: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {Object.entries(TASK_TYPES).map(([key, { label, icon, score }]) => (
                <option key={key} value={key}>
                  {icon} {label} (+{score} pts)
                </option>
              ))}
            </select>
          </div>

          {/* Prioridade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade *</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {Object.entries(TASK_PRIORITIES).map(([key, { label, multiplier }]) => (
                <option key={key} value={key}>
                  {label} (x{multiplier})
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {Object.entries(TASK_STATUSES).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Data Limite */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Limite</label>
            <input
              type="datetime-local"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Descrição */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Detalhes da tarefa..."
            />
          </div>

          {/* Local */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Local</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Ex: Fórum Central"
            />
          </div>

          {/* Número do Processo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nº do Processo</label>
            <input
              type="text"
              value={formData.process_number}
              onChange={(e) => setFormData({ ...formData, process_number: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="0000000-00.0000.0.00.0000"
            />
          </div>

          {/* Observações */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Notas adicionais..."
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {task ? 'Salvar Alterações' : 'Criar Tarefa'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/**
 * Página Principal de Tarefas
 */
export default function Tasks() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    alert_level: '',
    task_type: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [toast, setToast] = useState(null);

  // Queries
  const { data: tasks = [], isLoading: tasksLoading, refetch: refetchTasks } = useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => taskService.list(filters),
  });

  const { data: stats = {}, isLoading: statsLoading } = useQuery({
    queryKey: ['taskStats'],
    queryFn: () => taskService.getStats(),
  });

  const { data: myScore = { total_score: 0, tasks_completed: 0, rank: null } } = useQuery({
    queryKey: ['myTaskscore'],
    queryFn: () => taskService.getMyScore(),
  });

  const { data: overdueTasks = [] } = useQuery({
    queryKey: ['overdueTasks'],
    queryFn: () => taskService.getOverdue(),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: taskService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['taskStats'] });
      queryClient.invalidateQueries({ queryKey: ['myTaskscore'] });
      setIsModalOpen(false);
      setToast({ type: 'success', message: 'Tarefa criada com sucesso!' });
    },
    onError: (error) => {
      setToast({ type: 'error', message: `Erro ao criar tarefa: ${error.message}` });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => taskService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['taskStats'] });
      setIsModalOpen(false);
      setEditingTask(null);
      setToast({ type: 'success', message: 'Tarefa atualizada!' });
    },
    onError: (error) => {
      setToast({ type: 'error', message: `Erro ao atualizar: ${error.message}` });
    },
  });

  const completeMutation = useMutation({
    mutationFn: taskService.complete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['taskStats'] });
      queryClient.invalidateQueries({ queryKey: ['myTaskscore'] });
      queryClient.invalidateQueries({ queryKey: ['overdueTasks'] });
      setToast({ type: 'success', message: '🎉 Tarefa concluída! Pontos adicionados!' });
    },
    onError: (error) => {
      setToast({ type: 'error', message: `Erro ao concluir: ${error.message}` });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: taskService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['taskStats'] });
      setToast({ type: 'success', message: 'Tarefa removida.' });
    },
    onError: (error) => {
      setToast({ type: 'error', message: `Erro ao remover: ${error.message}` });
    },
  });

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        if (
          !task.title.toLowerCase().includes(search) &&
          !(task.description || '').toLowerCase().includes(search)
        ) {
          return false;
        }
      }
      if (filters.task_type && task.task_type !== filters.task_type) return false;
      return true;
    });
  }, [tasks, searchTerm, filters.task_type]);

  // Handlers
  const handleSave = (data) => {
    if (editingTask) {
      updateMutation.mutate({ id: editingTask.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleComplete = (taskId) => {
    completeMutation.mutate(taskId);
  };

  const handleDelete = (taskId) => {
    if (window.confirm('Tem certeza que deseja excluir esta tarefa?')) {
      deleteMutation.mutate(taskId);
    }
  };

  const handleNewTask = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-5 sm:space-y-7">
      <PageHeader
        title="Tarefas"
        description="Sistema de produtividade com gamificação Taskscore."
        icon={Target}
        action={
          <button onClick={handleNewTask} className="btn btn-primary w-full sm:w-auto flex items-center justify-center gap-2">
            <Plus className="w-5 h-5" />
            Nova Tarefa
          </button>
        }
      />

      {/* Taskscore & Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Taskscore Card */}
        <TaskscoreCard
          score={myScore.total_score}
          tasksCompleted={myScore.tasks_completed}
          rank={myScore.rank}
        />

        {/* Stats Cards */}
        <StatsCard
          title="Pendentes"
          value={stats.by_status?.pendente || 0}
          icon={Clock}
          color="yellow"
        />
        <StatsCard
          title="Em Andamento"
          value={stats.by_status?.em_andamento || 0}
          icon={PlayCircle}
          color="blue"
        />
        <StatsCard
          title="Vencidas"
          value={overdueTasks.length}
          icon={AlertOctagon}
          color="red"
          subtitle={overdueTasks.length > 0 ? 'Atenção!' : ''}
        />
      </div>

      {/* Alerts for overdue tasks */}
      {overdueTasks.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
            <AlertTriangle className="w-5 h-5" />
            Você tem {overdueTasks.length} tarefa(s) vencida(s)!
          </div>
          <div className="flex flex-wrap gap-2">
            {overdueTasks.slice(0, 3).map((task) => (
              <span
                key={task.id}
                className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm"
              >
                {task.title}
              </span>
            ))}
            {overdueTasks.length > 3 && (
              <span className="text-red-600 text-sm">
                +{overdueTasks.length - 3} mais
              </span>
            )}
          </div>
        </div>
      )}

      <SearchFilter
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        onClearSearch={() => setSearchTerm('')}
        placeholder="Buscar tarefas..."
        filterOptions={[
          {
            placeholder: 'Status',
            value: filters.status,
            onChange: (value) => setFilters({ ...filters, status: value }),
            options: Object.entries(TASK_STATUSES).map(([key, { label }]) => ({
              value: key,
              label
            }))
          },
          {
            placeholder: 'Prazo',
            value: filters.alert_level,
            onChange: (value) => setFilters({ ...filters, alert_level: value }),
            options: Object.entries(ALERT_LEVELS).map(([key, { label }]) => ({
              value: key,
              label
            }))
          }
        ]}
        resultsCount={filteredTasks.length}
        totalCount={tasks.length}
        entityName="tarefa"
      />

      {/* Tasks List */}
      <div className="space-y-3">
        {tasksLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Target className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <h3 className="font-medium text-gray-900">Nenhuma tarefa encontrada</h3>
            <p className="text-gray-500 mt-1">
              {searchTerm || filters.status || filters.alert_level
                ? 'Tente ajustar os filtros'
                : 'Crie sua primeira tarefa para começar a pontuar!'}
            </p>
            <button
              onClick={handleNewTask}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4 inline mr-1" />
              Nova Tarefa
            </button>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onComplete={handleComplete}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* Task Form Modal */}
      <TaskFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        task={editingTask}
        onSave={handleSave}
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
