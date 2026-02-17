import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const { session, user } = await parent();
	const isBibliotecario = user?.rol?.toLowerCase() === 'bibliotecario';
	const isOwnerEmail = session?.user?.email === 'bibliotecamarianomoreno9@gmail.com';

	if (session && (isBibliotecario || isOwnerEmail)) {
		throw redirect(302, '/admin/servicios');
	}

	return {};
};
