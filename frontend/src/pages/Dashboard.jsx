/**
 * Dashboard Principal - Design Moderno e Sofisticado
 * Visão geral completa do escritório jurídico
 */

import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { clientService, caseService } from '@/services/crmService'
import { 
  Users, 
  Briefcase, 
  TrendingUp, 
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  AlertTriangle,
  Scale,
  Calendar,
  FileText,
  Target,
  DollarSign,
  Activity,
  MoreHorizontal,
  Plus,
  ChevronRight,
  Sparkles,
  Zap
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

// Skeleton Loading Component
function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} />
}

// Stat Card Component
function StatCard({ title, value, change, changeType, icon: Icon, color, link }) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    emerald: 'from-emerald-500 to-emerald-600',
    amber: 'from-amber-500 to-amber-600',
    rose: 'from-rose-500 to-rose-600',
    violet: 'from-violet-500 to-violet-600',
    cyan: 'from-cyan-500 to-cyan-600',
  }

  const iconBgClasses = {
    blue: 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 shadow-sm shadow-blue-200/50',
    emerald: 'bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600 shadow-sm shadow-emerald-200/50',
    amber: 'bg-gradient-to-br from-amber-50 to-amber-100 text-amber-600 shadow-sm shadow-amber-200/50',
    rose: 'bg-gradient-to-br from-rose-50 to-rose-100 text-rose-600 shadow-sm shadow-rose-200/50',
    violet: 'bg-gradient-to-br from-violet-50 to-violet-100 text-violet-600 shadow-sm shadow-violet-200/50',
    cyan: 'bg-gradient-to-br from-cyan-50 to-cyan-100 text-cyan-600 shadow-sm shadow-cyan-200/50',
  }

  return (
    <Link 
      to={link}
      className="group card card-hover p-3 sm:p-6 block relative overflow-hidden"
    >
      {/* Background gradient overlay sutil */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative">
        <div className="flex items-start justify-between mb-2 sm:mb-4">
          <div className={`p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl ${iconBgClasses[color]} transition-transform duration-300 group-hover:scale-110`}>
            <Icon size={18} className="sm:w-6 sm:h-6" />
          </div>
          <div className={`flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-sm font-semibold px-2 py-1 rounded-full ${
            changeType === 'up' ? 'bg-emerald-50 text-emerald-700' : changeType === 'down' ? 'bg-rose-50 text-rose-700' : 'bg-slate-50 text-slate-500'
          }`}>
            {changeType === 'up' && <ArrowUpRight size={12} className="sm:w-4 sm:h-4" />}
            {changeType === 'down' && <ArrowDownRight size={12} className="sm:w-4 sm:h-4" />}
            {change && <span>{change}</span>}
          </div>
        </div>
        <div>
          <p className="text-xl sm:text-4xl font-bold text-slate-900 mb-0.5 sm:mb-2 tracking-tight">{value}</p>
          <p className="text-[11px] sm:text-sm text-slate-600 leading-tight font-medium">{title}</p>
        </div>
        <div className="mt-3 sm:mt-5 pt-3 sm:pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[10px] sm:text-sm text-slate-500 group-hover:text-primary-600 transition-colors font-medium">
            Ver detalhes
          </span>
          <ArrowRight size={12} className="sm:w-4 sm:h-4 text-slate-400 group-hover:text-primary-600 group-hover:translate-x-2 transition-all duration-300" />
        </div>
      </div>
    </Link>
  )
}

