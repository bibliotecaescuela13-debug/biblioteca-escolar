import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const { session, user } = await parent();
	const isBibliotecario = user?.rol?.toLowerCase() === 'bibliotecario';

	if (session && isBibliotecario) {
		throw redirect(302, '/admin');
	}

	return {};
};
