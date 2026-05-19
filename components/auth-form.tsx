'use client'

import { useState } from 'react'
import { useAuthStore } from '@/lib/store'
import { authApi, ApiError } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { WindowControls } from '@/components/window-controls'
import { Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

export function AuthForm() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { setAuth } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (isLogin) {
        const response = await authApi.login(email, password)
        setAuth(response.access_token, { id: '', email, created_at: new Date().toISOString() })
        toast.success('Sesion iniciada correctamente')
      } else {
        const user = await authApi.register(email, password)
        const loginResponse = await authApi.login(email, password)
        setAuth(loginResponse.access_token, user)
        toast.success('Cuenta creada correctamente')
      }
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 409) {
          toast.error('Este email ya esta registrado')
        } else if (error.status === 401) {
          toast.error('Email o password incorrectos')
        } else {
          toast.error(error.message)
        }
      } else {
        toast.error('Error de conexion con el servidor')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      {/* Background gradient effect */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#007AFF]/5 via-transparent to-[#5856D6]/5 pointer-events-none" />
      
      <div className="relative w-full max-w-md">
        {/* Glass card */}
        <div className="glass rounded-3xl p-8 shadow-2xl">
          {/* Window controls */}
          <WindowControls className="mb-8" />

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-semibold text-foreground mb-2">
              {isLogin ? 'Bienvenido de vuelta' : 'Crear cuenta'}
            </h1>
            <p className="text-muted-foreground">
              {isLogin
                ? 'Inicia sesion para continuar tus conversaciones'
                : 'Registrate para empezar a chatear sobre series'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-muted-foreground">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="text"
                  placeholder="tu correo"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 bg-input border-glass-border rounded-xl focus:ring-2 focus:ring-primary/50 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm text-muted-foreground">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Tu password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 bg-input border-glass-border rounded-xl focus:ring-2 focus:ring-primary/50 transition-all"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isLogin ? (
                'Iniciar sesion'
              ) : (
                'Crear cuenta'
              )}
            </Button>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isLogin ? (
                <>
                  No tienes cuenta?{' '}
                  <span className="text-primary font-medium">Registrate</span>
                </>
              ) : (
                <>
                  Ya tienes cuenta?{' '}
                  <span className="text-primary font-medium">Inicia sesion</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
