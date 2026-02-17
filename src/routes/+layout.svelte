<script lang="ts">
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/utils/supabaseClient';

	let { children, data }: { children: any; data: any } = $props();

	const isLoggedIn = Boolean(data?.session);
	const isBibliotecario = data?.user?.rol === 'Bibliotecario';

	async function handleSignOut() {
		await supabase.auth.signOut();
		goto('/');
	}
</script>

<header>
	<nav>
		<a href="/search">Buscador</a>

		{#if !isLoggedIn}
			<a href="/">Ingresar</a>
		{:else}
			{#if isBibliotecario}
				<a href="/admin/servicios">Impresiones</a>
				<a href="/admin/prestamos">Préstamos</a>
				<a href="/admin/usuarios">Usuarios</a>
			{/if}
			<button type="button" onclick={handleSignOut}>Salir</button>
		{/if}
	</nav>
</header>

<main>
	{@render children()}
</main>

<style>
	:global(body) {
		margin: 0;
		font-family: sans-serif;
		background-color: #f4f4f4;
		color: #333;
	}

	main {
		padding: 20px;
		max-width: 1200px;
		margin: 0 auto;
	}

	header {
		background-color: #004d40;
		color: white;
		padding: 10px 20px;
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
	}

	nav {
		display: flex;
		gap: 15px;
		align-items: center;
		flex-wrap: wrap;
	}

	nav a,
	nav button {
		color: white;
		text-decoration: none;
		font-weight: bold;
		transition: color 0.3s;
		background: transparent;
		border: none;
		padding: 0;
		cursor: pointer;
		font-size: 1rem;
	}

	nav a:hover,
	nav button:hover {
		color: #ffc107;
	}
</style>
