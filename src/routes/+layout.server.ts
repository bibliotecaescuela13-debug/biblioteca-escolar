import type { LayoutServerLoad } from './$types';
import { hasSupabaseEnv, supabase } from '$lib/utils/supabaseClient';

export const load: LayoutServerLoad = async () => {
    if (!hasSupabaseEnv) {
        return { session: null, user: null };
    }

    // 1. Obtenemos la sesión actual
    const { data: { session } } = await supabase.auth.getSession();

    // 2. Si hay sesión, buscamos el perfil en la tabla 'usuarios'
    if (session) {
        const { data: userData, error } = await supabase
            .from('usuarios')
            .select('id, nombre_completo, rol, grado_escolar, avatar_url')
            .eq('id', session.user.id)
            .single();

        if (error) {
            console.error('Error al cargar datos del usuario:', error);
            return { session, user: null };
        }

        // ESTO ES CLAVE: Veremos en la consola qué rol te está asignando Supabase
        console.log('DEBUG - Datos de usuario encontrados:', userData);

        return {
            session,
            user: userData
        };
    }

    return { session: null, user: null };
};