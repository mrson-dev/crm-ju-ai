/**
 * Portal Layout - Layout base para as páginas do Portal do Cliente.
 * 
 * Nota: A autenticação é verificada pelo PortalPrivateRoute no App.jsx
 */

import { useState } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Scale,
  Home,
  Briefcase,
  MessageSquare,
  User,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import portalService from '../../services/portalService'

export default function PortalLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const clientData = portalService.getClientData();

  const handleLogout = async () => {
    await portalService.logout();
    navigate('/portal/login');
  };

  const navItems = [
    { to: '/portal', icon: Home, label: 'Início', exact: true },
    { to: '/portal/cases', icon: Briefcase, label: 'Processos' },
    { to: '/portal/messages', icon: MessageSquare, label: 'Mensagens' },
    { to: '/portal/profile', icon: User, label: 'Perfil' },
  ];

  const isActive = (path, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Scale className="w-7 h-7 text-indigo-600" />
            <div>
              <h1 className="text-lg font-bold text-indigo-700">Portal do Cliente</h1>
              <p className="text-xs text-gray-500 hidden sm:block">CRM Jurídico</p>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to, item.exact);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    active
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">
                {clientData?.name?.split(' ').slice(0, 2).join(' ')}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {menuOpen && (
          <nav className="md:hidden border-t border-gray-100 p-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to, item.exact);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    active
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-4 text-center text-sm text-gray-500">
          <p>© 2024 CRM Jurídico - Portal do Cliente</p>
          <p className="text-xs mt-1">
            Dúvidas? Entre em contato com seu advogado.
          </p>
        </div>
      </footer>
    </div>
  );
}
