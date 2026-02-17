import { createServerClient } from '@supabase/ssr';
import { type Handle, redirect } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.supabase = createServerClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (key) => event.cookies.get(key),
        set: (key, value, options) => event.cookies.set(key, value, { ...options, path: '/' }),
        remove: (key, options) => event.cookies.delete(key, { ...options, path: '/' }),
      },
    }
  );

  event.locals.safeGetSession = async () => {
    const { data: { session } } = await event.locals.supabase.auth.getSession();
    return { session, user: session?.user ?? null };
  };

  const { session } = await event.locals.safeGetSession();

  // Bloqueo total: Si no eres tú, no entras a /admin
  if (event.url.pathname.startsWith('/admin')) {
    if (!session || session.user.email !== 'bibliotecamarianomoreno9@gmail.com') {
      throw redirect(303, '/');
    }
  }

  return resolve(event);
};
