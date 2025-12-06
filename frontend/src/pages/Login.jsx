import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingSpinner } from '@/components/common'
import { 
  AlertCircle, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Scale, 
  ArrowRight,
  Sparkles 
} from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isRegister, setIsRegister] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isRegister) {
        await register(email, password)
      } else {
        await login(email, password)
      }
      navigate('/')
    } catch (err) {
      const errorMessages = {
        'auth/user-not-found': 'Usuário não encontrado',
        'auth/wrong-password': 'Senha incorreta',
        'auth/email-already-in-use': 'Este email já está em uso',
        'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres',
        'auth/invalid-email': 'Email inválido',
        'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
      }
      setError(errorMessages[err.code] || err.message || 'Erro ao autenticar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 p-12 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-2xl animate-float" />
        <div className="absolute bottom-32 right-20 w-32 h-32 bg-white/5 rounded-full animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-10 w-16 h-16 bg-white/10 rounded-xl animate-float" style={{ animationDelay: '2s' }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-full text-white">
          <div>
            {/* Logo */}
            <div className="flex items-center gap-3 mb-12">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Scale className="w-7 h-7" />
              </div>
              <span className="text-2xl font-bold">JurídicoAI</span>
            </div>

            {/* Main Text */}
            <h1 className="text-4xl font-bold leading-tight mb-6">
              O CRM jurídico mais
              <span className="block text-primary-200">inteligente do Brasil</span>
            </h1>
            
            <p className="text-lg text-primary-200 leading-relaxed max-w-md">
              Gerencie clientes, processos e documentos com o poder da 
              inteligência artificial. Simplifique sua rotina jurídica.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-primary-100">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <span>IA para análise de documentos</span>
            </div>
            <div className="flex items-center gap-3 text-primary-100">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <span>Gamificação com Taskscore</span>
            </div>
            <div className="flex items-center gap-3 text-primary-100">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <span>Portal do Cliente integrado</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
              <Scale className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">JurídicoAI</span>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {isRegister ? 'Criar conta' : 'Bem-vindo de volta'}
              </h2>
              <p className="text-gray-500">
                {isRegister 
                  ? 'Preencha os dados para criar sua conta' 
                  : 'Entre com suas credenciais para acessar'
                }
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 
                      focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 
                      transition-all duration-200 outline-none"
                    placeholder="seu@email.com"
                    required
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3 rounded-xl border border-gray-200 
                      focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 
                      transition-all duration-200 outline-none"
                    placeholder="••••••••"
                    required
                    minLength={6}
                    autoComplete={isRegister ? 'new-password' : 'current-password'}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 
                      hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Forgot Password (login only) */}
              {!isRegister && (
                <div className="flex justify-end">
                  <button 
                    type="button" 
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-3 bg-danger-50 border border-danger-200 
                  text-danger-700 px-4 py-3 rounded-xl animate-fade-in">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary-600 to-primary-700 
                  hover:from-primary-700 hover:to-primary-800
                  text-white font-semibold py-3.5 px-6 rounded-xl
                  transition-all duration-200 transform hover:scale-[1.02]
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                  flex items-center justify-center gap-2 group
                  shadow-lg shadow-primary-500/30"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Processando...</span>
                  </>
                ) : (
                  <>
                    <span>{isRegister ? 'Criar conta' : 'Entrar'}</span>
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">ou</span>
              </div>
            </div>

            {/* Toggle Register/Login */}
            <p className="text-center text-gray-600">
              {isRegister ? 'Já tem uma conta?' : 'Não tem uma conta?'}{' '}
              <button
                onClick={() => {
                  setIsRegister(!isRegister)
                  setError('')
                }}
                className="font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                disabled={loading}
              >
                {isRegister ? 'Entrar' : 'Criar conta'}
              </button>
            </p>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 mt-8">
            Ao continuar, você concorda com nossos{' '}
            <a href="#" className="text-primary-600 hover:underline">Termos de Uso</a>
            {' '}e{' '}
            <a href="#" className="text-primary-600 hover:underline">Política de Privacidade</a>
          </p>
        </div>
      </div>
    </div>
  )
}
