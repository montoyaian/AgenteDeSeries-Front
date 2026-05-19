'use client'

import { useState } from 'react'
import { useAuthStore } from '@/lib/store'
import { authApi, ApiError } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

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
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Subtle ambient glow */}
      <div className="fixed top-[-40%] left-[-20%] w-[60%] h-[60%] rounded-full bg-accent/[0.02] blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-30%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent/[0.015] blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-sm"
      >
        {/* Logo / brand */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 mb-6 pulse-glow"
          >
            <span className="text-accent font-mono text-lg font-bold">S</span>
          </motion.div>
          <AnimatePresence mode="wait">
            <motion.div
              key={isLogin ? 'login' : 'register'}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-2xl font-semibold text-foreground mb-2 tracking-tight">
                {isLogin ? 'Bienvenido de vuelta' : 'Crear cuenta'}
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {isLogin
                  ? 'Inicia sesion para continuar tus conversaciones'
                  : 'Registrate para empezar a chatear sobre series'}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
              Email
            </Label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-accent" />
              <Input
                id="email"
                type="text"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-11 h-12 bg-secondary border-border rounded-2xl focus:ring-1 focus:ring-accent/30 focus:border-accent/30 transition-all text-foreground placeholder:text-muted-foreground/50"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
              Password
            </Label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-accent" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Tu password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-11 pr-11 h-12 bg-secondary border-border rounded-2xl focus:ring-1 focus:ring-accent/30 focus:border-accent/30 transition-all text-foreground placeholder:text-muted-foreground/50"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <motion.div whileTap={{ scale: 0.98 }}>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-2xl bg-accent hover:bg-accent/90 text-accent-foreground font-medium transition-all group"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  {isLogin ? 'Iniciar sesion' : 'Crear cuenta'}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              )}
            </Button>
          </motion.div>
        </form>

        {/* Toggle */}
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {isLogin ? (
              <>
                {"No tienes cuenta? "}
                <span className="text-accent font-medium">Registrate</span>
              </>
            ) : (
              <>
                {"Ya tienes cuenta? "}
                <span className="text-accent font-medium">Inicia sesion</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
