import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ parent }) => {
    // Obtenemos los datos de la sesión y el usuario que cargamos en el layout padre.
    const { session, user } = await parent(); 

    if (!session || !user) {
        // No hay sesión, redirigir a login
        throw redirect(302, '/login');
    }

    // Comprobamos si el rol es 'Bibliotecario'
    if (user.rol !== 'Bibliotecario') {
        // El usuario no tiene el rol correcto, redirigir a su página principal
        throw redirect(302, '/search'); 
    }

    // Si todo es correcto, permitimos la carga
    return {};
};
