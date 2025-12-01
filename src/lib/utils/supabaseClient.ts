import { createClient } from '@supabase/supabase-js';

// ⚠️ ELIMINAMOS: import { env } from '$env/dynamic/public';

// 1. Obtiene las variables de entorno públicas usando el método nativo de Vite.
// Netlify ya está suministrando VITE_PUBLIC_SUPABASE_URL y VITE_PUBLIC_SUPABASE_ANON_KEY.
const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL; 
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY; 

// 2. Verifica que las claves existan (el código de verificación que tienes)
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variables de entorno de Supabase no configuradas correctamente.');
}

// 3. Inicializa y exporta el cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
