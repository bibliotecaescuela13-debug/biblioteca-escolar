import type { LayoutServerLoad } from './$types';
import { hasSupabaseEnv, supabase } from '$lib/utils/supabaseClient';

const FORCE_BIBLIO_EMAIL = 'bibliotecamarianomoreno9@gmail.com';

// Esta función se ejecuta antes de que se cargue cualquier página de la aplicación.
export const load: LayoutServerLoad = async () => {
	if (!hasSupabaseEnv) {
		return { session: null, user: null, userDisplayName: null };
	}

	// Obtenemos la sesión actual del usuario.
	const {
		data: { session }
	} = await supabase.auth.getSession();

	if (!session) {
		return { session: null, user: null, userDisplayName: null };
	}

	const authUserId = session.user.id;
	const authEmail = session.user.email ?? '';
	const fullNameFromGoogle = (session.user.user_metadata?.full_name as string | undefined)?.trim() ?? null;

	// 1) Buscar por id (camino principal)
	let { data: userData, error } = await supabase
		.from('usuarios')
		.select('id, nombre_completo, rol, grado_escolar, avatar_url')
		.eq('id', authUserId)
		.maybeSingle();

	// 2) Si no existe por id, buscar por nombre_completo (email temporal) y sincronizar id
	if (!userData) {
		const { data: legacyUser, error: legacyError } = await supabase
			.from('usuarios')
			.select('id, nombre_completo, rol, grado_escolar, avatar_url')
			.eq('nombre_completo', authEmail)
			.maybeSingle();

		if (legacyError) {
			console.error('Error al buscar usuario por nombre_completo (sync fallback):', legacyError);
		}

		if (legacyUser) {
			const { data: syncedUser, error: syncError } = await supabase
				.from('usuarios')
				.update({ id: authUserId })
				.eq('id', legacyUser.id)
				.select('id, nombre_completo, rol, grado_escolar, avatar_url')
				.maybeSingle();

			if (syncError) {
				console.error('Error al sincronizar id de usuario:', syncError);
				userData = legacyUser;
			} else {
				userData = syncedUser ?? legacyUser;
			}
		}
	}

	if (error) {
		console.error('Error al cargar datos del usuario:', error);
	}

	// 3) Fallback defensivo para no bloquear acceso del usuario bibliotecario principal
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

	console.log('Usuario actual:', userData);

	return {
		session,
		user: userData ?? null,
		userDisplayName: fullNameFromGoogle ?? authEmail
	};
};
