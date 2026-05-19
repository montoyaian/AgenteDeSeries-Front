const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
    throw new ApiError(response.status, error.detail || 'Request failed')
  }

  return response.json()
}

// Auth endpoints
export const authApi = {
  register: (email: string, password: string) =>
    fetchApi<{ id: string; email: string; created_at: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  login: (email: string, password: string) =>
    fetchApi<{ access_token: string; token_type: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
}

// Series endpoints
export const seriesApi = {
  search: (query: string) =>
    fetchApi<{ results: Array<{
      id: number
      name: string
      poster_path: string | null
      overview: string
      first_air_date: string
    }> }>('/series/search', {
      method: 'POST',
      body: JSON.stringify({ query }),
    }),

  list: () =>
    fetchApi<Array<{
      id: string
      tmdb_id: string
      titulo: string
      slug: string
      poster_path?: string
      overview?: string
    }>>('/series'),

  create: (name: string, token: string) =>
    fetchApi<{
      id: string
      tmdb_id: string
      titulo: string
      slug: string
      poster_path?: string
      overview?: string
    }>('/series', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }, token),

  get: (id: string) =>
    fetchApi<{
      id: string
      tmdb_id: string
      titulo: string
      slug: string
      poster_path?: string
      overview?: string
    }>(`/series/${id}`),
}

// Conversations endpoints
export const conversationsApi = {
  start: (serieId: string, token: string) =>
    fetchApi<{
      conversation_id: string
      serie: {
        id: string
        tmdb_id: string
        titulo: string
        slug: string
        poster_path?: string | null
      }
    }>('/conversations/start', {
      method: 'POST',
      body: JSON.stringify({ serie_id: serieId }),
    }, token),

  list: (token: string, serieId?: string) => {
    const url = serieId ? `/conversations?serie_id=${serieId}` : '/conversations'
    return fetchApi<{ conversations: Array<{
      id: string
      serie: {
        id: string
        tmdb_id: string
        titulo: string
        slug: string
        poster_path?: string | null
      }
      started_at: string
      ended_at: string | null
    }> }>(url, {}, token)
  },

  get: (conversationId: string, token: string) =>
    fetchApi<{
      id: string
      serie: {
        id: string
        tmdb_id: string
        titulo: string
        slug: string
        poster_path?: string | null
      }
      messages: Array<{
        role: 'user' | 'assistant'
        content: string
      }>
      created_at: string
      ended: boolean
    }>(`/conversations/${conversationId}`, {}, token),

  end: (conversationId: string, token: string) =>
    fetchApi<{ status: string }>(`/conversations/${conversationId}/end`, {
      method: 'POST',
      body: JSON.stringify({}),
    }, token),

  delete: (conversationId: string, token: string) =>
    fetchApi<{ status: string; message: string }>(`/conversations/${conversationId}`, {
      method: 'DELETE',
    }, token),

  // Special streaming endpoint
  sendMessage: async (
    conversationId: string,
    message: string,
    token: string,
    onChunk: (chunk: string) => void,
    onDone: () => void
  ) => {
    const response = await fetch(`${API_BASE}/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ message }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
      throw new ApiError(response.status, error.detail || 'Request failed')
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No reader available')

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const rawLine of lines) {
        const line = rawLine.trimEnd().replace(/\r$/, '')
        if (!line) continue
        if (line.startsWith('data:')) {
          const data = line.replace(/^data:\s?/, '')
          if (data === '[DONE]') {
            onDone()
            return
          }
          onChunk(data)
        }
      }
    }

    onDone()
  },
}

export { ApiError }
