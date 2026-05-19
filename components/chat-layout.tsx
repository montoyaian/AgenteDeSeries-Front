'use client'

import { useState } from 'react'
import { useChatStore, useAuthStore } from '@/lib/store'
import { conversationsApi, ApiError } from '@/lib/api'
import { ChatSidebar } from '@/components/chat-sidebar'
import { ChatMessages } from '@/components/chat-messages'
import { ChatInput } from '@/components/chat-input'
import { SeriesSearch } from '@/components/series-search'
import { Button } from '@/components/ui/button'
import { SquarePen, StopCircle, Tv } from 'lucide-react'
import Image from 'next/image'
import { cn, getPosterUrl } from '@/lib/utils'
import { toast } from 'sonner'

export function ChatLayout() {
  const { token } = useAuthStore()
  const { 
    sidebarOpen, 
    currentConversation, 
    setCurrentConversation,
    isStreaming 
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
      console.log('[ChatLayout] conversation start response:', data)
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
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#007AFF]/3 via-transparent to-[#5856D6]/3 pointer-events-none" />

      {/* Sidebar */}
      <ChatSidebar onNewChat={handleNewChat} />

      {/* Main content */}
      <main
        className={cn(
          'flex-1 min-h-0 flex flex-col transition-all duration-300 relative',
          sidebarOpen ? 'lg:ml-72' : 'ml-0'
        )}
      >
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 border-b border-glass-border relative z-10">
          <div className="flex items-center gap-4">
            {currentConversation && (
              <div className="flex items-center gap-3">
                {(() => {
                  const posterUrl = getPosterUrl(currentConversation.serie.poster_path, 'w200')
                  if (posterUrl) {
                    console.log('[ChatLayout] header poster url:', posterUrl)
                  }
                  return (
                    <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {posterUrl ? (
                        <Image
                          src={posterUrl}
                          alt={`Poster de ${currentConversation.serie.titulo}`}
                          fill
                          sizes="36px"
                          className="object-cover"
                        />
                      ) : (
                        <Tv className="w-4 h-4 text-primary" />
                      )}
                    </div>
                  )
                })()}
                <div className="flex items-center gap-2">
                  <h1 className="font-medium text-foreground truncate max-w-[200px] md:max-w-none">
                    {currentConversation.serie.titulo}
                  </h1>
                  {currentConversation.ended && (
                    <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                      Finalizada
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentConversation && !currentConversation.ended && (
              <Button
                variant="ghost"
                onClick={handleEndConversation}
                className="h-9 px-3 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
              >
                <StopCircle className="w-4 h-4 mr-2" />
                Finalizar
              </Button>
            )}
            <Button
              onClick={handleNewChat}
              className="h-9 px-4 bg-primary hover:bg-primary/90 rounded-lg text-sm"
            >
              <SquarePen className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Nueva conversacion</span>
              <span className="sm:hidden">Nueva</span>
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
      {showSeriesSearch && (
        <SeriesSearch
          onSeriesSelected={handleSeriesSelected}
          onClose={() => setShowSeriesSearch(false)}
        />
      )}
    </div>
  )
}
