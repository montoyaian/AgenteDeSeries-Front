import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  email: string
  created_at: string
}

export interface Serie {
  id: string
  tmdb_id: string
  titulo: string
  slug: string
  poster_path?: string
  overview?: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface Conversation {
  id: string
  serie: Serie
  messages: Message[]
  created_at: string
  ended: boolean
}

interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  setAuth: (token: string, user: User) => void
  logout: () => void
}

interface ChatState {
  conversations: Conversation[]
  currentConversation: Conversation | null
  selectedSerie: Serie | null
  sidebarOpen: boolean
  isStreaming: boolean
  setConversations: (conversations: Conversation[]) => void
  setCurrentConversation: (conversation: Conversation | null) => void
  setSelectedSerie: (serie: Serie | null) => void
  setSidebarOpen: (open: boolean) => void
  setIsStreaming: (streaming: boolean) => void
  addMessage: (message: Message) => void
  updateLastMessage: (content: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setAuth: (token, user) => set({ token, user, isAuthenticated: true }),
      logout: () => set({ token: null, user: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
    }
  )
)

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  currentConversation: null,
  selectedSerie: null,
  sidebarOpen: true,
  isStreaming: false,
  setConversations: (conversations) => set({ conversations }),
  setCurrentConversation: (conversation) => set({ currentConversation: conversation }),
  setSelectedSerie: (serie) => set({ selectedSerie: serie }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setIsStreaming: (streaming) => set({ isStreaming: streaming }),
  addMessage: (message) =>
    set((state) => ({
      currentConversation: state.currentConversation
        ? {
            ...state.currentConversation,
            messages: [...state.currentConversation.messages, message],
          }
        : null,
    })),
  updateLastMessage: (content) =>
    set((state) => {
      if (!state.currentConversation) return state
      const messages = [...state.currentConversation.messages]
      const lastIndex = messages.length - 1
      if (lastIndex >= 0 && messages[lastIndex].role === 'assistant') {
        messages[lastIndex] = { ...messages[lastIndex], content }
      }
      return {
        currentConversation: {
          ...state.currentConversation,
          messages,
        },
      }
    }),
}))
