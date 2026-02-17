import { createClient } from '@supabase/supabase-js'

// IMPORTANTE: Reemplaza estas variables con tus credenciales de Supabase
// Las encontrarás en: https://app.supabase.com/project/YOUR_PROJECT/settings/api

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
