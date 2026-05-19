'use client'

import { useState } from 'react'
import { seriesApi, ApiError } from '@/lib/api'
import { useAuthStore, useChatStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { WindowControls } from '@/components/window-controls'
import { Search, Tv, X, Loader2, ArrowRight, Star } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

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
    if (!dateString) return 'N/A'
    return new Date(dateString).getFullYear()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl glass rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-glass-border">
          <div className="flex items-center justify-between mb-6">
            <WindowControls />
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              Selecciona una serie
            </h2>
            <p className="text-muted-foreground">
              Busca la serie sobre la que quieres conversar
            </p>
          </div>

          {/* Search form */}
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar series..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-12 pl-12 pr-24 bg-input border-glass-border rounded-xl focus:ring-2 focus:ring-primary/50"
              autoFocus
            />
            <Button
              type="submit"
              disabled={isSearching || !query.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-4 bg-primary hover:bg-primary/90 rounded-lg text-sm"
            >
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Buscar'
              )}
            </Button>
          </form>
        </div>

        {/* Results */}
        <ScrollArea className="h-[400px]">
          <div className="p-4">
            {results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                  <Tv className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-center">
                  Busca tu serie favorita para empezar a chatear
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {results.map((series) => (
                  <div key={series.id}>
                  <button
                    onClick={() => handleSelectSeries(series)}
                    disabled={isCreating !== null}
                    className="w-full p-4 rounded-2xl bg-white/3 hover:bg-white/6 border border-glass-border transition-all text-left group disabled:opacity-50"
                  >
                    <div className="flex gap-4">
                      {/* Poster */}
                      <div className="relative w-16 h-24 rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
                        {series.poster_path ? (
                          <Image
                            src={`https://image.tmdb.org/t/p/w200${series.poster_path}`}
                            alt={series.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Tv className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-medium text-foreground truncate">
                            {series.name}
                          </h3>
                          <div className="flex items-center gap-1 text-muted-foreground flex-shrink-0">
                            <Star className="w-3 h-3 fill-current text-amber-500" />
                            <span className="text-xs">{getYear(series.first_air_date)}</span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {series.overview || 'Sin descripcion disponible'}
                        </p>
                        <div className="flex items-center gap-2 mt-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                          {isCreating === series.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <span className="text-sm font-medium">Iniciar chat</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
