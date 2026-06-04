import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { api, getToken, setToken } from '@/lib/api'
import type { Resident } from '@/types'

interface AppState {
  user: Resident | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (identifier: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
  setUser: (u: Resident | null) => void
}

const AppContext = createContext<AppState | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<Resident | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(!!getToken())

  useEffect(() => {
    const token = getToken()
    if (!token) return
    api
      .get<Resident>('/auth/me')
      .then((u) => setUserState(u))
      .catch(() => setToken(null))
      .finally(() => setIsLoading(false))
  }, [])

  const login = async (identifier: string, password: string) => {
    const result = await api.post<{ token: string; user: Resident }>(
      '/auth/login',
      { identifier, password }
    )
    setToken(result.token)
    setUserState(result.user)
  }

  const logout = () => {
    setToken(null)
    setUserState(null)
  }

  const refreshUser = async () => {
    const u = await api.get<Resident>('/auth/me')
    setUserState(u)
  }

  return (
    <AppContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshUser,
        setUser: setUserState,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): AppState {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
