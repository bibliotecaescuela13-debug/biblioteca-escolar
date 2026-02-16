<script lang="ts">
	import { supabase } from '$lib/utils/supabaseClient';

	type SearchUser = {
		id: string;
		nombre_completo: string;
		codigo_barra_usuario: string;
		rol?: string;
	};

	let { data } = $props();

	let query = $state('');
	let searchLoading = $state(false);
	let searchMessage = $state<string | null>(null);
	let foundUsers = $state<SearchUser[]>([]);

	const quickActions = [
		{ href: '/admin/servicios', title: 'Nueva Impresión', icon: '🖨️', description: 'Registrar trabajo de copiado' },
		{ href: '/admin/libros', title: 'Gestión de Libros', icon: '📚', description: 'Alta y edición del catálogo' },
		{ href: '/admin/prestamos', title: 'Préstamos Activos', icon: '📖', description: 'Control de devoluciones' }
	];

	async function searchUsers() {
		searchMessage = null;
		foundUsers = [];

		if (!query.trim()) {
			searchMessage = 'Escribe un nombre o código de barras para buscar.';
			return;
		}

		searchLoading = true;
		const term = query.trim();

		const { data: users, error } = await supabase
			.from('usuarios')
			.select('id, nombre_completo, codigo_barra_usuario, rol')
			.or(`nombre_completo.ilike.%${term}%,codigo_barra_usuario.ilike.%${term}%`)
			.limit(10);

		searchLoading = false;

		if (error) {
			searchMessage = `Error en búsqueda: ${error.message}`;
			return;
		}

		foundUsers = (users ?? []) as SearchUser[];
		if (foundUsers.length === 0) {
			searchMessage = 'No se encontraron usuarios con ese criterio.';
		}
	}
</script>

{#if data.userRole !== 'Bibliotecario'}
	<section class="mx-auto mt-12 max-w-lg rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-blue-100">
		<h1 class="text-2xl font-bold text-blue-900">Acceso denegado</h1>
		<p class="mt-2 text-sm text-slate-600">Este panel está disponible solo para bibliotecarios.</p>
		<a
			href="/"
			class="mt-5 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
		>
			Volver al inicio
		</a>
	</section>
{:else}
	<div class="mx-auto max-w-6xl p-4 md:p-6">
		<header class="mb-6">
			<h1 class="text-2xl font-bold text-blue-950">Dashboard del Bibliotecario</h1>
			<p class="text-sm text-slate-600">Biblioteca Mariano Moreno · Panel de atención rápida</p>
		</header>

		<section class="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
			<article class="rounded-xl bg-blue-50 p-4 ring-1 ring-blue-200">
				<p class="text-xs font-semibold uppercase tracking-wide text-blue-700">Impresiones hoy</p>
				<p class="mt-1 text-3xl font-bold text-blue-950">{data.stats.impresionesHoy}</p>
			</article>
			<article class="rounded-xl bg-sky-50 p-4 ring-1 ring-sky-200">
				<p class="text-xs font-semibold uppercase tracking-wide text-sky-700">Libros prestados</p>
				<p class="mt-1 text-3xl font-bold text-sky-950">{data.stats.librosPrestados}</p>
			</article>
			<article class="rounded-xl bg-indigo-50 p-4 ring-1 ring-indigo-200">
				<p class="text-xs font-semibold uppercase tracking-wide text-indigo-700">Usuarios totales</p>
				<p class="mt-1 text-3xl font-bold text-indigo-950">{data.stats.usuariosTotales}</p>
			</article>
		</section>

		<section class="mb-6 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
			<h2 class="mb-3 text-base font-semibold text-blue-900">Búsqueda rápida de usuarios</h2>
			<div class="flex flex-col gap-2 sm:flex-row">
				<input
					type="text"
					bind:value={query}
					placeholder="Nombre o código de barras"
					class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
				/>
				<button
					type="button"
					onclick={searchUsers}
					disabled={searchLoading}
					class="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
				>
					{searchLoading ? 'Buscando...' : 'Buscar'}
				</button>
			</div>

			{#if searchMessage}
				<p class="mt-2 text-sm text-slate-600">{searchMessage}</p>
			{/if}

			{#if foundUsers.length > 0}
				<ul class="mt-3 space-y-2">
					{#each foundUsers as user}
						<li class="rounded-lg border border-slate-200 p-3 text-sm">
							<p class="font-semibold text-slate-800">{user.nombre_completo}</p>
							<p class="text-slate-600">Código: {user.codigo_barra_usuario}</p>
						</li>
					{/each}
				</ul>
			{/if}
		</section>

		<section>
			<h2 class="mb-3 text-base font-semibold text-blue-900">Accesos rápidos</h2>
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{#each quickActions as action}
					<a
						href={action.href}
						class="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:ring-blue-300"
					>
						<p class="text-2xl">{action.icon}</p>
						<h3 class="mt-2 text-lg font-bold text-blue-950">{action.title}</h3>
						<p class="mt-1 text-sm text-slate-600">{action.description}</p>
					</a>
				{/each}
			</div>
		</section>
	</div>
{/if}
