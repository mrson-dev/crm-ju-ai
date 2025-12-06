/**
 * Página de Controle Financeiro
 * Dashboard financeiro com honorários, despesas, faturas e relatórios
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  Plus,
  Filter,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  CreditCard,
  Receipt,
  PieChart,
  BarChart3,
  Calendar,
  Search,
  MoreVertical,
  Eye,
  Send,
  X,
  Banknote,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Briefcase
} from 'lucide-react'
import { 
  feeService, 
  expenseService, 
  invoiceService, 
  financialReportService,
  financialOptionsService 
} from '@/services/financialService'
import { clientService, caseService } from '@/services/crmService'
import { useToast } from '@/components/common'
import PageHeader from '@/components/common/PageHeader'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart as RechartsPie,
  Pie,
  Cell
} from 'recharts'

// Cores para gráficos
const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

// Status badges
const statusConfig = {
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  partial: { label: 'Parcial', color: 'bg-blue-100 text-blue-800', icon: TrendingUp },
  paid: { label: 'Pago', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: 'bg-gray-100 text-gray-800', icon: X },
  draft: { label: 'Rascunho', color: 'bg-gray-100 text-gray-600', icon: FileText },
  sent: { label: 'Enviada', color: 'bg-blue-100 text-blue-800', icon: Send },
  overdue: { label: 'Vencido', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
  approved: { label: 'Aprovado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  reimbursed: { label: 'Reembolsado', color: 'bg-purple-100 text-purple-800', icon: Banknote },
  rejected: { label: 'Rejeitado', color: 'bg-red-100 text-red-800', icon: X }
}

// Tipos de honorários
const feeTypeLabels = {
  fixed: 'Valor Fixo',
  hourly: 'Por Hora',
  success: 'Êxito',
  contingency: 'Ad Exitum'
}

// Categorias de despesas
const expenseCategoryLabels = {
  custas: 'Custas Processuais',
  viagem: 'Viagem',
  copia: 'Cópias',
  cartorio: 'Cartório',
  perito: 'Perito',
  correio: 'Correio',
  outros: 'Outros'
}

function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.pending
  const Icon = config.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      <Icon size={12} />
      {config.label}
    </span>
  )
}

function StatCard({ title, value, subtitle, icon: Icon, trend, trendValue, color = 'primary' }) {
  const colorClasses = {
    primary: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    blue: 'bg-indigo-50 text-indigo-600'
  }

  return (
    <div className="bg-gradient-to-br from-white to-slate-50 rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-lg transition-all duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-600 font-medium">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">
            {typeof value === 'number' ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : value}
          </p>
          {subtitle && <p className="text-xs text-slate-500 mt-1.5 font-medium">{subtitle}</p>}
          {trend && (
            <div className={`flex items-center gap-1.5 mt-3 text-sm font-semibold ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        <div className={`p-4 rounded-xl ${colorClasses[color]} shadow-sm`}>
          <Icon size={26} />
        </div>
      </div>
    </div>
  )
}

function CashFlowChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Sem dados de fluxo de caixa
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="month_name" 
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => value.split(' ')[0].slice(0, 3)}
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip 
          formatter={(value) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '']}
          labelFormatter={(label) => label}
        />
        <Bar dataKey="income" name="Receitas" fill="#10B981" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expenses" name="Despesas" fill="#EF4444" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// Modal de criação de honorário
function FeeModal({ isOpen, onClose, clients, cases, onSuccess }) {
  const [formData, setFormData] = useState({
    client_id: '',
    case_id: '',
    fee_type: 'fixed',
    amount: '',
    description: '',
    due_date: '',
    installments: 1
  })
  const { showSuccess, showError } = useToast()
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: feeService.create,
    onSuccess: () => {
      showSuccess('Honorário criado com sucesso!')
      queryClient.invalidateQueries(['fees'])
      queryClient.invalidateQueries(['financial-summary'])
      onClose()
      onSuccess?.()
    },
    onError: (error) => showError(error.message)
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    createMutation.mutate({
      ...formData,
      amount: parseFloat(formData.amount)
    })
  }

  const filteredCases = formData.client_id 
    ? cases.filter(c => c.client_id === formData.client_id)
    : cases

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Novo Honorário</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
              <select
                value={formData.client_id}
                onChange={(e) => setFormData({ ...formData, client_id: e.target.value, case_id: '' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
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
                value={formData.case_id}
                onChange={(e) => setFormData({ ...formData, case_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Selecione...</option>
                {filteredCases.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
              <select
                value={formData.fee_type}
                onChange={(e) => setFormData({ ...formData, fee_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="fixed">Valor Fixo</option>
                <option value="hourly">Por Hora</option>
                <option value="success">Êxito</option>
                <option value="contingency">Ad Exitum</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$) *</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="0,00"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              rows={2}
              placeholder="Descrição do honorário..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vencimento</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Parcelas</label>
              <input
                type="number"
                min="1"
                max="48"
                value={formData.installments}
                onChange={(e) => setFormData({ ...formData, installments: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Salvando...' : 'Criar Honorário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Modal de criação de despesa
function ExpenseModal({ isOpen, onClose, clients, cases, onSuccess }) {
  const [formData, setFormData] = useState({
    client_id: '',
    case_id: '',
    category: 'custas',
    amount: '',
    description: '',
    expense_date: format(new Date(), 'yyyy-MM-dd'),
    reimbursable: true
  })
  const { showSuccess, showError } = useToast()
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: expenseService.create,
    onSuccess: () => {
      showSuccess('Despesa registrada com sucesso!')
      queryClient.invalidateQueries(['expenses'])
      queryClient.invalidateQueries(['financial-summary'])
      onClose()
      onSuccess?.()
    },
    onError: (error) => showError(error.message)
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    createMutation.mutate({
      ...formData,
      amount: parseFloat(formData.amount)
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Nova Despesa</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
              <select
                value={formData.client_id}
                onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Sem cliente</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Processo</label>
              <select
                value={formData.case_id}
                onChange={(e) => setFormData({ ...formData, case_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Sem processo</option>
                {cases.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="custas">Custas Processuais</option>
                <option value="viagem">Viagem/Deslocamento</option>
                <option value="copia">Cópias/Impressões</option>
                <option value="cartorio">Cartório</option>
                <option value="perito">Perito/Especialista</option>
                <option value="correio">Correio/Sedex</option>
                <option value="outros">Outros</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$) *</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="0,00"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              rows={2}
              placeholder="Descrição da despesa..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data *</label>
              <input
                type="date"
                value={formData.expense_date}
                onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.reimbursable}
                  onChange={(e) => setFormData({ ...formData, reimbursable: e.target.checked })}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Reembolsável pelo cliente</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Salvando...' : 'Registrar Despesa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Modal de pagamento
function PaymentModal({ isOpen, onClose, item, type, onSuccess }) {
  const [formData, setFormData] = useState({
    amount: item?.amount_pending || 0,
    payment_method: 'pix',
    payment_date: format(new Date(), 'yyyy-MM-dd'),
    notes: ''
  })
  const { showSuccess, showError } = useToast()
  const queryClient = useQueryClient()

  const paymentMutation = useMutation({
    mutationFn: () => {
      if (type === 'fee') {
        return feeService.recordPayment(item.id, formData)
      } else {
        return invoiceService.recordPayment(item.id, formData)
      }
    },
    onSuccess: () => {
      showSuccess('Pagamento registrado com sucesso!')
      queryClient.invalidateQueries(['fees'])
      queryClient.invalidateQueries(['invoices'])
      queryClient.invalidateQueries(['financial-summary'])
      onClose()
      onSuccess?.()
    },
    onError: (error) => showError(error.message)
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    paymentMutation.mutate()
  }

  if (!isOpen || !item) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Registrar Pagamento</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">Valor pendente</p>
            <p className="text-2xl font-bold text-gray-900">
              R$ {item.amount_pending?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor do Pagamento *</label>
            <input
              type="number"
              step="0.01"
              max={item.amount_pending}
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pagamento *</label>
            <select
              value={formData.payment_method}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="pix">PIX</option>
              <option value="boleto">Boleto Bancário</option>
              <option value="cartao">Cartão de Crédito</option>
              <option value="transferencia">Transferência Bancária</option>
              <option value="dinheiro">Dinheiro</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data do Pagamento *</label>
            <input
              type="date"
              value={formData.payment_date}
              onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              rows={2}
              placeholder="Observações sobre o pagamento..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={paymentMutation.isPending}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {paymentMutation.isPending ? 'Registrando...' : 'Confirmar Pagamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Componente principal
export default function Financial() {
  const [activeTab, setActiveTab] = useState('overview')
  const [showFeeModal, setShowFeeModal] = useState(false)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [paymentItem, setPaymentItem] = useState(null)
  const [paymentType, setPaymentType] = useState(null)
  const [filters, setFilters] = useState({
    status: '',
    client_id: '',
    search: ''
  })

  // Queries
  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['financial-summary'],
    queryFn: () => financialReportService.getSummary()
  })

  const { data: cashFlow = [] } = useQuery({
    queryKey: ['cash-flow'],
    queryFn: () => financialReportService.getCashFlow(6)
  })

  const { data: overdue } = useQuery({
    queryKey: ['overdue-items'],
    queryFn: () => financialReportService.getOverdue()
  })

  const { data: fees = [] } = useQuery({
    queryKey: ['fees', filters],
    queryFn: () => feeService.list({ status: filters.status, client_id: filters.client_id }),
    enabled: activeTab === 'fees'
  })

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses', filters],
    queryFn: () => expenseService.list({ status: filters.status, client_id: filters.client_id }),
    enabled: activeTab === 'expenses'
  })

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices', filters],
    queryFn: () => invoiceService.list({ status: filters.status, client_id: filters.client_id }),
    enabled: activeTab === 'invoices'
  })

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientService.getAll()
  })

  const { data: cases = [] } = useQuery({
    queryKey: ['cases'],
    queryFn: () => caseService.getAll()
  })

  const handlePayment = (item, type) => {
    setPaymentItem(item)
    setPaymentType(type)
  }

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: PieChart },
    { id: 'fees', label: 'Honorários', icon: DollarSign },
    { id: 'expenses', label: 'Despesas', icon: Receipt },
    { id: 'invoices', label: 'Faturas', icon: FileText }
  ]

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId)
    return client?.name || 'Cliente não encontrado'
  }

  return (
    <div className="space-y-5 sm:space-y-7">
      <PageHeader
        title="Controle Financeiro"
        description="Gerencie honorários, despesas e faturas do escritório."
        icon={DollarSign}
        actions={[
          <button
            key="expense"
            onClick={() => setShowExpenseModal(true)}
            className="btn btn-secondary w-full flex items-center justify-center gap-2"
          >
            <Receipt size={18} />
            Nova Despesa
          </button>,
          <button
            key="fee"
            onClick={() => setShowFeeModal(true)}
            className="btn btn-primary w-full flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            Novo Honorário
          </button>
        ]}
      />

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Receita Bruta"
              value={summary?.balance?.gross_revenue || 0}
              subtitle="Total recebido"
              icon={TrendingUp}
              color="green"
            />
            <StatCard
              title="A Receber"
              value={summary?.balance?.receivables || 0}
              subtitle={`${summary?.fees?.by_status?.pending || 0} honorários pendentes`}
              icon={Clock}
              color="yellow"
            />
            <StatCard
              title="Despesas"
              value={summary?.expenses?.total || 0}
              subtitle={`${summary?.expenses?.count || 0} registradas`}
              icon={TrendingDown}
              color="red"
            />
            <StatCard
              title="Resultado Líquido"
              value={summary?.balance?.net_after_expenses || 0}
              subtitle="Receita - Despesas"
              icon={DollarSign}
              color="primary"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cash Flow Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Fluxo de Caixa</h3>
              <CashFlowChart data={cashFlow} />
            </div>

            {/* Overdue Items */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Itens em Atraso</h3>
                {overdue?.count > 0 && (
                  <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                    {overdue.count} {overdue.count === 1 ? 'item' : 'itens'}
                  </span>
                )}
              </div>
              
              {overdue?.count > 0 ? (
                <div className="space-y-3">
                  <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-red-700 mb-2">
                      <AlertTriangle size={18} />
                      <span className="font-medium">Total em atraso</span>
                    </div>
                    <p className="text-2xl font-bold text-red-700">
                      R$ {overdue.total_overdue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {overdue.fees?.slice(0, 5).map(fee => (
                      <div key={fee.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{fee.description}</p>
                          <p className="text-xs text-gray-500">Vencido em {fee.due_date}</p>
                        </div>
                        <span className="font-semibold text-red-600">
                          R$ {fee.amount_pending?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                    {overdue.invoices?.slice(0, 5).map(invoice => (
                      <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">Fatura #{invoice.invoice_number}</p>
                          <p className="text-xs text-gray-500">Vencida em {invoice.due_date}</p>
                        </div>
                        <span className="font-semibold text-red-600">
                          R$ {invoice.amount_pending?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                  <CheckCircle size={48} className="mb-2 text-green-400" />
                  <p>Nenhum item em atraso!</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <DollarSign className="text-blue-600" size={20} />
                </div>
                <h3 className="font-semibold text-gray-900">Honorários</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total</span>
                  <span className="font-medium">R$ {summary?.fees?.total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Recebido</span>
                  <span className="font-medium text-green-600">R$ {summary?.fees?.received?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Pendente</span>
                  <span className="font-medium text-yellow-600">R$ {summary?.fees?.pending?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <FileText className="text-purple-600" size={20} />
                </div>
                <h3 className="font-semibold text-gray-900">Faturas</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total</span>
                  <span className="font-medium">R$ {summary?.invoices?.total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Recebido</span>
                  <span className="font-medium text-green-600">R$ {summary?.invoices?.received?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Em atraso</span>
                  <span className="font-medium text-red-600">R$ {summary?.invoices?.overdue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <Receipt className="text-orange-600" size={20} />
                </div>
                <h3 className="font-semibold text-gray-900">Despesas</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total</span>
                  <span className="font-medium">R$ {summary?.expenses?.total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Reembolsável</span>
                  <span className="font-medium">R$ {summary?.expenses?.reimbursable?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Pendente reembolso</span>
                  <span className="font-medium text-orange-600">R$ {summary?.expenses?.pending_reimbursement?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fees Tab */}
      {activeTab === 'fees' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Buscar honorários..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Todos os status</option>
                <option value="pending">Pendente</option>
                <option value="partial">Parcial</option>
                <option value="paid">Pago</option>
              </select>
              <select
                value={filters.client_id}
                onChange={(e) => setFilters({ ...filters, client_id: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Todos os clientes</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Fees List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Pendente</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {fees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      Nenhum honorário encontrado
                    </td>
                  </tr>
                ) : (
                  fees.map(fee => (
                    <tr key={fee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{fee.description}</p>
                        {fee.due_date && (
                          <p className="text-sm text-gray-500">Vence em {fee.due_date}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {getClientName(fee.client_id)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{feeTypeLabels[fee.fee_type]}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        R$ {fee.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={fee.amount_pending > 0 ? 'text-yellow-600 font-medium' : 'text-green-600'}>
                          R$ {fee.amount_pending?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <StatusBadge status={fee.status} />
                      </td>
                      <td className="px-6 py-4 text-center">
                        {fee.status !== 'paid' && (
                          <button
                            onClick={() => handlePayment(fee, 'fee')}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 text-sm"
                          >
                            <Banknote size={14} />
                            Pagar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expenses Tab */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Buscar despesas..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Todos os status</option>
                <option value="pending">Pendente</option>
                <option value="approved">Aprovado</option>
                <option value="reimbursed">Reembolsado</option>
              </select>
            </div>
          </div>

          {/* Expenses List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Reembolsável</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      Nenhuma despesa encontrada
                    </td>
                  </tr>
                ) : (
                  expenses.map(expense => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{expense.description}</p>
                        {expense.client_id && (
                          <p className="text-sm text-gray-500">{getClientName(expense.client_id)}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {expenseCategoryLabels[expense.category]}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {expense.expense_date}
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        R$ {expense.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {expense.reimbursable ? (
                          <CheckCircle size={18} className="text-green-500 mx-auto" />
                        ) : (
                          <X size={18} className="text-gray-400 mx-auto" />
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <StatusBadge status={expense.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Buscar faturas..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Todos os status</option>
                <option value="draft">Rascunho</option>
                <option value="sent">Enviada</option>
                <option value="partial">Parcial</option>
                <option value="paid">Paga</option>
              </select>
              <select
                value={filters.client_id}
                onChange={(e) => setFilters({ ...filters, client_id: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Todos os clientes</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Invoices List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Número</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimento</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Pendente</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      Nenhuma fatura encontrada
                    </td>
                  </tr>
                ) : (
                  invoices.map(invoice => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">#{invoice.invoice_number}</p>
                        <p className="text-sm text-gray-500">{invoice.items?.length || 0} itens</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {getClientName(invoice.client_id)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {invoice.due_date}
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        R$ {invoice.total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={invoice.amount_pending > 0 ? 'text-yellow-600 font-medium' : 'text-green-600'}>
                          R$ {invoice.amount_pending?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <StatusBadge status={invoice.status} />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                            <button
                              onClick={() => handlePayment(invoice, 'invoice')}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 text-sm"
                            >
                              <Banknote size={14} />
                              Pagar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <FeeModal
        isOpen={showFeeModal}
        onClose={() => setShowFeeModal(false)}
        clients={clients}
        cases={cases}
      />

      <ExpenseModal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        clients={clients}
        cases={cases}
      />

      <PaymentModal
        isOpen={!!paymentItem}
        onClose={() => setPaymentItem(null)}
        item={paymentItem}
        type={paymentType}
      />
    </div>
  )
}