// Activity Chart Component
function ActivityChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0c8ce9" stopOpacity={0.2}/>
            <stop offset="95%" stopColor="#0c8ce9" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis 
          dataKey="name" 
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#94a3b8', fontSize: 12 }}
        />
        <YAxis 
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#94a3b8', fontSize: 12 }}
        />
        <Tooltip 
          contentStyle={{ 
            background: 'white', 
            border: 'none', 
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}
        />
        <Area 
          type="monotone" 
          dataKey="value" 
          stroke="#0c8ce9" 
          strokeWidth={2}
          fillOpacity={1} 
          fill="url(#colorValue)" 
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// Cases Status Chart
function CasesStatusChart({ cases }) {
  const statusCount = {
    em_andamento: cases.filter(c => c.status === 'em_andamento').length,
    aguardando: cases.filter(c => c.status === 'aguardando').length,
    concluido: cases.filter(c => c.status === 'concluido').length,
    arquivado: cases.filter(c => c.status === 'arquivado').length,
  }

  const data = [
    { name: 'Em Andamento', value: statusCount.em_andamento, color: '#0c8ce9' },
    { name: 'Aguardando', value: statusCount.aguardando, color: '#f59e0b' },
    { name: 'Concluído', value: statusCount.concluido, color: '#10b981' },
    { name: 'Arquivado', value: statusCount.arquivado, color: '#94a3b8' },
  ].filter(d => d.value > 0)

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400">
        Nenhum processo cadastrado
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4 sm:gap-6">
      <div className="w-24 h-24 sm:w-32 sm:h-32">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={25}
              outerRadius={40}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 space-y-2 sm:space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-[11px] sm:text-sm text-slate-600">{item.name}</span>
            </div>
            <span className="font-semibold text-slate-900 text-sm sm:text-base">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Recent Activity Item
function ActivityItem({ icon: Icon, title, description, time, color }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    amber: 'bg-amber-100 text-amber-600',
    rose: 'bg-rose-100 text-rose-600',
  }

  return (
    <div className="flex items-start gap-2.5 sm:gap-4 py-2 sm:py-3">
      <div className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl ${colorClasses[color]}`}>
        <Icon size={14} className="sm:w-4 sm:h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900 text-xs sm:text-sm">{title}</p>
        <p className="text-[11px] sm:text-sm text-slate-500 truncate">{description}</p>
      </div>
      <span className="text-[10px] sm:text-xs text-slate-400 whitespace-nowrap">{time}</span>
    </div>
  )
}

// Quick Action Card
function QuickAction({ icon: Icon, title, description, onClick, color }) {
  const colorClasses = {
    blue: 'group-hover:bg-blue-50 group-hover:text-blue-600',
    emerald: 'group-hover:bg-emerald-50 group-hover:text-emerald-600',
    violet: 'group-hover:bg-violet-50 group-hover:text-violet-600',
    amber: 'group-hover:bg-amber-50 group-hover:text-amber-600',
  }

  return (
    <button 
      onClick={onClick}
      className="group flex items-center gap-2.5 sm:gap-4 p-2.5 sm:p-4 rounded-lg sm:rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all text-left w-full"
    >
      <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl bg-slate-100 text-slate-500 transition-colors ${colorClasses[color]}`}>
        <Icon size={16} className="sm:w-5 sm:h-5" />
      </div>
      <div>
        <p className="font-medium text-slate-900 text-xs sm:text-base">{title}</p>
        <p className="text-[11px] sm:text-sm text-slate-500">{description}</p>
      </div>
    </button>
  )
}

