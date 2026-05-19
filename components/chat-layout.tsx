'use client'

import { useState } from 'react'
import { useChatStore, useAuthStore } from '@/lib/store'
import { conversationsApi, ApiError } from '@/lib/api'
import { ChatSidebar } from '@/components/chat-sidebar'
import { ChatMessages } from '@/components/chat-messages'
import { ChatInput } from '@/components/chat-input'
import { SeriesSearch } from '@/components/series-search'
import { Button } from '@/components/ui/button'
import { SquarePen, Square, Tv } from 'lucide-react'
import Image from 'next/image'
import { cn, getPosterUrl } from '@/lib/utils'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

export function ChatLayout() {
  const { token } = useAuthStore()
  const {
    sidebarOpen,
    currentConversation,
    setCurrentConversation,
    isStreaming,
  } = useChatStore()
  const [showSeriesSearch, setShowSeriesSearch] = useState(false)
  const [isStartingChat, setIsStartingChat] = useState(false)

  const handleNewChat = () => {
    setShowSeriesSearch(true)
  }

  const handleSeriesSelected = async (serieId: string) => {
    if (!token) return

    setIsStartingChat(true)
    try {
      const data = await conversationsApi.start(serieId, token)
      setCurrentConversation({
        id: data.conversation_id,
        serie: {
          id: data.serie.id,
          tmdb_id: data.serie.tmdb_id,
          titulo: data.serie.titulo,
          slug: data.serie.slug,
          poster_path: data.serie.poster_path ?? null,
        },
        messages: [],
        created_at: new Date().toISOString(),
        ended: false,
      })
      setShowSeriesSearch(false)
      toast.success('Conversacion iniciada')
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message)
      } else {
        toast.error('Error al iniciar la conversacion')
      }
    } finally {
      setIsStartingChat(false)
    }
  }

  const handleEndConversation = async () => {
    if (!token || !currentConversation) return

    try {
      await conversationsApi.end(currentConversation.id, token)
      setCurrentConversation({
        ...currentConversation,
        ended: true,
      })
      toast.success('Conversacion finalizada')
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message)
      } else {
        toast.error('Error al finalizar la conversacion')
      }
    }
  }

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <ChatSidebar onNewChat={handleNewChat} />

      <main
        className={cn(
          'flex-1 min-h-0 flex flex-col transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] relative',
          sidebarOpen ? 'lg:ml-72' : 'ml-0'
        )}
      >
        {/* Minimal header */}
        <header className="h-14 flex items-center justify-between px-5 relative z-10">
          <div className="flex items-center gap-3">
            <AnimatePresence mode="wait">
              {currentConversation && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  className="flex items-center gap-3"
                >
                  {(() => {
                    const posterUrl = getPosterUrl(currentConversation.serie.poster_path, 'w200')
                    return (
                      <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                        {posterUrl ? (
                          <Image
                            src={posterUrl}
                            alt={`Poster de ${currentConversation.serie.titulo}`}
                            fill
                            sizes="36px"
                            className="object-cover"
                          />
                        ) : (
                          <Tv className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                      </div>
                    )
                  })()}
                  <div className="flex items-center gap-2">
                    <h1 className="text-sm font-medium text-foreground truncate max-w-[180px] md:max-w-none">
                      {currentConversation.serie.titulo}
                    </h1>
                    {currentConversation.ended ? (
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                        Finalizada
                      </span>
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-2">
            {currentConversation && !currentConversation.ended && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Button
                  variant="ghost"
                  onClick={handleEndConversation}
                  className="h-8 px-3 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl"
                >
                  <Square className="w-3 h-3 mr-1.5" />
                  Finalizar
                </Button>
              </motion.div>
            )}
            <Button
              onClick={handleNewChat}
              className="h-8 px-3.5 bg-secondary hover:bg-muted text-secondary-foreground rounded-xl text-xs font-medium transition-colors border border-border"
            >
              <SquarePen className="w-3.5 h-3.5 mr-1.5" />
              <span className="hidden sm:inline">Nueva</span>
            </Button>
          </div>
        </header>

        {/* Chat area */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <ChatMessages />
          <ChatInput />
        </div>
      </main>

      {/* Series search modal */}
      <AnimatePresence>
        {showSeriesSearch && (
          <SeriesSearch
            onSeriesSelected={handleSeriesSelected}
            onClose={() => setShowSeriesSearch(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
