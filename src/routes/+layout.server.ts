import type { LayoutServerLoad } from './$types';
import { hasSupabaseEnv, supabase } from '$lib/utils/supabaseClient';

// Esta función se ejecuta antes de que se cargue cualquier página de la aplicación.
export const load: LayoutServerLoad = async ({ locals }) => {
    if (!hasSupabaseEnv) {
        return { session: null, user: null };
    }

    // Obtenemos la sesión actual del usuario.
    const { data: { session } } = await supabase.auth.getSession();
    
    // Si hay una sesión, podemos cargar más datos del usuario desde la tabla 'usuarios'
    if (session) {
        const { data: userData, error } = await supabase
            .from('usuarios')
            .select('id, nombre_completo, rol, grado_escolar, avatar_url')
            .eq('id', session.user.id)
            .single();

        if (error) {
             console.error('Error al cargar datos del usuario:', error);
             return { session, user: null }; // Devuelve solo la sesión si hay error
        }

        return { 
            session, // Datos de la sesión de Supabase Auth
            user: userData // Datos del perfil de nuestra tabla 'usuarios' (incluyendo el rol)
        };
    }

    return { session: null, user: null };
};
