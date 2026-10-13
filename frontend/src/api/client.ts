/**
 * INVORA CENTRALIZED API CLIENT
 * Typed HTTP client connecting to the Spring Boot backend REST APIs.
 */

export class ApiClientError extends Error {
  status: number
  error: string
  path?: string
  validationErrors?: Record<string, string>

  constructor(
    message: string,
    status: number,
    error: string,
    path?: string,
    validationErrors?: Record<string, string>,
  ) {
    super(message)
    this.name = 'ApiClientError'
    this.status = status
    this.error = error
    this.path = path
    this.validationErrors = validationErrors
  }
}

const DEFAULT_BASE_URL = 'http://localhost:8080/api'

export function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL
  if (envUrl && typeof envUrl === 'string') {
    // Trim trailing slash
    return envUrl.replace(/\/+$/, '')
  }
  return DEFAULT_BASE_URL
}

const TOKEN_KEY = 'invora_auth_token'

export const tokenStorage = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  set(token: string): void {
    try {
      localStorage.setItem(TOKEN_KEY, token)
    } catch {
      // Storage unavailable
    }
  },
  remove(): void {
    try {
      localStorage.removeItem(TOKEN_KEY)
    } catch {
      // Storage unavailable
    }
  },
}

export type RequestOptions = RequestInit & {
  params?: Record<string, string | number | boolean | undefined | null>
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const baseUrl = getApiBaseUrl()
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  let fullUrl = `${baseUrl}${cleanEndpoint}`

  if (options.params) {
    const searchParams = new URLSearchParams()
    for (const [key, value] of Object.entries(options.params)) {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value))
      }
    }
    const queryString = searchParams.toString()
    if (queryString) {
      fullUrl += `${fullUrl.includes('?') ? '&' : '?'}${queryString}`
    }
  }

  const token = tokenStorage.get()
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`
  }

  if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(fullUrl, {
    ...options,
    headers,
  })

  if (response.status === 204) {
    return undefined as unknown as T
  }

  let data: unknown
  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json()
    } catch {
      data = null
    }
  } else {
    data = await response.text()
  }

  if (!response.ok) {
    if (response.status === 401) {
      // Broadcast session expiry / unauthorized for UI handling
      window.dispatchEvent(new CustomEvent('invora:unauthorized'))
    }

    const errorPayload = data as {
      message?: string
      error?: string
      status?: number
      path?: string
      validationErrors?: Record<string, string>
    } | null

    const message =
      errorPayload?.message ||
      (typeof data === 'string' && data ? data : `Request failed with status ${response.status}`)
    const errorType = errorPayload?.error || response.statusText || 'Error'

    throw new ApiClientError(
      message,
      response.status,
      errorType,
      errorPayload?.path,
      errorPayload?.validationErrors,
    )
  }

  return data as T
}

export const apiClient = {
  get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined | null>): Promise<T> {
    return request<T>(endpoint, { method: 'GET', params })
  },

  post<T>(endpoint: string, body?: unknown, params?: Record<string, string | number | boolean | undefined | null>): Promise<T> {
    return request<T>(endpoint, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      params,
    })
  },

  put<T>(endpoint: string, body?: unknown, params?: Record<string, string | number | boolean | undefined | null>): Promise<T> {
    return request<T>(endpoint, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      params,
    })
  },

  patch<T>(endpoint: string, body?: unknown, params?: Record<string, string | number | boolean | undefined | null>): Promise<T> {
    return request<T>(endpoint, {
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      params,
    })
  },

  delete<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined | null>): Promise<T> {
    return request<T>(endpoint, { method: 'DELETE', params })
  },
}
