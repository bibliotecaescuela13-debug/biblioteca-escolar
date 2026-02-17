import type { LayoutServerLoad } from './$types';
import { hasSupabaseEnv, supabase } from '$lib/utils/supabaseClient';

const OWNER_EMAIL = 'bibliotecamarianomoreno9@gmail.com';

export const load: LayoutServerLoad = async () => {
	if (!hasSupabaseEnv) {
		return { session: null, user: null };
	}

	const {
		data: { session }
	} = await supabase.auth.getSession();

	if (!session) {
		return { session: null, user: null };
	}

	const { data: userData, error } = await supabase
		.from('usuarios')
		.select('id, nombre_completo, rol, grado_escolar, avatar_url')
		.eq('id', session.user.id)
		.maybeSingle();

	if (error) {
		console.error('Error al cargar datos del usuario:', error);
	}

	const email = (session.user.email ?? '').toLowerCase();
	const forcedRol = email === OWNER_EMAIL ? 'Bibliotecario' : userData?.rol ?? null;

	const user = {
		id: userData?.id ?? session.user.id,
		nombre_completo: userData?.nombre_completo ?? session.user.user_metadata?.full_name ?? session.user.email ?? 'Usuario',
		rol: forcedRol,
		grado_escolar: userData?.grado_escolar ?? null,
		avatar_url: userData?.avatar_url ?? null
	};

	return {
		session,
		user
	};
};
