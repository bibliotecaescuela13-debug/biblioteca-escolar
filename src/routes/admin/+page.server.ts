import type { PageServerLoad } from './$types';
import { hasSupabaseEnv, supabase } from '$lib/utils/supabaseClient';

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();
	const userRole = user?.rol ?? null;

	if (!hasSupabaseEnv) {
		return {
			userRole,
			stats: {
				impresionesHoy: 0,
				librosPrestados: 0,
				usuariosTotales: 0
			}
		};
	}

	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const todayIso = today.toISOString();

	const [impresionesResp, prestamosResp, usuariosResp] = await Promise.all([
		supabase
			.from('servicios_copiado')
			.select('id', { count: 'exact', head: true })
			.gte('created_at', todayIso),
		supabase.from('prestamos').select('id', { count: 'exact', head: true }).eq('estado', 'Activo'),
		supabase.from('usuarios').select('id', { count: 'exact', head: true })
	]);

	return {
		userRole,
		stats: {
			impresionesHoy: impresionesResp.count ?? 0,
			librosPrestados: prestamosResp.count ?? 0,
			usuariosTotales: usuariosResp.count ?? 0
		}
	};
};
