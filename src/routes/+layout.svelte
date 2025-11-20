<script lang="ts">
    // ... (otras importaciones y el let data = $props() )
    let data = $props(); // <--- Asegúrate de que esto exista
</script>

<main>
    {@render data.children} 
</main>
