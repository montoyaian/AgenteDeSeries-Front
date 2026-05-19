'use client'

import { useState } from 'react'
import { seriesApi, ApiError } from '@/lib/api'
import { useAuthStore, useChatStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, Tv, X, Loader2, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import { motion } from 'framer-motion'

interface SeriesResult {
  id: number
  name: string
  poster_path: string | null
  overview: string
  first_air_date: string
}

interface SeriesSearchProps {
  onSeriesSelected: (serieId: string) => void
  onClose: () => void
}

export function SeriesSearch({ onSeriesSelected, onClose }: SeriesSearchProps) {
  const { token } = useAuthStore()
  const { setSelectedSerie } = useChatStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SeriesResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isCreating, setIsCreating] = useState<number | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsSearching(true)
    try {
      const data = await seriesApi.search(query)
      setResults(data.results || [])
      if (data.results?.length === 0) {
        toast.info('No se encontraron series con ese nombre')
      }
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message)
      } else {
        toast.error('Error al buscar series')
      }
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectSeries = async (series: SeriesResult) => {
    if (!token) {
      toast.error('Debes iniciar sesion')
      return
    }

    setIsCreating(series.id)
    try {
      const createdSerie = await seriesApi.create(series.name, token)
      setSelectedSerie(createdSerie)
      onSeriesSelected(createdSerie.id)
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message)
      } else {
        toast.error('Error al seleccionar la serie')
      }
    } finally {
      setIsCreating(null)
    }
  }

  const getYear = (dateString: string) => {
    if (!dateString) return ''
    return new Date(dateString).getFullYear()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 pb-4">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-foreground tracking-tight">
              Selecciona una serie
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Search form */}
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar series..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10 pl-10 pr-20 bg-secondary border-border rounded-xl focus:ring-1 focus:ring-accent/30 focus:border-accent/30 text-sm text-foreground placeholder:text-muted-foreground/50"
              autoFocus
            />
            <Button
              type="submit"
              disabled={isSearching || !query.trim()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 px-3 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg text-xs font-medium"
            >
              {isSearching ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                'Buscar'
              )}
            </Button>
          </form>
        </div>

        {/* Divider */}
        <div className="mx-5 h-px bg-border" />

        {/* Results */}
        <ScrollArea className="h-[360px]">
          <div className="p-3">
            {results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-3 animate-float">
                  <Tv className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Busca tu serie favorita para chatear
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {results.map((series) => (
                  <motion.button
                    key={series.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => handleSelectSeries(series)}
                    disabled={isCreating !== null}
                    className="w-full p-3 rounded-xl hover:bg-muted/50 transition-all text-left group disabled:opacity-50"
                  >
                    <div className="flex gap-3">
                      {/* Poster */}
                      <div className="relative w-12 h-[72px] rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {series.poster_path ? (
                          <Image
                            src={`https://image.tmdb.org/t/p/w200${series.poster_path}`}
                            alt={series.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Tv className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-foreground truncate">
                            {series.name}
                          </h3>
                          {getYear(series.first_air_date) && (
                            <span className="text-[10px] text-muted-foreground flex-shrink-0">
                              {getYear(series.first_air_date)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                          {series.overview || 'Sin descripcion disponible'}
                        </p>
                        <div className="flex items-center gap-1.5 mt-2 text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                          {isCreating === series.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <>
                              <span className="text-[10px] font-medium">Iniciar chat</span>
                              <ArrowRight className="w-3 h-3" />
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </motion.div>
    </motion.div>
  )
}
