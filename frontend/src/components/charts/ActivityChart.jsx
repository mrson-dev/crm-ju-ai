import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, subDays, parseISO, isAfter } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function ActivityChart({ cases = [], clients = [] }) {
  // Gera dados dos últimos 7 dias
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i)
    return {
      date: format(date, 'yyyy-MM-dd'),
      label: format(date, 'EEE', { locale: ptBR }),
      fullLabel: format(date, 'dd/MM', { locale: ptBR }),
      processos: 0,
      clientes: 0,
    }
  })

  // Conta processos criados por dia
  cases.forEach(c => {
    if (c.created_at) {
      const createdDate = format(parseISO(c.created_at), 'yyyy-MM-dd')
      const dayData = last7Days.find(d => d.date === createdDate)
      if (dayData) dayData.processos++
    }
  })

  // Conta clientes criados por dia
  clients.forEach(c => {
    if (c.created_at) {
      const createdDate = format(parseISO(c.created_at), 'yyyy-MM-dd')
      const dayData = last7Days.find(d => d.date === createdDate)
      if (dayData) dayData.clientes++
    }
  })

  const hasData = last7Days.some(d => d.processos > 0 || d.clientes > 0)

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <p>Nenhuma atividade nos últimos 7 dias</p>
        <p className="text-sm mt-1">Cadastre novos clientes ou processos</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={last7Days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="fullLabel" 
          tick={{ fontSize: 12, fill: '#6B7280' }}
          axisLine={{ stroke: '#E5E7EB' }}
        />
        <YAxis 
          tick={{ fontSize: 12, fill: '#6B7280' }}
          axisLine={{ stroke: '#E5E7EB' }}
          allowDecimals={false}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'white', 
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
          formatter={(value, name) => [value, name === 'processos' ? 'Processos' : 'Clientes']}
          labelFormatter={(label) => `Data: ${label}`}
        />
        <Bar 
          dataKey="processos" 
          name="Processos" 
          fill="#3B82F6" 
          radius={[4, 4, 0, 0]}
          maxBarSize={40}
        />
        <Bar 
          dataKey="clientes" 
          name="Clientes" 
          fill="#10B981" 
          radius={[4, 4, 0, 0]}
          maxBarSize={40}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
