<script lang="ts">
    // Desestructurar 'children' directamente de $props() para un uso limpio
    let { children } = $props(); 

    // Opcional: Si necesitas todos los datos cargados por el servidor:
    // let data = $props();
    // Pero si usas la desestructuración, children ya está disponible.
</script>

<main>
    {@render children()} 
</main>

<style>
    /* Estilos básicos de layout y reset */
    :global(body) {
        margin: 0;
        font-family: sans-serif;
        background-color: #f4f4f4;
        color: #333;
    }
    
    main {
        padding: 20px;
        /* Esto centra el contenido principal de forma simple */
        max-width: 1200px; 
        margin: 0 auto;
    }
    
    /* Estilos para la cabecera/navegación que diseñamos */
    header {
        background-color: #004d40; /* Verde oscuro, como la biblioteca */
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
        color: #ffc107; /* Amarillo para el hover */
    }
</style>
