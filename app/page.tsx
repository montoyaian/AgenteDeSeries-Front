'use client'

import { useAuthStore } from '@/lib/store'
import { AuthForm } from '@/components/auth-form'
import { ChatLayout } from '@/components/chat-layout'

export default function Home() {
  const { isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    return <AuthForm />
  }

  return <ChatLayout />
}
