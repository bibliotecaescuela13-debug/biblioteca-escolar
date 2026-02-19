import { createClient } from '@supabase/supabase-js'

// Configura estas variables en tu archivo .env
// Las encontrarás en: https://app.supabase.com/project/YOUR_PROJECT/settings/api
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

// Evita que la app falle al iniciar cuando faltan variables de entorno.
// Se usa un fallback válido para que createClient no lance error por URL inválida.
const fallbackUrl = 'https://example.supabase.co'
const fallbackAnonKey = 'public-anon-key'

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : fallbackUrl,
  isSupabaseConfigured ? supabaseAnonKey : fallbackAnonKey
)
