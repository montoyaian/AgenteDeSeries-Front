'use client'

import { useRef, useEffect } from 'react'
import { useChatStore } from '@/lib/store'
import { ScrollArea } from '@/components/ui/scroll-area'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Tv } from 'lucide-react'
import { cn, getPosterUrl } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

const messageVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
}

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
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center max-w-sm px-6"
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-muted flex items-center justify-center mb-6 animate-float">
            <Tv className="w-7 h-7 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-3 tracking-tight">
            SeriesChat
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Selecciona una conversacion del historial o inicia una nueva para hablar sobre tus series favoritas.
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1 min-h-0 overflow-hidden">
      <div className="max-w-2xl mx-auto py-8 px-5">
        {/* Series header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mb-10"
        >
          {(() => {
            const posterUrl = getPosterUrl(currentConversation.serie.poster_path, 'w200')
            return (
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-muted border border-border">
                <div className="relative w-5 h-5 rounded-md overflow-hidden bg-secondary flex items-center justify-center">
                  {posterUrl ? (
                    <Image
                      src={posterUrl}
                      alt={`Poster de ${currentConversation.serie.titulo}`}
                      fill
                      sizes="20px"
                      className="object-cover"
                    />
                  ) : (
                    <Tv className="w-3 h-3 text-muted-foreground" />
                  )}
                </div>
                <span className="text-xs font-medium text-foreground">
                  {currentConversation.serie.titulo}
                </span>
                {!currentConversation.ended && (
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                )}
              </div>
            )
          })()}
        </motion.div>

        {/* Messages */}
        <div className="space-y-8">
          <AnimatePresence initial={false}>
            {currentConversation.messages.map((message, index) => (
              <motion.div
                key={message.id}
                variants={messageVariants}
                initial="hidden"
                animate="visible"
                className={cn(
                  'flex gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-accent text-[10px] font-bold font-mono">AI</span>
                  </div>
                )}

                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-4 py-3',
                    message.role === 'user'
                      ? 'bg-secondary text-foreground'
                      : 'bg-transparent'
                  )}
                >
                  <div
                    className={cn(
                      'text-sm leading-relaxed',
                      'prose prose-invert max-w-none',
                      'prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0',
                      'prose-strong:font-semibold prose-strong:text-foreground prose-em:italic',
                      'prose-a:text-accent prose-a:no-underline hover:prose-a:underline',
                      'prose-code:text-accent prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-xs',
                      message.role === 'user' ? 'text-foreground' : 'text-secondary-foreground'
                    )}
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                  {isStreaming &&
                    message.role === 'assistant' &&
                    index === currentConversation.messages.length - 1 && (
                      <span className="inline-block w-[3px] h-4 ml-0.5 bg-accent rounded-full animate-blink" />
                    )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={endRef} />
        </div>
      </div>
    </ScrollArea>
  )
}
