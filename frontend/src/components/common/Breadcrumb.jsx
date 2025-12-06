import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

const routeNames = {
  '': 'Dashboard',
  'clients': 'Clientes',
  'cases': 'Processos',
  'templates': 'Templates',
  'calendar': 'Agenda',
}

export default function Breadcrumb() {
  const location = useLocation()
  const pathnames = location.pathname.split('/').filter(x => x)

  // Não mostrar breadcrumb no dashboard
  if (pathnames.length === 0) return null

  return (
    <nav className="flex items-center gap-2 text-sm mb-6" aria-label="Breadcrumb">
      <Link 
        to="/" 
        className="text-gray-500 hover:text-primary-600 transition-colors flex items-center gap-1"
      >
        <Home size={16} />
        <span className="sr-only">Dashboard</span>
      </Link>
      
      {pathnames.map((value, index) => {
        const isLast = index === pathnames.length - 1
        const to = `/${pathnames.slice(0, index + 1).join('/')}`
        const name = routeNames[value] || value

        return (
          <div key={to} className="flex items-center gap-2">
            <ChevronRight size={16} className="text-gray-400" />
            {isLast ? (
              <span className="text-gray-900 font-medium">{name}</span>
            ) : (
              <Link 
                to={to} 
                className="text-gray-500 hover:text-primary-600 transition-colors"
              >
                {name}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}
