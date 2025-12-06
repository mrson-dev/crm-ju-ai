import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
  UserPlus, 
  Briefcase, 
  FileText, 
  Edit, 
  Trash2, 
  Upload,
  CheckCircle,
  Clock
} from 'lucide-react'

// Gera atividades fictícias baseadas nos dados reais
function generateActivities(cases, clients) {
  const activities = []

  // Adiciona atividades de clientes
  clients.slice(0, 5).forEach(client => {
    if (client.created_at) {
      activities.push({
        id: `client-${client.id}`,
        type: 'client_created',
        icon: UserPlus,
        iconColor: 'text-green-500',
        iconBg: 'bg-green-100',
        title: 'Novo cliente cadastrado',
        description: client.name,
        timestamp: client.created_at,
      })
    }
  })

  // Adiciona atividades de processos
  cases.slice(0, 5).forEach(caseItem => {
    if (caseItem.created_at) {
      activities.push({
        id: `case-${caseItem.id}`,
        type: 'case_created',
        icon: Briefcase,
        iconColor: 'text-blue-500',
        iconBg: 'bg-blue-100',
        title: 'Novo processo criado',
        description: caseItem.title,
        timestamp: caseItem.created_at,
      })
    }

    if (caseItem.status === 'concluido' && caseItem.updated_at) {
      activities.push({
        id: `case-completed-${caseItem.id}`,
        type: 'case_completed',
        icon: CheckCircle,
        iconColor: 'text-emerald-500',
        iconBg: 'bg-emerald-100',
        title: 'Processo concluído',
        description: caseItem.title,
        timestamp: caseItem.updated_at,
      })
    }
  })

  // Ordena por data mais recente
  return activities
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 8)
}

export default function RecentActivity({ cases = [], clients = [] }) {
  const activities = generateActivities(cases, clients)

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-500">
        <Clock size={40} className="mb-2 text-gray-400" />
        <p>Nenhuma atividade recente</p>
        <p className="text-sm mt-1">Comece cadastrando um cliente</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-200" />
      
      <div className="space-y-4">
        {activities.map((activity, index) => {
          const Icon = activity.icon
          return (
            <div key={activity.id} className="relative flex items-start gap-4 pl-2">
              {/* Icon */}
              <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full ${activity.iconBg}`}>
                <Icon size={16} className={activity.iconColor} />
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                <p className="text-sm text-gray-600 truncate">{activity.description}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatDistanceToNow(parseISO(activity.timestamp), { 
                    addSuffix: true, 
                    locale: ptBR 
                  })}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
