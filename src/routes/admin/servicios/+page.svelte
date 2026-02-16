<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/utils/supabaseClient';

	type Usuario = {
		id: string;
		nombre_completo: string;
	};

	type ServicioCopiado = {
		id: string;
		usuario_id: string;
		cantidad_paginas: number;
		tipo: 'Impresión' | 'Fotocopia' | string;
		entregado: boolean;
		created_at?: string;
		usuarios?: {
			nombre_completo: string;
		} | null;
	};

	let servicios: ServicioCopiado[] = [];
	let usuarios: Usuario[] = [];
	let loading = false;
	let saving = false;
	let statusMessage: string | null = null;

	let searchUsuario = '';
	let usuarioId = '';
	let cantidadPaginas = 1;
	let esImpresion = true;

	$: usuariosFiltrados = usuarios
		.filter((u) => u.nombre_completo.toLowerCase().includes(searchUsuario.toLowerCase()))
		.slice(0, 20);

	$: pendientes = servicios.filter((s) => !s.entregado);
	$: completados = servicios.filter((s) => s.entregado);

	onMount(async () => {
		await Promise.all([fetchServicios(), fetchUsuarios()]);
	});

	async function fetchServicios() {
		loading = true;
		statusMessage = null;

		const { data, error } = await supabase
			.from('servicios_copiado')
			.select('*, usuarios(nombre_completo)')
			.order('created_at', { ascending: false });

		loading = false;

		if (error) {
			statusMessage = `❌ Error al cargar servicios: ${error.message}`;
			return;
		}

		servicios = (data ?? []) as ServicioCopiado[];
	}

	async function fetchUsuarios() {
		const { data, error } = await supabase
			.from('usuarios')
			.select('id, nombre_completo')
			.order('nombre_completo', { ascending: true });

		if (error) {
			statusMessage = `❌ Error al cargar usuarios: ${error.message}`;
			return;
		}

		usuarios = (data ?? []) as Usuario[];
	}

	async function crearServicio() {
		statusMessage = null;

		if (!usuarioId) {
			statusMessage = '⚠️ Selecciona un usuario.';
			return;
		}

		if (!cantidadPaginas || cantidadPaginas < 1) {
			statusMessage = '⚠️ La cantidad de páginas debe ser mayor a 0.';
			return;
		}

		saving = true;

		const nuevoServicio = {
			usuario_id: usuarioId,
			cantidad_paginas: cantidadPaginas,
			tipo: esImpresion ? 'Impresión' : 'Fotocopia',
			entregado: false
		};

		const { error } = await supabase.from('servicios_copiado').insert(nuevoServicio);

		saving = false;

		if (error) {
			statusMessage = `❌ Error al crear servicio: ${error.message}`;
			return;
		}

		statusMessage = '✅ Servicio registrado correctamente.';
		cantidadPaginas = 1;
		esImpresion = true;
		await fetchServicios();
	}

	async function marcarComoEntregado(id: string) {
		const { error } = await supabase
			.from('servicios_copiado')
			.update({ entregado: true })
			.eq('id', id);

		if (error) {
			statusMessage = `❌ Error al marcar como entregado: ${error.message}`;
			return;
		}

		statusMessage = '✅ Servicio marcado como entregado.';
		await fetchServicios();
	}
</script>

<div class="mx-auto max-w-7xl p-4 md:p-6">
	<div class="mb-6">
		<h1 class="text-2xl font-bold text-slate-800">Gestión de servicios de copiado</h1>
		<p class="text-sm text-slate-500">Registra impresiones/fotocopias y controla entregas.</p>
	</div>

	<div class="mb-6 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
		<h2 class="mb-4 text-lg font-semibold">Nuevo servicio</h2>

		<div class="grid gap-4 md:grid-cols-3">
			<div class="md:col-span-1">
				<label class="mb-1 block text-sm font-medium text-slate-700" for="search-user">Buscar usuario</label>
				<input
					id="search-user"
					type="text"
					bind:value={searchUsuario}
					placeholder="Escribe un nombre..."
					class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
				/>
			</div>

			<div class="md:col-span-1">
				<label class="mb-1 block text-sm font-medium text-slate-700" for="usuario">Usuario</label>
				<select
					id="usuario"
					bind:value={usuarioId}
					class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
				>
					<option value="">Selecciona un usuario</option>
					{#each usuariosFiltrados as user}
						<option value={user.id}>{user.nombre_completo}</option>
					{/each}
				</select>
			</div>

			<div class="md:col-span-1">
				<label class="mb-1 block text-sm font-medium text-slate-700" for="cantidad">Cantidad de páginas</label>
				<input
					id="cantidad"
					type="number"
					min="1"
					bind:value={cantidadPaginas}
					class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
				/>
			</div>
		</div>

		<div class="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
			<label class="inline-flex cursor-pointer items-center gap-3">
				<span class="text-sm font-medium text-slate-700">Tipo</span>
				<button
					type="button"
					class={`rounded-full px-3 py-1 text-sm font-medium ${esImpresion ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}`}
					onclick={() => (esImpresion = !esImpresion)}
				>
					{esImpresion ? 'Impresión' : 'Fotocopia'}
				</button>
			</label>

			<button
				type="button"
				onclick={crearServicio}
				disabled={saving}
				class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
			>
				{saving ? 'Guardando...' : 'Registrar impresión'}
			</button>
		</div>

		{#if statusMessage}
			<p class="mt-3 text-sm text-slate-700">{statusMessage}</p>
		{/if}
	</div>

	<div class="grid gap-4 md:grid-cols-2">
		<section class="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
			<div class="mb-3 flex items-center justify-between">
				<h2 class="text-lg font-semibold text-slate-800">Pendientes</h2>
				<span class="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">{pendientes.length}</span>
			</div>

			{#if loading}
				<p class="text-sm text-slate-500">Cargando...</p>
			{:else if pendientes.length === 0}
				<p class="text-sm text-slate-500">No hay servicios pendientes.</p>
			{:else}
				<ul class="space-y-3">
					{#each pendientes as servicio}
						<li class="rounded-lg border border-slate-200 p-3">
							<p class="font-medium text-slate-800">{servicio.usuarios?.nombre_completo ?? 'Sin usuario'}</p>
							<p class="text-sm text-slate-600">{servicio.tipo} · {servicio.cantidad_paginas} pág.</p>
							<button
								type="button"
								onclick={() => marcarComoEntregado(servicio.id)}
								class="mt-2 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
							>
								Marcar como entregado
							</button>
						</li>
					{/each}
				</ul>
			{/if}
		</section>

		<section class="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
			<div class="mb-3 flex items-center justify-between">
				<h2 class="text-lg font-semibold text-slate-800">Completados</h2>
				<span class="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800">{completados.length}</span>
			</div>

			{#if loading}
				<p class="text-sm text-slate-500">Cargando...</p>
			{:else if completados.length === 0}
				<p class="text-sm text-slate-500">No hay servicios completados.</p>
			{:else}
				<ul class="space-y-3">
					{#each completados as servicio}
						<li class="rounded-lg border border-slate-200 p-3">
							<p class="font-medium text-slate-800">{servicio.usuarios?.nombre_completo ?? 'Sin usuario'}</p>
							<p class="text-sm text-slate-600">{servicio.tipo} · {servicio.cantidad_paginas} pág.</p>
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	</div>
</div>
