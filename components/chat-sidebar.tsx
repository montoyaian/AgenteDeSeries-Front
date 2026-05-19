'use client'

import { useState, useEffect, useCallback } from 'react'
import { useChatStore, useAuthStore, type Conversation } from '@/lib/store'
import { conversationsApi } from '@/lib/api'
import { WindowControls } from '@/components/window-controls'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import Image from 'next/image'
import { 
  MessageSquare, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  Tv,
  Clock,
  Trash2
} from 'lucide-react'
import { cn, getPosterUrl } from '@/lib/utils'
import { toast } from 'sonner'

interface ChatSidebarProps {
  onNewChat: () => void
}

export function ChatSidebar({ onNewChat }: ChatSidebarProps) {
  const { token, logout } = useAuthStore()
  const { 
    conversations, 
    setConversations, 
    currentConversation, 
    setCurrentConversation,
    sidebarOpen,
    setSidebarOpen 
  } = useChatStore()
  const [isLoading, setIsLoading] = useState(true)

  const loadConversations = useCallback(async () => {
    if (!token) return
    
    try {
      const data = await conversationsApi.list(token)
      console.log('[ChatSidebar] conversations list response:', data)
      const formattedConversations: Conversation[] = data.conversations.map((conv) => ({
        id: conv.id,
        serie: {
          id: conv.serie.id,
          tmdb_id: conv.serie.tmdb_id,
          titulo: conv.serie.titulo,
          slug: conv.serie.slug,
          poster_path: conv.serie.poster_path ?? null,
        },
        messages: [],
        created_at: conv.started_at,
        ended: conv.ended_at !== null,
      }))
      setConversations(formattedConversations)
    } catch {
      toast.error('Error al cargar las conversaciones')
    } finally {
      setIsLoading(false)
    }
  }, [token, setConversations])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  const handleSelectConversation = async (conv: Conversation) => {
    if (!token) return
    
    try {
      const fullConv = await conversationsApi.get(conv.id, token)
      console.log('[ChatSidebar] conversation detail response:', fullConv)
      setCurrentConversation({
        id: fullConv.id,
        serie: {
          id: fullConv.serie.id,
          tmdb_id: fullConv.serie.tmdb_id,
          titulo: fullConv.serie.titulo,
          slug: fullConv.serie.slug,
          poster_path: fullConv.serie.poster_path ?? null,
        },
        messages: fullConv.messages.map((m, i) => ({
          id: `${fullConv.id}-${i}`,
          role: m.role,
          content: m.content,
          timestamp: new Date(),
        })),
        created_at: fullConv.created_at,
        ended: fullConv.ended,
      })
    } catch {
      toast.error('Error al cargar la conversacion')
    }
  }

  const handleDeleteConversation = async (
    event: React.MouseEvent,
    conversationId: string
  ) => {
    event.stopPropagation()
    if (!token) return

    const confirmed = window.confirm('Deseas eliminar esta conversacion?')
    if (!confirmed) return

    try {
      const response = await conversationsApi.delete(conversationId, token)
      setConversations(conversations.filter((conv) => conv.id !== conversationId))
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null)
      }
      toast.success(response.message || 'Conversacion eliminada')
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Error al eliminar la conversacion')
      }
    }
  }

  const handleLogout = () => {
    logout()
    setConversations([])
    setCurrentConversation(null)
    toast.success('Sesion cerrada')
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const diffTime = nowOnly.getTime() - dateOnly.getTime()
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (days === 0) return 'Hoy'
    if (days === 1) return 'Ayer'
    if (days < 7) return `Hace ${days} dias`
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  }

  return (
    <>
      {/* Sidebar */}
      <div
        className={cn(
          'fixed left-0 top-0 h-full z-40 transition-all duration-300 ease-in-out',
          sidebarOpen ? 'w-72' : 'w-0'
        )}
      >
        <div className="h-full bg-sidebar border-r border-sidebar-border flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-sidebar-border">
            <div className="flex items-center justify-between mb-4">
              <WindowControls />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent rounded-lg"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
            <Button
              onClick={onNewChat}
              className="w-full h-10 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl font-medium transition-all"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva conversacion
            </Button>
          </div>

          {/* Conversations list */}
          <ScrollArea className="flex-1 px-2 py-4">
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-16 bg-sidebar-accent/50 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-sidebar-accent flex items-center justify-center mb-4">
                  <MessageSquare className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  No tienes conversaciones aun
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Empieza una nueva conversacion
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {conversations.map((conv) => (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelectConversation(conv)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleSelectConversation(conv)
                      }
                    }}
                    key={conv.id}
                    className={cn(
                      'w-full p-3 rounded-xl text-left transition-all group cursor-pointer',
                      currentConversation?.id === conv.id
                        ? 'bg-sidebar-accent border border-sidebar-border'
                        : 'hover:bg-sidebar-accent/50'
                    )}
                  >
                    {(() => {
                      const posterUrl = getPosterUrl(conv.serie.poster_path, 'w200')
                      if (posterUrl) {
                        console.log('[ChatSidebar] poster url:', conv.id, posterUrl)
                      }
                      return (
                        <div className="flex items-start gap-3">
                          <div className="relative w-9 h-9 rounded-lg bg-primary/10 overflow-hidden flex items-center justify-center flex-shrink-0">
                            {posterUrl ? (
                              <Image
                                src={posterUrl}
                                alt={`Poster de ${conv.serie.titulo}`}
                                fill
                                sizes="36px"
                                className="object-cover"
                              />
                            ) : (
                              <Tv className="w-4 h-4 text-primary" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium text-foreground truncate">
                                {conv.serie.titulo}
                              </p>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={(event) => handleDeleteConversation(event, conv.id)}
                                className="h-8 w-8 rounded-lg text-muted-foreground/70 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3 text-muted-foreground/70" />
                              <span className="text-xs text-muted-foreground/70">
                                {formatDate(conv.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t border-sidebar-border">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full h-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl justify-start"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar sesion
            </Button>
          </div>
        </div>
      </div>

      {/* Toggle button when sidebar is closed */}
      {!sidebarOpen && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(true)}
          className="fixed left-4 top-4 z-50 h-10 w-10 glass rounded-xl text-muted-foreground hover:text-foreground"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      )}

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  )
}
