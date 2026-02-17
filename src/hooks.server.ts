import { redirect, type Handle } from '@sveltejs/kit';

const OWNER_EMAIL = 'bibliotecamarianomoreno9@gmail.com';

export const handle: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;

	// Si intentamos entrar a cualquier cosa de /admin
	if (path.startsWith('/admin')) {
		// Intentamos obtener la sesión de los datos que Supabase ya inyectó en locals
		// Si locals.session no existe, probamos con locals.safeGetSession
		const sessionData = await (event.locals as any).safeGetSession?.() || { session: (event.locals as any).session };
		const session = sessionData.session;
		
		const email = session?.user?.email?.toLowerCase();

		// BLOQUEO SEGURIDAD: Si no estás logueado o el mail no es el tuyo, al inicio.
		if (!session || email !== OWNER_EMAIL) {
			console.log('Acceso denegado a:', email);
			throw redirect(303, '/');
		}
	}

	return resolve(event);
};
