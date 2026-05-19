'use client'

import { useState, useRef, useEffect } from 'react'
import { useChatStore, useAuthStore } from '@/lib/store'
import { conversationsApi, ApiError } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Loader2, StopCircle } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

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
    
    // Add user message
    addMessage({
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    })

    // Add empty assistant message
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
      // Update the last message with error
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

  return (
    <div className="p-4">
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit}>
          <div
            className={cn(
              'glass rounded-2xl p-2 transition-all',
              'focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary/30'
            )}
          >
            <div className="flex items-end gap-2">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  currentConversation.ended
                    ? 'Esta conversacion ha finalizado'
                    : 'Escribe tu mensaje...'
                }
                disabled={isDisabled}
                className="flex-1 min-h-[44px] max-h-[150px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground placeholder:text-muted-foreground"
                rows={1}
              />
              <div className="flex items-center gap-2 pb-1">
                {isStreaming ? (
                  <Button
                    type="button"
                    onClick={handleStop}
                    size="icon"
                    className="h-10 w-10 rounded-xl bg-destructive hover:bg-destructive/90"
                  >
                    <StopCircle className="w-5 h-5" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={!message.trim() || currentConversation.ended}
                    size="icon"
                    className="h-10 w-10 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </form>
        <p className="text-xs text-center text-muted-foreground/70 mt-3">
          Presiona Enter para enviar, Shift+Enter para nueva linea
        </p>
      </div>
    </div>
  )
}
