import type { LayoutServerLoad } from './$types';
import { hasSupabaseEnv, supabase } from '$lib/utils/supabaseClient';

const FORCE_BIBLIO_EMAIL = 'bibliotecamarianomoreno9@gmail.com';

export const load: LayoutServerLoad = async () => {
	if (!hasSupabaseEnv) {
		return { session: null, user: null, userDisplayName: null };
	}

	// 1. Obtenemos la sesión actual
	const { data: { session } } = await supabase.auth.getSession();

	// Si no hay sesión, devolvemos todo nulo. 
	// El archivo /admin/+layout.server.ts usará esto para rebotar a los intrusos.
	if (!session) {
		return { session: null, user: null, userDisplayName: null };
	}

	const authUserId = session.user.id;
	const authEmail = session.user.email ?? '';
	const fullNameFromGoogle = (session.user.user_metadata?.full_name as string | undefined)?.trim() ?? null;

	// 2. Intentamos buscar por ID en la tabla usuarios
	let { data: userData, error } = await supabase
		.from('usuarios')
		.select('id, nombre_completo, rol, grado_escolar, avatar_url')
		.eq('id', authUserId)
		.maybeSingle();

	// 3. Si no existe por ID, buscamos por el email (que suele estar en nombre_completo) y sincronizamos
	if (!userData) {
		const { data: legacyUser } = await supabase
			.from('usuarios')
			.select('id, nombre_completo, rol, grado_escolar, avatar_url')
			.eq('nombre_completo', authEmail)
			.maybeSingle();

		if (legacyUser) {
			// Sincronizamos el ID de Auth con la fila existente para que en la próxima entre por el paso 2
			const { data: syncedUser } = await supabase
				.from('usuarios')
				.update({ id: authUserId })
				.eq('id', legacyUser.id)
				.select('id, nombre_completo, rol, grado_escolar, avatar_url')
				.maybeSingle();

			userData = syncedUser ?? legacyUser;
		}
	}

	if (error) {
		console.error('Error al cargar datos del usuario:', error);
	}

	// 4. "Llave maestra" de seguridad para el bibliotecario principal
	if (authEmail.toLowerCase() === FORCE_BIBLIO_EMAIL) {
		userData = {
			...(userData ?? {
				id: authUserId,
				nombre_completo: authEmail,
				grado_escolar: null,
				avatar_url: null
			}),
			rol: 'Bibliotecario'
		};
	}

	console.log('DEBUG - Usuario cargado correctamente:', userData?.email || authEmail);

	return {
		session,
		user: userData ?? null,
		userDisplayName: fullNameFromGoogle ?? authEmail
	};
};