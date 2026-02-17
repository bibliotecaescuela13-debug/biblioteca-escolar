import { redirect, type Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
    const session = (await event.locals.safeGetSession()).session;
    const path = event.url.pathname;

    // Solo protegemos la zona admin
    if (path.startsWith('/admin')) {
        const email = session?.user?.email?.toLowerCase();
        
        // Si no es el administrador, ¡afuera!
        if (email !== 'bibliotecamarianomoreno9@gmail.com') {
            throw redirect(303, '/');
        }
    }

    return resolve(event);
};
