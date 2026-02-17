import { redirect, type Handle } from '@sveltejs/kit';

const OWNER_EMAIL = 'bibliotecamarianomoreno9@gmail.com';

export const handle: Handle = async ({ event, resolve }) => {
	if (event.url.pathname.startsWith('/admin')) {
		const sessionUser = (event.locals as any).session?.user;
		const email = (sessionUser?.email ?? '').toLowerCase();

		if (email !== OWNER_EMAIL) {
			throw redirect(302, '/');
		}
	}

	return resolve(event);
};
