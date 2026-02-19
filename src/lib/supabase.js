import { createClient } from '@supabase/supabase-js'

const runtimeEnv = import.meta.env || {}

const rawSupabaseUrl =
  runtimeEnv.VITE_SUPABASE_URL ||
  runtimeEnv.NEXT_PUBLIC_SUPABASE_URL ||
  ''

const rawSupabaseAnonKey =
  runtimeEnv.VITE_SUPABASE_ANON_KEY ||
  runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  ''

const isValidHttpUrl = (value) => {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

const hasValidSupabaseUrl = isValidHttpUrl(rawSupabaseUrl)

export const isSupabaseConfigured = Boolean(
  hasValidSupabaseUrl && rawSupabaseAnonKey
)

const fallbackUrl = 'https://example.supabase.co'
const fallbackAnonKey = 'public-anon-key'

let supabaseClient

try {
  supabaseClient = createClient(
    isSupabaseConfigured ? rawSupabaseUrl : fallbackUrl,
    isSupabaseConfigured ? rawSupabaseAnonKey : fallbackAnonKey
  )
} catch (error) {
  console.warn('[supabase] configuración inválida, usando cliente de fallback.', error)
  supabaseClient = createClient(fallbackUrl, fallbackAnonKey)
}

export const supabase = supabaseClient