// Upcoming Deadline Item
function DeadlineItem({ title, date, priority, caseTitle }) {
  const priorityClasses = {
    urgente: 'bg-rose-100 text-rose-700',
    alta: 'bg-amber-100 text-amber-700',
    normal: 'bg-blue-100 text-blue-700',
    baixa: 'bg-slate-100 text-slate-600',
  }

  return (
    <div className="flex items-center gap-2.5 sm:gap-4 py-2 sm:py-3 border-b border-slate-100 last:border-0">
      <div className="flex-shrink-0 w-10 sm:w-12 text-center">
        <p className="text-lg sm:text-2xl font-bold text-slate-900">{new Date(date).getDate()}</p>
        <p className="text-[10px] sm:text-xs text-slate-500 uppercase">
          {new Date(date).toLocaleDateString('pt-BR', { month: 'short' })}
        </p>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900 truncate text-xs sm:text-base">{title}</p>
        <p className="text-[11px] sm:text-sm text-slate-500 truncate">{caseTitle}</p>
      </div>
      <span className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${priorityClasses[priority] || priorityClasses.normal}`}>
        {priority || 'Normal'}
      </span>
    </div>
  )
}

export default function Dashboard() {
  const { data: clients = [], isLoading: loadingClients, isError: errorClients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientService.getAll(100),
  })

  const { data: cases = [], isLoading: loadingCases, isError: errorCases } = useQuery({
    queryKey: ['cases'],
    queryFn: () => caseService.getAll(null, 100),
  })

  const isLoading = loadingClients || loadingCases
  const hasError = errorClients || errorCases

  // Métricas calculadas
  const activeCases = cases.filter(c => c.status === 'em_andamento').length
  const pendingCases = cases.filter(c => c.status === 'aguardando').length
  const urgentCases = cases.filter(c => c.priority === 'urgente').length
  const totalClients = clients.length
  const totalCases = cases.length

  // Mock data for charts (replace with real data later)
  const activityData = [
    { name: 'Seg', value: 12 },
    { name: 'Ter', value: 19 },
    { name: 'Qua', value: 15 },
    { name: 'Qui', value: 22 },
    { name: 'Sex', value: 18 },
    { name: 'Sáb', value: 8 },
    { name: 'Dom', value: 5 },
  ]

  // Recent activities (mock - replace with real data)
  const recentActivities = [
    { icon: FileText, title: 'Documento adicionado', description: 'Petição inicial - Processo #2024-001', time: '5 min', color: 'blue' },
    { icon: Users, title: 'Novo cliente', description: 'Maria Silva cadastrada no sistema', time: '1 hora', color: 'emerald' },
    { icon: Target, title: 'Tarefa concluída', description: 'Análise de contrato finalizada', time: '2 horas', color: 'amber' },
    { icon: Briefcase, title: 'Processo atualizado', description: 'Status alterado para Em Andamento', time: '3 horas', color: 'blue' },
  ]

  // Upcoming deadlines (mock - replace with real data)
  const upcomingDeadlines = [
    { title: 'Prazo para contestação', date: '2025-12-10', priority: 'urgente', caseTitle: 'João vs. Empresa X' },
    { title: 'Audiência de conciliação', date: '2025-12-15', priority: 'alta', caseTitle: 'Maria Silva - Trabalhista' },
    { title: 'Entrega de documentos', date: '2025-12-20', priority: 'normal', caseTitle: 'Contrato ABC Ltda' },
  ]

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 mb-4 rounded-full bg-rose-100 flex items-center justify-center">
          <AlertCircle size={32} className="text-rose-500" />
        </div>
        <h2 className="text-xl font-semibold text-slate-800 mb-2">Erro ao carregar dados</h2>
        <p className="text-slate-500 mb-4">Verifique sua conexão e tente novamente.</p>
        <button 
          onClick={() => window.location.reload()}
          className="btn btn-primary"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5 sm:space-y-7">
      {/* Header Personalizado */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl sm:rounded-2xl p-3 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
          <div>
            <p className="text-primary-100 text-[10px] sm:text-sm font-medium mb-0.5 sm:mb-1">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <h1 className="text-base sm:text-2xl lg:text-3xl font-bold">Olá, bem-vindo! 👋</h1>
            <p className="text-primary-100 mt-0.5 sm:mt-2 text-[11px] sm:text-sm">
              <span className="text-white font-semibold">{activeCases}</span> processos em andamento
              {urgentCases > 0 && (
                <span> • <span className="text-warning-300 font-semibold">{urgentCases}</span> urgentes</span>
              )}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
            <Calendar size={18} className="text-primary-200" />
            <span className="text-sm">{new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {isLoading ? (
          <>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="card p-3 sm:p-6">
                <Skeleton className="w-8 sm:w-12 h-8 sm:h-12 rounded-lg sm:rounded-xl mb-2 sm:mb-4" />
                <Skeleton className="h-5 sm:h-8 w-14 sm:w-20 mb-1 sm:mb-2" />
                <Skeleton className="h-3 sm:h-4 w-20 sm:w-32" />
              </div>
            ))}
          </>
        ) : (
          <>
            <StatCard
              title="Total de Clientes"
              value={totalClients}
              change="+12%"
              changeType="up"
              icon={Users}
              color="blue"
              link="/clients"
            />
            <StatCard
              title="Total de Processos"
              value={totalCases}
              change="+8%"
              changeType="up"
              icon={Briefcase}
              color="emerald"
              link="/cases"
            />
            <StatCard
              title="Em Andamento"
              value={activeCases}
              change={`${pendingCases} aguardando`}
              changeType="neutral"
              icon={Clock}
              color="amber"
              link="/cases"
            />
            <StatCard
              title="Urgentes"
              value={urgentCases}
              change={urgentCases > 0 ? 'Atenção!' : 'Tudo ok'}
              changeType={urgentCases > 0 ? 'down' : 'up'}
              icon={AlertTriangle}
              color="rose"
              link="/cases"
            />
          </>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">
        {/* Activity Chart */}
        <div className="lg:col-span-2 card">
          <div className="card-header flex items-center justify-between py-3 px-3 sm:px-6 sm:py-4">
            <div>
              <h2 className="font-semibold text-slate-900 text-sm sm:text-base">Atividade Semanal</h2>
              <p className="text-[11px] sm:text-sm text-slate-500">Ações realizadas nos últimos 7 dias</p>
            </div>
            <button className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <MoreHorizontal size={16} className="sm:w-5 sm:h-5 text-slate-400" />
            </button>
          </div>
          <div className="card-body p-3 sm:p-6">
            <ActivityChart data={activityData} />
          </div>
        </div>

        {/* Cases Status */}
        <div className="card">
          <div className="card-header py-3 px-3 sm:px-6 sm:py-4">
            <h2 className="font-semibold text-slate-900 text-sm sm:text-base">Status dos Processos</h2>
            <p className="text-[11px] sm:text-sm text-slate-500">Distribuição por situação</p>
          </div>
          <div className="card-body p-3 sm:p-6">
            {isLoading ? (
              <div className="flex items-center gap-4 sm:gap-6">
                <Skeleton className="w-24 h-24 sm:w-32 sm:h-32 rounded-full" />
                <div className="flex-1 space-y-2 sm:space-y-3">
                  <Skeleton className="h-3 sm:h-4 w-full" />
                  <Skeleton className="h-3 sm:h-4 w-full" />
                  <Skeleton className="h-3 sm:h-4 w-full" />
                </div>
              </div>
            ) : (
              <CasesStatusChart cases={cases} />
            )}
          </div>
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">
        {/* Quick Actions */}
        <div className="card">
          <div className="card-header py-3 px-3 sm:px-6 sm:py-4">
            <h2 className="font-semibold text-slate-900 text-sm sm:text-base">Ações Rápidas</h2>
            <p className="text-[11px] sm:text-sm text-slate-500">Acesso rápido às principais funções</p>
          </div>
          <div className="card-body p-3 sm:p-6 space-y-2 sm:space-y-3">
            <QuickAction
              icon={Users}
              title="Novo Cliente"
              description="Cadastrar novo cliente"
              color="blue"
              onClick={() => {}}
            />
            <QuickAction
              icon={Briefcase}
              title="Novo Processo"
              description="Abrir novo processo"
              color="emerald"
              onClick={() => {}}
            />
            <QuickAction
              icon={FileText}
              title="Gerar Documento"
              description="Criar a partir de template"
              color="violet"
              onClick={() => {}}
            />
            <QuickAction
              icon={Target}
              title="Nova Tarefa"
              description="Adicionar tarefa"
              color="amber"
              onClick={() => {}}
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="card-header flex items-center justify-between py-3 px-3 sm:px-6 sm:py-4">
            <div>
              <h2 className="font-semibold text-slate-900 text-sm sm:text-base">Atividade Recente</h2>
              <p className="text-[11px] sm:text-sm text-slate-500">Últimas atualizações</p>
            </div>
            <Link to="/tasks" className="text-[11px] sm:text-sm text-primary-600 hover:text-primary-700 font-medium">
              Ver todas
            </Link>
          </div>
          <div className="card-body p-3 sm:p-6 divide-y divide-slate-100">
            {recentActivities.map((activity, index) => (
              <ActivityItem key={index} {...activity} />
            ))}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="card">
          <div className="card-header flex items-center justify-between py-3 px-3 sm:px-6 sm:py-4">
            <div>
              <h2 className="font-semibold text-slate-900 text-sm sm:text-base">Próximos Prazos</h2>
              <p className="text-[11px] sm:text-sm text-slate-500">Compromissos importantes</p>
            </div>
            <Link to="/calendar" className="text-[11px] sm:text-sm text-primary-600 hover:text-primary-700 font-medium">
              Ver agenda
            </Link>
          </div>
          <div className="card-body p-3 sm:p-6">
            {upcomingDeadlines.map((deadline, index) => (
              <DeadlineItem key={index} {...deadline} />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="card bg-gradient-to-r from-primary-600 to-primary-700 border-0">
        <div className="card-body p-3 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-4">
            <div className="p-2 sm:p-3 bg-white/20 rounded-lg sm:rounded-xl">
              <Sparkles size={18} className="sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="text-white">
              <h3 className="font-semibold text-sm sm:text-lg">Experimente a IA Assistente Jurídica</h3>
              <p className="text-white/80 text-[11px] sm:text-sm">Análise de documentos e respostas inteligentes</p>
            </div>
          </div>
          <button className="btn bg-white text-primary-700 hover:bg-white/90 shadow-lg text-xs sm:text-sm w-full sm:w-auto">
            <Zap size={14} className="sm:w-[18px] sm:h-[18px]" />
            Experimentar
          </button>
        </div>
      </div>
    </div>
  )
}
