import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

const ADMIN_EMAIL = 'bibliotecamarianomoreno9@gmail.com';

export const load: LayoutServerLoad = async ({ parent }) => {
	const { session, user } = await parent();

	const isBibliotecario = user?.rol === 'Bibliotecario' || session?.user?.email === ADMIN_EMAIL;

	if (!session || !isBibliotecario) {
		throw redirect(302, '/');
	}

	return {};
};
