import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword 
} from 'firebase/auth'
import { auth } from '@/config/firebase'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

// Intervalo de renovação do token (45 minutos - tokens Firebase expiram em 1h)
const TOKEN_REFRESH_INTERVAL = 45 * 60 * 1000

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(null)

  // Função para renovar token
  const refreshToken = useCallback(async () => {
    if (auth.currentUser) {
      try {
        const newToken = await auth.currentUser.getIdToken(true) // force refresh
        setToken(newToken)
        return newToken
      } catch (error) {
        if (import.meta.env.DEV) {
          logger.error('Erro ao renovar token:', error)
        }
        // Se falhar ao renovar, faz logout
        await signOut(auth)
        return null
      }
    }
    return null
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdToken()
        setUser(user)
        setToken(token)
      } else {
        setUser(null)
        setToken(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  // Renovação automática do token
  useEffect(() => {
    if (!user) return

    const intervalId = setInterval(() => {
      refreshToken()
    }, TOKEN_REFRESH_INTERVAL)

    return () => clearInterval(intervalId)
  }, [user, refreshToken])

  const login = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password)
    const token = await result.user.getIdToken()
    setToken(token)
    return result
  }

  const register = async (email, password) => {
    const result = await createUserWithEmailAndPassword(auth, email, password)
    const token = await result.user.getIdToken()
    setToken(token)
    return result
  }

  const logout = () => {
    setToken(null)
    return signOut(auth)
  }

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading,
    refreshToken,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
