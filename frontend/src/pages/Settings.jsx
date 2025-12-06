import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import PageHeader from '@/components/common/PageHeader'
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Lock, 
  Palette, 
  Globe,
  Database,
  Shield,
  Mail,
  Smartphone,
  Save,
  Eye,
  EyeOff
} from 'lucide-react'

export default function Settings() {
  const { currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [showPassword, setShowPassword] = useState(false)
  const [settings, setSettings] = useState({
    // Perfil
    displayName: currentUser?.displayName || '',
    email: currentUser?.email || '',
    phone: '',
    bio: '',
    
    // Notificações
    emailNotifications: true,
    pushNotifications: true,
    newCaseAlert: true,
    deadlineAlert: true,
    clientMessageAlert: true,
    
    // Aparência
    theme: 'light',
    language: 'pt-BR',
    
    // Segurança
    twoFactorEnabled: false,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    
    // Sistema
    autoSave: true,
    dataRetention: '90',
    backupFrequency: 'daily'
  })

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'appearance', label: 'Aparência', icon: Palette },
    { id: 'security', label: 'Segurança', icon: Lock },
    { id: 'system', label: 'Sistema', icon: Database }
  ]

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    // TODO: Implementar salvamento no backend
    // Temporariamente salvo apenas no localStorage
  }

  return (
    <div className="space-y-5 sm:space-y-7">
      <PageHeader
        title="Configurações"
        description="Gerencie suas preferências e configurações do sistema"
        icon={SettingsIcon}
        action={
          <button onClick={handleSave} className="btn btn-primary w-full sm:w-auto">
            <Save size={18} />
            <span>Salvar Alterações</span>
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 lg:gap-7">
        {/* Sidebar de Tabs */}
        <div className="lg:col-span-1">
          <div className="card p-2">
            <nav className="space-y-1">
              {tabs.map(tab => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-600 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="text-sm">{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="lg:col-span-3">
          <div className="card p-5 sm:p-7">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Informações Pessoais</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Nome Completo</label>
                      <input
                        type="text"
                        value={settings.displayName}
                        onChange={(e) => handleChange('displayName', e.target.value)}
                        className="input"
                        placeholder="Seu nome completo"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">E-mail</label>
                      <input
                        type="email"
                        value={settings.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        className="input"
                        placeholder="seu@email.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Telefone</label>
                      <input
                        type="tel"
                        value={settings.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        className="input"
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Bio</label>
                      <textarea
                        value={settings.bio}
                        onChange={(e) => handleChange('bio', e.target.value)}
                        className="input min-h-[100px]"
                        placeholder="Fale um pouco sobre você..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Preferências de Notificação</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Mail size={20} className="text-slate-500" />
                        <div>
                          <p className="font-semibold text-slate-900">Notificações por E-mail</p>
                          <p className="text-sm text-slate-500">Receba atualizações por e-mail</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.emailNotifications}
                          onChange={(e) => handleChange('emailNotifications', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Smartphone size={20} className="text-slate-500" />
                        <div>
                          <p className="font-semibold text-slate-900">Notificações Push</p>
                          <p className="text-sm text-slate-500">Receba alertas no navegador</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.pushNotifications}
                          onChange={(e) => handleChange('pushNotifications', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Bell size={20} className="text-slate-500" />
                        <div>
                          <p className="font-semibold text-slate-900">Novos Casos</p>
                          <p className="text-sm text-slate-500">Alertas de novos processos</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.newCaseAlert}
                          onChange={(e) => handleChange('newCaseAlert', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Bell size={20} className="text-slate-500" />
                        <div>
                          <p className="font-semibold text-slate-900">Prazos</p>
                          <p className="text-sm text-slate-500">Alertas de vencimento</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.deadlineAlert}
                          onChange={(e) => handleChange('deadlineAlert', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Aparência e Personalização</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-3">Tema</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleChange('theme', 'light')}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            settings.theme === 'light'
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="w-full h-20 bg-white rounded-lg mb-2 border border-slate-200"></div>
                          <p className="font-semibold text-sm">Claro</p>
                        </button>
                        <button
                          onClick={() => handleChange('theme', 'dark')}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            settings.theme === 'dark'
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="w-full h-20 bg-slate-800 rounded-lg mb-2"></div>
                          <p className="font-semibold text-sm">Escuro</p>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Idioma</label>
                      <select
                        value={settings.language}
                        onChange={(e) => handleChange('language', e.target.value)}
                        className="input"
                      >
                        <option value="pt-BR">Português (Brasil)</option>
                        <option value="en-US">English (US)</option>
                        <option value="es-ES">Español</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Segurança da Conta</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Shield size={20} className="text-slate-500" />
                        <div>
                          <p className="font-semibold text-slate-900">Autenticação de Dois Fatores</p>
                          <p className="text-sm text-slate-500">Adicione uma camada extra de segurança</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.twoFactorEnabled}
                          onChange={(e) => handleChange('twoFactorEnabled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="border-t border-slate-200 pt-6">
                      <h4 className="font-semibold text-slate-900 mb-4">Alterar Senha</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Senha Atual</label>
                          <div className="relative">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={settings.currentPassword}
                              onChange={(e) => handleChange('currentPassword', e.target.value)}
                              className="input pr-10"
                              placeholder="Digite sua senha atual"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Nova Senha</label>
                          <input
                            type="password"
                            value={settings.newPassword}
                            onChange={(e) => handleChange('newPassword', e.target.value)}
                            className="input"
                            placeholder="Digite a nova senha"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Confirmar Nova Senha</label>
                          <input
                            type="password"
                            value={settings.confirmPassword}
                            onChange={(e) => handleChange('confirmPassword', e.target.value)}
                            className="input"
                            placeholder="Confirme a nova senha"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* System Tab */}
            {activeTab === 'system' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Configurações do Sistema</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Database size={20} className="text-slate-500" />
                        <div>
                          <p className="font-semibold text-slate-900">Auto-Salvar</p>
                          <p className="text-sm text-slate-500">Salva automaticamente suas alterações</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.autoSave}
                          onChange={(e) => handleChange('autoSave', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Retenção de Dados</label>
                      <select
                        value={settings.dataRetention}
                        onChange={(e) => handleChange('dataRetention', e.target.value)}
                        className="input"
                      >
                        <option value="30">30 dias</option>
                        <option value="60">60 dias</option>
                        <option value="90">90 dias</option>
                        <option value="180">180 dias</option>
                        <option value="365">1 ano</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Frequência de Backup</label>
                      <select
                        value={settings.backupFrequency}
                        onChange={(e) => handleChange('backupFrequency', e.target.value)}
                        className="input"
                      >
                        <option value="daily">Diário</option>
                        <option value="weekly">Semanal</option>
                        <option value="monthly">Mensal</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
