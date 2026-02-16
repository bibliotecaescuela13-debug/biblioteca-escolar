import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

export const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey);
const missingEnvMessage = 'Variables de entorno de Supabase no configuradas correctamente.';

export const supabase = hasSupabaseEnv
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (new Proxy(
      {},
      {
        get() {
          throw new Error(missingEnvMessage);
        }
      }
    ) as ReturnType<typeof createClient>);
