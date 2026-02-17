import { redirect, type Handle } from '@sveltejs/kit';

const OWNER_EMAIL = 'bibliotecamarianomoreno9@gmail.com';

export const handle: Handle = async ({ event, resolve }) => {
	const session = (await event.locals.safeGetSession()).session;
	const path = event.url.pathname;
	const email = session?.user?.email?.toLowerCase();
	const isOwner = email === OWNER_EMAIL;

	// Llave maestra: si es el propietario, marcamos rol forzado para el request actual
	if (isOwner) {
		(event.locals as any).forcedRole = 'Bibliotecario';
	}

	// Solo protegemos la zona admin
	if (path.startsWith('/admin') && !isOwner) {
		throw redirect(303, '/');
	}

	return resolve(event);
};
