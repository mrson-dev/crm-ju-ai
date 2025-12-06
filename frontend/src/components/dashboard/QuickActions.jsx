import { Link } from 'react-router-dom'
import { Plus, ArrowRight } from 'lucide-react'

export default function QuickActions() {
  const actions = [
    {
      label: 'Novo Cliente',
      description: 'Cadastrar cliente PF ou PJ',
      href: '/clients',
      icon: '👤',
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      label: 'Novo Processo',
      description: 'Abrir novo caso jurídico',
      href: '/cases',
      icon: '📋',
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      label: 'Criar Template',
      description: 'Modelo de documento',
      href: '/templates',
      icon: '📄',
      color: 'bg-purple-500 hover:bg-purple-600',
    },
    {
      label: 'Upload com IA',
      description: 'Extrair dados de documentos',
      href: '/clients',
      icon: '🤖',
      color: 'bg-orange-500 hover:bg-orange-600',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3">
      {actions.map((action) => (
        <Link
          key={action.label}
          to={action.href}
          className={`${action.color} text-white rounded-xl p-4 transition-all hover:shadow-lg hover:scale-[1.02] group`}
        >
          <div className="flex items-start justify-between">
            <span className="text-2xl">{action.icon}</span>
            <ArrowRight 
              size={18} 
              className="opacity-0 group-hover:opacity-100 transition-opacity" 
            />
          </div>
          <h3 className="font-semibold mt-2">{action.label}</h3>
          <p className="text-xs text-white/80 mt-0.5">{action.description}</p>
        </Link>
      ))}
    </div>
  )
}
