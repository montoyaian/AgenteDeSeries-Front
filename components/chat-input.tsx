'use client'

import { useState, useRef, useEffect } from 'react'
import { useChatStore, useAuthStore } from '@/lib/store'
import { conversationsApi, ApiError } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ArrowUp, Square } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

export function ChatInput() {
  const { token } = useAuthStore()
  const {
    currentConversation,
    isStreaming,
    setIsStreaming,
    addMessage,
    updateLastMessage,
  } = useChatStore()
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`
    }
  }, [message])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !currentConversation || !token || isStreaming) return
    if (currentConversation.ended) {
      toast.error('Esta conversacion ha finalizado')
      return
    }

    const userMessage = message.trim()
    setMessage('')

    addMessage({
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    })

    addMessage({
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    })

    setIsStreaming(true)
    let fullResponse = ''

    try {
      await conversationsApi.sendMessage(
        currentConversation.id,
        userMessage,
        token,
        (chunk) => {
          fullResponse += chunk
          updateLastMessage(fullResponse)
        },
        () => {
          setIsStreaming(false)
        }
      )
    } catch (error) {
      setIsStreaming(false)
      if (error instanceof ApiError) {
        if (error.status === 401) {
          toast.error('Tu sesion ha expirado')
        } else {
          toast.error(error.message)
        }
      } else {
        toast.error('Error al enviar el mensaje')
      }
      updateLastMessage('Lo siento, hubo un error al procesar tu mensaje. Por favor, intentalo de nuevo.')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setIsStreaming(false)
  }

  if (!currentConversation) return null

  const isDisabled = currentConversation.ended || isStreaming
  const hasContent = message.trim().length > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="px-5 pb-5 pt-2"
    >
      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit}>
          <div
            className={cn(
              'bg-secondary rounded-2xl border border-border transition-all duration-300',
              'focus-within:border-accent/20 focus-within:ring-1 focus-within:ring-accent/10'
            )}
          >
            <div className="flex items-end gap-2 p-2">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  currentConversation.ended
                    ? 'Esta conversacion ha finalizado'
                    : 'Escribe un mensaje...'
                }
                disabled={isDisabled}
                className="flex-1 min-h-[44px] max-h-[150px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground placeholder:text-muted-foreground/60 text-sm px-2"
                rows={1}
              />
              <div className="flex items-center pb-0.5">
                {isStreaming ? (
                  <Button
                    type="button"
                    onClick={handleStop}
                    size="icon"
                    className="h-8 w-8 rounded-xl bg-foreground hover:bg-foreground/90 text-background"
                  >
                    <Square className="w-3 h-3 fill-current" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={!hasContent || currentConversation.ended}
                    size="icon"
                    className={cn(
                      'h-8 w-8 rounded-xl transition-all duration-200',
                      hasContent
                        ? 'bg-accent hover:bg-accent/90 text-accent-foreground'
                        : 'bg-muted text-muted-foreground cursor-not-allowed'
                    )}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </form>
        <p className="text-[10px] text-center text-muted-foreground/60 mt-2.5 tracking-wide">
          Enter para enviar &middot; Shift+Enter para nueva linea
        </p>
      </div>
    </motion.div>
  )
}
