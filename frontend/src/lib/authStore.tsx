import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { apiClient, tokenStorage, ApiClientError } from '@/api/client'
import type {
  AuthResponse,
  LoginRequest,
  UserProfileResponse,
} from '@/api/types'

export type AuthContextType = {
  user: UserProfileResponse | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (credentials: LoginRequest) => Promise<{ ok: boolean; message?: string }>
  logout: () => void
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => tokenStorage.get())
  const [user, setUser] = useState<UserProfileResponse | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(() =>
    Boolean(tokenStorage.get()),
  )
  const [error, setError] = useState<string | null>(null)

  const logout = useCallback(() => {
    tokenStorage.remove()
    setToken(null)
    setUser(null)
    setError(null)
    setIsLoading(false)
  }, [])

  const refreshProfile = useCallback(async () => {
    const currentToken = tokenStorage.get()
    if (!currentToken) {
      setUser(null)
      setIsLoading(false)
      return
    }

    try {
      const profile = await apiClient.get<UserProfileResponse>('/auth/me')
      setUser(profile)
      setError(null)
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) {
        logout()
      } else {
        // Network error / server starting
        console.warn('Unable to reach auth profile service:', err)
      }
    } finally {
      setIsLoading(false)
    }
  }, [logout])

  useEffect(() => {
    let ignore = false

    const initialToken = tokenStorage.get()
    if (initialToken) {
      apiClient
        .get<UserProfileResponse>('/auth/me')
        .then((profile) => {
          if (!ignore) {
            setUser(profile)
            setError(null)
            setIsLoading(false)
          }
        })
        .catch((err) => {
          if (!ignore) {
            if (err instanceof ApiClientError && err.status === 401) {
              logout()
            }
            setIsLoading(false)
          }
        })
    }

    const handleUnauthorized = () => {
      logout()
    }

    window.addEventListener('invora:unauthorized', handleUnauthorized)
    return () => {
      ignore = true
      window.removeEventListener('invora:unauthorized', handleUnauthorized)
    }
  }, [logout])

  const login = useCallback(
    async (credentials: LoginRequest): Promise<{ ok: boolean; message?: string }> => {
      setError(null)
      setIsLoading(true)
      try {
        const authData = await apiClient.post<AuthResponse>('/auth/login', credentials)
        tokenStorage.set(authData.accessToken)
        setToken(authData.accessToken)

        // Set immediate profile from login response
        setUser({
          id: authData.id,
          username: authData.username,
          email: authData.email,
          role: authData.role,
          active: true,
          createdAt: new Date().toISOString(),
        })

        // Fetch authoritative profile
        try {
          const profile = await apiClient.get<UserProfileResponse>('/auth/me')
          setUser(profile)
        } catch {
          // Keep profile from auth response
        }

        setIsLoading(false)
        return { ok: true }
      } catch (err) {
        setIsLoading(false)
        const msg =
          err instanceof ApiClientError
            ? err.message
            : 'Authentication failed. Please verify credentials and backend connectivity.'
        setError(msg)
        return { ok: false, message: msg }
      }
    },
    [],
  )

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        error,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
