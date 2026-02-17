import type { LayoutServerLoad } from './$types';
import { hasSupabaseEnv, supabase } from '$lib/utils/supabaseClient';

const OWNER_EMAIL = 'bibliotecamarianomoreno9@gmail.com';

export const load: LayoutServerLoad = async () => {
	if (!hasSupabaseEnv) {
		return { session: null, user: null, userDisplayName: null };
	}

	// 1. Obtenemos la sesión actual de Supabase
	const { data: { session } } = await supabase.auth.getSession();

	if (!session) {
		return { session: null, user: null, userDisplayName: null };
	}

	const authUserId = session.user.id;
	const authEmail = (session.user.email ?? '').toLowerCase();
	const fullNameFromGoogle = (session.user.user_metadata?.full_name as string | undefined)?.trim() ?? null;

	// 2. Intentamos buscar por ID en la tabla usuarios
	let { data: userData, error } = await supabase
		.from('usuarios')
		.select('id, nombre_completo, rol, grado_escolar, avatar_url')
		.eq('id', authUserId)
		.maybeSingle();

	// 3. Si no existe por ID, buscamos por email (en nombre_completo) para sincronizar cuentas viejas
	if (!userData) {
		const { data: legacyUser } = await supabase
			.from('usuarios')
			.select('id, nombre_completo, rol, grado_escolar, avatar_url')
			.eq('nombre_completo', authEmail)
			.maybeSingle();

		if (legacyUser) {
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

	// 4. APLICAMOS LA LLAVE MAESTRA: Si es tu email, sos Bibliotecario sí o sí
	if (authEmail === OWNER_EMAIL) {
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

	return {
		session,
		user: userData ?? null,
		userDisplayName: fullNameFromGoogle ?? authEmail
	};
};