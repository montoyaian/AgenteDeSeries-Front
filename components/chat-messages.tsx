'use client'

import { useRef, useEffect } from 'react'
import { useChatStore } from '@/lib/store'
import { ScrollArea } from '@/components/ui/scroll-area'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { User, Sparkles, Tv } from 'lucide-react'
import { cn, getPosterUrl } from '@/lib/utils'

export function ChatMessages() {
  const { currentConversation, isStreaming } = useChatStore()
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const behavior = isStreaming ? 'auto' : 'smooth'
    endRef.current?.scrollIntoView({ behavior, block: 'end' })
  }, [currentConversation?.messages, isStreaming])

  if (!currentConversation) {
    return (
      <div className="flex-1 min-h-0 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-white/5 flex items-center justify-center mb-6">
            <Tv className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground mb-3">
            Bienvenido a SeriesChat
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Selecciona una conversacion del historial o inicia una nueva para hablar sobre tus series favoritas con IA.
          </p>
        </div>
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1 min-h-0 overflow-hidden">
      <div className="max-w-3xl mx-auto py-8 px-4">
        {/* Series header */}
        <div className="text-center mb-8 pb-8 border-b border-glass-border">
          {(() => {
            const posterUrl = getPosterUrl(currentConversation.serie.poster_path, 'w200')
            if (posterUrl) {
              console.log('[ChatMessages] header poster url:', posterUrl)
            }
            return (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
                <div className="relative w-6 h-6 rounded-md overflow-hidden bg-primary/15 flex items-center justify-center">
                  {posterUrl ? (
                    <Image
                      src={posterUrl}
                      alt={`Poster de ${currentConversation.serie.titulo}`}
                      fill
                      sizes="24px"
                      className="object-cover"
                    />
                  ) : (
                    <Tv className="w-4 h-4 text-primary" />
                  )}
                </div>
                <span className="text-sm font-medium text-primary">
                  {currentConversation.serie.titulo}
                </span>
              </div>
            )
          })()}
          <p className="text-sm text-muted-foreground">
            {currentConversation.ended
              ? 'Esta conversacion ha finalizado'
              : 'Conversacion activa'}
          </p>
        </div>

        {/* Messages */}
        <div className="space-y-6">
          {currentConversation.messages.map((message, index) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-4',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
              )}

              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-5 py-3',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'glass'
                )}
              >
                <div
                  className={cn(
                    'text-sm leading-relaxed whitespace-pre-wrap',
                    'prose prose-invert max-w-none',
                    'prose-p:my-0 prose-ul:my-0 prose-ol:my-0 prose-li:my-0',
                    'prose-strong:font-semibold prose-em:italic',
                    'prose-a:text-primary prose-a:underline'
                  )}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                </div>
                {isStreaming &&
                  message.role === 'assistant' &&
                  index === currentConversation.messages.length - 1 && (
                    <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
                  )}
              </div>

              {message.role === 'user' && (
                <div className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-secondary-foreground" />
                </div>
              )}
            </div>
          ))}
          <div ref={endRef} />
        </div>
      </div>
    </ScrollArea>
  )
}
