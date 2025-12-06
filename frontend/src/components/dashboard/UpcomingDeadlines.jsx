import { format, formatDistanceToNow, parseISO, isAfter, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AlertTriangle, Calendar, Clock, AlertCircle } from 'lucide-react'

export default function UpcomingDeadlines({ cases = [] }) {
  // Simula prazos próximos baseado em processos em andamento
  // Em produção, isso viria de um campo deadline real
  const upcomingItems = cases
    .filter(c => c.status === 'em_andamento' || c.status === 'aguardando')
    .slice(0, 5)
    .map((c, index) => {
      // Simula um prazo para demonstração
      const daysAhead = (index + 1) * 2
      const deadline = addDays(new Date(), daysAhead)
      return {
        ...c,
        deadline,
        daysRemaining: daysAhead,
      }
    })

  const getUrgencyColor = (days) => {
    if (days <= 2) return 'border-red-500 bg-red-50'
    if (days <= 5) return 'border-orange-500 bg-orange-50'
    return 'border-blue-500 bg-blue-50'
  }

  const getUrgencyIcon = (days) => {
    if (days <= 2) return <AlertTriangle className="text-red-500" size={18} />
    if (days <= 5) return <AlertCircle className="text-orange-500" size={18} />
    return <Clock className="text-blue-500" size={18} />
  }

  if (upcomingItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-500">
        <Calendar size={40} className="mb-2 text-gray-400" />
        <p>Nenhum prazo próximo</p>
        <p className="text-sm mt-1">Seus processos estão em dia!</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {upcomingItems.map((item) => (
        <div
          key={item.id}
          className={`border-l-4 ${getUrgencyColor(item.daysRemaining)} rounded-r-lg p-3 transition-all hover:shadow-md`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 line-clamp-1">{item.title}</h4>
              <p className="text-sm text-gray-600 mt-1">
                {item.case_number || 'Sem número de processo'}
              </p>
            </div>
            <div className="flex items-center gap-1 ml-2">
              {getUrgencyIcon(item.daysRemaining)}
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Calendar size={12} />
              {format(item.deadline, "dd/MM/yyyy", { locale: ptBR })}
            </span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              item.daysRemaining <= 2 
                ? 'bg-red-100 text-red-700' 
                : item.daysRemaining <= 5 
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-blue-100 text-blue-700'
            }`}>
              {item.daysRemaining === 1 ? 'Amanhã' : `${item.daysRemaining} dias`}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
