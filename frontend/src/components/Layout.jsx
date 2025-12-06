/**
 * Layout Principal Responsivo
 * Sidebar fixa recolhida com tooltips + Navbar completa + Mobile First
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { Outlet, Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { clientService, caseService } from '@/services/crmService'
import logger from '@/utils/logger'
import { 
  Home, 
  Users, 
  Briefcase, 
  FileText, 
  LogOut, 
  Calendar,
  Search,
  X,
  User,
  Scale,
  Bell,
  ChevronRight,
  Target,
  Clock,
  FilePlus2,
  DollarSign,
  Settings,
  HelpCircle,
  Menu,
  Sparkles,
  Command,
  LayoutDashboard,
  Plus,
  MessageSquare,
  ChevronDown,
  MoreHorizontal
} from 'lucide-react'

// ============ TOOLTIP COMPONENT ============
function Tooltip({ children, content, position = 'right' }) {
  const [show, setShow] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const triggerRef = useRef(null)
  
  const handleMouseEnter = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      
      if (position === 'right') {
        setCoords({
          top: rect.top + rect.height / 2,
          left: rect.right + 12
        })
      } else if (position === 'bottom') {
        setCoords({
          top: rect.bottom + 8,
          left: rect.left + rect.width / 2
        })
      } else if (position === 'top') {
        setCoords({
          top: rect.top - 8,
          left: rect.left + rect.width / 2
        })
      }
    }
    setShow(true)
  }, [position])

  return (
    <div 
      ref={triggerRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div 
          className="fixed z-[9999] animate-fade-in pointer-events-none"
          style={{
            top: position === 'top' ? 'auto' : coords.top,
            bottom: position === 'top' ? `calc(100vh - ${coords.top}px)` : 'auto',
            left: coords.left,
            transform: position === 'right' ? 'translateY(-50%)' : 'translateX(-50%)'
          }}
        >
          <div className="bg-slate-800 text-white text-sm font-medium px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl border border-slate-700">
            {content}
          </div>
        </div>
      )}
    </div>
  )
}

// ============ GLOBAL SEARCH COMPONENT ============
function GlobalSearch({ isOpen, onClose }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState({ clients: [], cases: [] })
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isSearching, setIsSearching] = useState(false)
  const inputRef = useRef(null)
  const searchTimeoutRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
    return () => {
      setQuery('')
      setResults({ clients: [], cases: [] })
      setSelectedIndex(0)
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [isOpen])

  // Busca debounced usando API do backend
  useEffect(() => {
    if (query.length < 2) {
      setResults({ clients: [], cases: [] })
      setIsSearching(false)
      return
    }

    setIsSearching(true)

    // Debounce de 300ms
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        // Busca em paralelo
        const [clientsResult, casesResult] = await Promise.allSettled([
          clientService.search(query),
          caseService.getAll(null, 20) // TODO: Criar endpoint de busca para cases
        ])

        const filteredClients = clientsResult.status === 'fulfilled' 
          ? clientsResult.value.slice(0, 5) 
          : []
        
        // Filtra cases localmente (temporário até criar endpoint de busca)
        const allCases = casesResult.status === 'fulfilled' ? casesResult.value : []
        const lowerQuery = query.toLowerCase()
        const filteredCases = allCases.filter(c =>
          c.title?.toLowerCase().includes(lowerQuery) ||
          c.case_number?.toLowerCase().includes(lowerQuery)
        ).slice(0, 5)

        setResults({ clients: filteredClients, cases: filteredCases })
        setSelectedIndex(0)
      } catch (error) {
        logger.error('Erro na busca global', error, { query })
        setResults({ clients: [], cases: [] })
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [query])

  const allResults = [...results.clients.map(c => ({ type: 'clients', ...c })), ...results.cases.map(c => ({ type: 'cases', ...c }))]

  const handleSelect = useCallback((type, id) => {
    onClose()
    setQuery('')
    navigate(`/${type}/${id}`)
  }, [navigate, onClose])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, allResults.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter' && allResults[selectedIndex]) {
        e.preventDefault()
        const item = allResults[selectedIndex]
        handleSelect(item.type, item.id)
      }
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose, allResults, selectedIndex, handleSelect])

  if (!isOpen) return null

  const hasResults = results.clients.length > 0 || results.cases.length > 0

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative max-w-2xl mx-auto mt-[15vh] px-4 animate-fade-in-down">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200">
            {isSearching ? (
              <div className="w-5 h-5 border-2 border-slate-300 border-t-primary-600 rounded-full animate-spin" />
            ) : (
              <Search size={20} className="text-slate-500" />
            )}
            <input
              ref={inputRef}
              type="text"
              placeholder="Buscar clientes, processos..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 text-base text-slate-800 placeholder:text-slate-400 bg-transparent outline-none"
            />
            {query && (
              <button 
                onClick={() => setQuery('')}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={18} className="text-slate-400" />
              </button>
            )}
            <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-lg text-xs text-slate-500 font-medium">
              ESC
            </kbd>
          </div>

          {/* Results */}
          {query.length >= 2 && (
            <div className="max-h-[50vh] overflow-y-auto">
              {hasResults ? (
                <div className="p-2">
                  {results.clients.length > 0 && (
                    <div className="mb-2">
                      <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Clientes
                      </div>
                      {results.clients.map((client, idx) => {
                        const isSelected = selectedIndex === idx
                        return (
                          <button
                            key={client.id}
                            onClick={() => handleSelect('clients', client.id)}
                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                              isSelected ? 'bg-primary-100 text-primary-800' : 'hover:bg-slate-100'
                            }`}
                          >
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center text-white font-semibold shadow-sm">
                              {client.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 text-left">
                              <p className="font-medium text-slate-800">{client.name}</p>
                              <p className="text-sm text-slate-500">{client.email || client.phone}</p>
                            </div>
                            <ChevronRight size={16} className="text-slate-400" />
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {results.cases.length > 0 && (
                    <div>
                      <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Processos
                      </div>
                      {results.cases.map((caseItem, idx) => {
                        const globalIdx = results.clients.length + idx
                        const isSelected = selectedIndex === globalIdx
                        return (
                          <button
                            key={caseItem.id}
                            onClick={() => handleSelect('cases', caseItem.id)}
                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                              isSelected ? 'bg-primary-100 text-primary-800' : 'hover:bg-slate-100'
                            }`}
                          >
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-success-600 to-success-700 flex items-center justify-center text-white shadow-sm">
                              <Briefcase size={18} />
                            </div>
                            <div className="flex-1 text-left">
                              <p className="font-medium text-slate-800">{caseItem.title}</p>
                              <p className="text-sm text-slate-500">{caseItem.case_number || 'Sem número'}</p>
                            </div>
                            <ChevronRight size={16} className="text-slate-400" />
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
                    <Search size={20} className="text-slate-400" />
                  </div>
                  <p className="text-slate-500">Nenhum resultado encontrado</p>
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {query.length < 2 && (
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles size={18} className="text-primary-500" />
                <span className="text-sm font-medium text-slate-600">Dicas de busca</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {['Nome do cliente', 'Nº processo', 'E-mail', 'CPF/CNPJ'].map((tip) => (
                  <div key={tip} className="px-3 py-1.5 bg-slate-100 rounded-full text-sm text-slate-600">
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============ NOTIFICATION DROPDOWN ============
function NotificationDropdown({ isOpen, onClose, isMobile = false }) {
  if (!isOpen) return null

  const notifications = [
    { id: 1, title: 'Novo prazo', message: 'Processo #2024-001 vence em 3 dias', time: '5 min', unread: true },
    { id: 2, title: 'Documento assinado', message: 'Cliente João Silva assinou', time: '1h', unread: true },
    { id: 3, title: 'Tarefa concluída', message: 'Petição inicial protocolada', time: '2h', unread: false },
  ]

  const content = (
    <div className={`bg-white overflow-hidden ${isMobile ? 'rounded-none' : 'rounded-2xl shadow-2xl border border-slate-200'}`}>
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <h3 className="font-semibold text-slate-800">Notificações</h3>
        <span className="text-xs text-primary-600 hover:text-primary-700 cursor-pointer font-medium">
          Marcar como lidas
        </span>
      </div>
      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
        {notifications.map((notif) => (
          <div 
            key={notif.id} 
            className={`px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors ${
              notif.unread ? 'bg-primary-50/50' : ''
            }`}
          >
            <div className="flex items-start gap-3">
              {notif.unread && <div className="w-2 h-2 mt-2 rounded-full bg-primary-600 flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 text-sm">{notif.title}</p>
                <p className="text-sm text-slate-500 truncate">{notif.message}</p>
                <p className="text-xs text-slate-400 mt-1">{notif.time}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="px-4 py-3 border-t border-slate-200 bg-slate-50">
        <button className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium">
          Ver todas
        </button>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 bg-white">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <h2 className="text-lg font-semibold">Notificações</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl">
            <X size={20} />
          </button>
        </div>
        {content}
      </div>
    )
  }

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-full mt-2 w-80 z-50 animate-fade-in-down">
        {content}
      </div>
    </>
  )
}

// ============ USER DROPDOWN ============
function UserDropdown({ isOpen, onClose, user, onLogout }) {
  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 animate-fade-in-down overflow-hidden">
        <div className="px-4 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center text-white font-bold shadow-sm">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800 truncate">
                {user?.displayName || user?.email?.split('@')[0] || 'Usuário'}
              </p>
              <p className="text-sm text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        <div className="py-2">
          <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-100 transition-colors">
            <User size={18} className="text-slate-500" />
            <span>Meu perfil</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-100 transition-colors">
            <Settings size={18} className="text-slate-500" />
            <span>Configurações</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-100 transition-colors">
            <HelpCircle size={18} className="text-slate-500" />
            <span>Ajuda</span>
          </button>
        </div>

        <div className="border-t border-slate-200 py-2">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger-600 hover:bg-danger-50 transition-colors"
          >
            <LogOut size={18} />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </>
  )
}

// ============ MOBILE MENU MODAL ============
function MobileMenuModal({ isOpen, onClose, moreItems, isActive }) {
  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-slate-900/50 z-50 lg:hidden animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-x-2 bottom-16 z-50 lg:hidden animate-fade-in-up">
        <div className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
          {/* Grid de itens restantes */}
          <div className="p-2">
            <div className="grid grid-cols-5 gap-1">
              {moreItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.to, item.exact)
                
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors ${
                      active 
                        ? 'bg-primary-100 text-primary-700' 
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon size={18} className={active ? 'text-primary-600' : 'text-slate-500'} />
                    <span className="text-[9px] mt-1 font-medium text-center leading-tight truncate w-full">{item.label}</span>
                  </NavLink>
                )
              })}
            </div>
          </div>
          
          {/* Opções extras */}
          <div className="px-2 pb-2 pt-1 border-t border-slate-100">
            <div className="grid grid-cols-2 gap-1">
              <button className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
                <Settings size={16} className="text-slate-500" />
                <span className="text-[10px] font-medium">Config.</span>
              </button>
              <button className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
                <HelpCircle size={16} className="text-slate-500" />
                <span className="text-[10px] font-medium">Ajuda</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ============ MOBILE BOTTOM NAV ============
function MobileBottomNav({ navItems, isActive }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const mainItems = navItems.slice(0, 4) // 4 itens principais
  const moreItems = navItems.slice(4)    // Itens restantes para o menu "Mais"
  
  return (
    <>
      {/* Menu Modal com itens restantes */}
      <MobileMenuModal 
        isOpen={menuOpen} 
        onClose={() => setMenuOpen(false)}
        moreItems={moreItems}
        isActive={isActive}
      />
      
      {/* Bottom Nav fixo */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-slate-200 lg:hidden safe-area-bottom">
        <div className="flex items-center justify-around h-12 px-1">
          {mainItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.to, item.exact)
            
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center justify-center flex-1 h-full py-0.5 transition-colors ${
                  active ? 'text-primary-700' : 'text-slate-500'
                }`}
              >
                <Icon size={18} className={active ? 'text-primary-700' : ''} />
                <span className="text-[9px] mt-0.5 font-medium">{item.label}</span>
              </NavLink>
            )
          })}
          
          {/* Botão Mais (...) */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`flex flex-col items-center justify-center flex-1 h-full py-0.5 transition-colors ${
              menuOpen ? 'text-primary-700' : 'text-slate-500'
            }`}
          >
            <MoreHorizontal size={18} className={menuOpen ? 'text-primary-700' : ''} />
            <span className="text-[9px] mt-0.5 font-medium">Mais</span>
          </button>
        </div>
      </nav>
    </>
  )
}

// ============ MAIN LAYOUT COMPONENT ============
export default function Layout() {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [searchOpen, setSearchOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  // Detecta scroll para adicionar shadow no header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { to: '/clients', icon: Users, label: 'Clientes' },
    { to: '/cases', icon: Briefcase, label: 'Processos' },
    { to: '/tasks', icon: Target, label: 'Tarefas' },
    { to: '/timesheet', icon: Clock, label: 'Timesheet' },
    { to: '/documents', icon: FilePlus2, label: 'Documentos' },
    { to: '/financial', icon: DollarSign, label: 'Financeiro' },
    { to: '/calendar', icon: Calendar, label: 'Agenda' },
    { to: '/templates', icon: FileText, label: 'Templates' },
  ]

  const isActive = (path, exact = false) => {
    if (exact) return location.pathname === path
    return location.pathname.startsWith(path) && path !== '/'
  }

  // Sidebar width fixed at collapsed (icon only)
  const SIDEBAR_WIDTH = 72

  return (
    <div className="min-h-screen bg-slate-100">
      {/* ============ DESKTOP SIDEBAR (Fixed Collapsed) ============ */}
      <aside 
        className="fixed left-0 top-0 bottom-0 z-30 hidden lg:flex flex-col bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-r border-slate-800/40"
        style={{ width: SIDEBAR_WIDTH }}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-slate-800/40">
          <Link to="/">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 transition-all duration-300">
              <Scale size={20} className="text-white" />
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 hide-scrollbar">
          <div className="space-y-1.5 px-3">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.to, item.exact)
              
              return (
                <Tooltip key={item.to} content={item.label}>
                  <NavLink
                    to={item.to}
                    className={`group flex items-center justify-center w-12 h-12 rounded-lg transition-all duration-300 ${
                      active 
                        ? 'bg-gradient-to-br from-primary-500/25 to-primary-600/25 text-white shadow-lg shadow-primary-500/15' 
                        : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300 hover:scale-105'
                    }`}
                  >
                    <Icon 
                      size={21} 
                      className={`transition-all duration-300 ${
                        active ? 'text-primary-300 scale-105' : 'group-hover:scale-105'
                      }`} 
                    />
                  </NavLink>
                </Tooltip>
              )
            })}
          </div>
        </nav>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-slate-800/40 space-y-1.5">
          <Tooltip content="Configurações">
            <NavLink
              to="/settings"
              className={`group flex items-center justify-center w-12 h-12 rounded-lg transition-all duration-300 ${
                isActive('/settings') 
                  ? 'bg-gradient-to-br from-primary-500/25 to-primary-600/25 text-white shadow-lg shadow-primary-500/15' 
                  : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300 hover:scale-105'
              }`}
            >
              <Settings 
                size={19} 
                className={`transition-all duration-300 ${
                  isActive('/settings') ? 'text-primary-300 scale-105' : 'group-hover:scale-105'
                }`}
              />
            </NavLink>
          </Tooltip>
          <Tooltip content="Ajuda">
            <NavLink
              to="/help"
              className={`group flex items-center justify-center w-12 h-12 rounded-lg transition-all duration-300 ${
                isActive('/help') 
                  ? 'bg-gradient-to-br from-primary-500/25 to-primary-600/25 text-white shadow-lg shadow-primary-500/15' 
                  : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300 hover:scale-105'
              }`}
            >
              <HelpCircle 
                size={19} 
                className={`transition-all duration-300 ${
                  isActive('/help') ? 'text-primary-300 scale-105' : 'group-hover:scale-105'
                }`}
              />
            </NavLink>
          </Tooltip>
        </div>
      </aside>

      {/* ============ MAIN CONTENT AREA ============ */}
      <div className="lg:pl-[72px]">
        {/* ============ TOP NAVBAR ============ */}
        <header className={`sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-slate-200/60 transition-all duration-200 ${
          isScrolled ? 'shadow-sm' : ''
        }`}>
          <div className="h-12 lg:h-16 flex items-center gap-2 lg:gap-4 px-4 lg:px-0">
            <div className="w-full max-w-7xl mx-auto flex items-center gap-2 lg:gap-4">
              {/* Desktop: Search Button (à esquerda) */}
              <button
                onClick={() => setSearchOpen(true)}
                className="hidden lg:flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-500 transition-colors duration-150 min-w-[240px] group"
              >
                <Search size={18} />
                <span className="text-sm text-slate-400">Buscar clientes, processos...</span>
                <kbd className="ml-auto flex items-center gap-0.5 px-1.5 py-0.5 bg-white rounded text-xs font-medium text-slate-500 shadow-sm border border-slate-200">
                  <Command size={10} />K
                </kbd>
              </button>

              {/* Mobile: Search Button */}
              <button
                onClick={() => setSearchOpen(true)}
                className="lg:hidden flex-1 flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 rounded-lg text-slate-400 text-sm active:scale-95 transition-transform"
              >
                <Search size={16} />
                <span className="text-xs">Buscar...</span>
              </button>

              {/* Spacer */}
              <div className="flex-1 hidden lg:block" />

              {/* Notifications */}
              <div className="relative">
                <button 
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative p-1.5 lg:p-2 rounded-lg lg:rounded-xl text-slate-600 hover:bg-slate-100 transition-colors duration-150"
                >
                  <Bell size={18} className="lg:w-5 lg:h-5" />
                  <span className="absolute top-0.5 right-0.5 lg:top-1 lg:right-1 w-2 h-2 lg:w-2.5 lg:h-2.5 bg-danger-500 rounded-full ring-2 ring-white animate-pulse" />
                </button>
                <NotificationDropdown 
                  isOpen={notificationsOpen} 
                  onClose={() => setNotificationsOpen(false)} 
                />
              </div>

              {/* User Menu - mobile e desktop */}
              <div className="relative">
                <button 
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-1 p-0.5 lg:p-1 rounded-lg lg:rounded-xl hover:bg-slate-100 transition-colors duration-150"
                >
                  <div className="w-7 h-7 lg:w-9 lg:h-9 rounded-lg lg:rounded-xl bg-primary-600 flex items-center justify-center text-white font-semibold text-xs lg:text-sm">
                    {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                </button>
                <UserDropdown 
                  isOpen={userDropdownOpen} 
                  onClose={() => setUserDropdownOpen(false)}
                  user={currentUser}
                  onLogout={handleLogout}
                />
              </div>
            </div>
          </div>
        </header>

        {/* ============ PAGE CONTENT ============ */}
        <main className="px-4 py-2 lg:p-6 pb-16 lg:pb-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* ============ MOBILE BOTTOM NAV ============ */}
      <MobileBottomNav 
        navItems={navItems} 
        isActive={isActive}
      />

      {/* ============ GLOBAL SEARCH MODAL ============ */}
      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}
