import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/public'; // Importa variables de entorno públicas

// 1. Obtiene las variables de entorno públicas
const supabaseUrl: string = env.VITE_PUBLIC_SUPABASE_URL;
const supabaseAnonKey: string = env.VITE_PUBLIC_SUPABASE_ANON_KEY;

// 2. Verifica que las claves existan antes de inicializar
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variables de entorno de Supabase no configuradas correctamente.');
}

// 3. Inicializa y exporta el cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
