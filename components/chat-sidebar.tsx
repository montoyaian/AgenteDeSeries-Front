'use client'

import { useState, useEffect, useCallback } from 'react'
import { useChatStore, useAuthStore, type Conversation } from '@/lib/store'
import { conversationsApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import Image from 'next/image'
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Tv,
  Trash2,
} from 'lucide-react'
import { cn, getPosterUrl } from '@/lib/utils'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

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
    setSidebarOpen,
  } = useChatStore()
  const [isLoading, setIsLoading] = useState(true)

  const loadConversations = useCallback(async () => {
    if (!token) return

    try {
      const data = await conversationsApi.list(token)
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
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -288, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -288, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-0 top-0 h-full z-40 w-72"
          >
            <div className="h-full bg-sidebar flex flex-col overflow-hidden border-r border-sidebar-border">
              {/* Header */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
                      <span className="text-accent text-[10px] font-bold font-mono">S</span>
                    </div>
                    <span className="text-sm font-medium text-foreground">SeriesChat</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarOpen(false)}
                    className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent rounded-lg"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <Button
                  onClick={onNewChat}
                  className="w-full h-9 bg-accent/10 hover:bg-accent/15 text-accent border border-accent/20 rounded-xl text-xs font-medium transition-all"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Nueva conversacion
                </Button>
              </div>

              {/* Divider */}
              <div className="mx-4 h-px bg-sidebar-border" />

              {/* Conversations list */}
              <ScrollArea className="flex-1 px-2 py-3">
                {isLoading ? (
                  <div className="space-y-1 px-2">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="h-12 rounded-xl shimmer"
                      />
                    ))}
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-3">
                      <Tv className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Sin conversaciones
                    </p>
                  </div>
                ) : (
                  <div className="space-y-0.5">
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
                          'w-full px-3 py-2.5 rounded-xl text-left transition-all group cursor-pointer',
                          currentConversation?.id === conv.id
                            ? 'bg-sidebar-accent'
                            : 'hover:bg-sidebar-accent/50'
                        )}
                      >
                        {(() => {
                          const posterUrl = getPosterUrl(conv.serie.poster_path, 'w200')
                          return (
                            <div className="flex items-center gap-2.5">
                              <div className="relative w-7 h-7 rounded-lg bg-muted overflow-hidden flex items-center justify-center flex-shrink-0">
                                {posterUrl ? (
                                  <Image
                                    src={posterUrl}
                                    alt={`Poster de ${conv.serie.titulo}`}
                                    fill
                                    sizes="28px"
                                    className="object-cover"
                                  />
                                ) : (
                                  <Tv className="w-3 h-3 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-foreground truncate">
                                  {conv.serie.titulo}
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                  {formatDate(conv.created_at)}
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={(event) => handleDeleteConversation(event, conv.id)}
                                className="h-6 w-6 rounded-lg text-muted-foreground/40 hover:text-destructive hover:bg-destructive/5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          )
                        })()}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Footer */}
              <div className="p-3 border-t border-sidebar-border">
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="w-full h-8 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl justify-start"
                >
                  <LogOut className="w-3 h-3 mr-2" />
                  Cerrar sesion
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button when sidebar is closed */}
      <AnimatePresence>
        {!sidebarOpen && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="fixed left-4 top-3.5 z-50 h-8 w-8 bg-secondary border border-border rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay for mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
