import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p'

export function getPosterUrl(path?: string | null, size: 'w200' | 'w500' = 'w500') {
  if (!path) return null
  return `${TMDB_IMAGE_BASE}/${size}${path}`
}
