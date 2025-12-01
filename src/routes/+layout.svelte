<script lang="ts">
    // Desestructurar 'children' directamente de $props()
    let { children } = $props();
</script>

<header>
    <nav>
        <a href="/search">Buscador</a>
        <a href="/bibliotecario/devolucion">Devolución</a>
        <a href="/bibliotecario/usuarios">Usuarios</a>
        <a href="/">Salir</a>
    </nav>
</header>

<main>
    {@render children()} 
</main>

<style>
   /* ... deja los estilos tal como están, ahora sí funcionarán ... */
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
    }
    nav a {
        color: white;
        text-decoration: none;
        font-weight: bold;
        transition: color 0.3s;
    }
    nav a:hover {
        color: #ffc107;
    }
</style>