<script lang="ts">
    import { onMount } from 'svelte';
    import { supabase } from '$lib/utils/supabaseClient';

    // Tipos de roles definidos en la base de datos
    const ROLES = ['Estudiante', 'Maestro', 'Bibliotecario', 'Comunidad'];
    
    let users: any[] = [];
    let loading = true;
    let filterRole = 'All';
    let searchTerm = '';
    let statusMessage: string | null = null;

    onMount(() => {
        fetchUsers();
    });

    // 1. Cargar todos los usuarios desde Supabase
    async function fetchUsers() {
        loading = true;
        statusMessage = 'Cargando lista de usuarios...';
        
        const { data, error } = await supabase
            .from('usuarios')
            .select('id, nombre_completo, rol, grado_escolar, codigo_barra_usuario');
        
        loading = false;

        if (error) {
            statusMessage = `❌ Error al cargar usuarios: ${error.message}`;
            console.error(error);
        } else if (data) {
            users = data;
            statusMessage = null;
        }
    }

    // 2. Actualizar el rol de un usuario
    async function updateRole(userId: string, newRole: string) {
        if (!confirm(`¿Está seguro de cambiar el rol del usuario ${userId} a ${newRole}?`)) {
            return;
        }

        statusMessage = `Actualizando rol del usuario ${userId}...`;
        
        const { error } = await supabase
            .from('usuarios')
            .update({ rol: newRole })
            .eq('id', userId);

        if (error) {
            statusMessage = `❌ Error al actualizar el rol: ${error.message}`;
            console.error(error);
        } else {
            statusMessage = `✅ Rol actualizado a ${newRole} con éxito.`;
            // Actualiza la lista sin recargar todos los datos (optimización)
            users = users.map(u => u.id === userId ? { ...u, rol: newRole } : u);
        }
    }

    // 3. Filtrado reactivo en el frontend
    $: filteredUsers = users.filter(user => {
        const roleMatch = filterRole === 'All' || user.rol === filterRole;
        const searchMatch = user.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            user.codigo_barra_usuario.includes(searchTerm.toLowerCase());
        return roleMatch && searchMatch;
    });

</script>

<div class="role-manager-container">
    <h2>👤 Gestión de Roles y Usuarios</h2>
    <p class="status-message">{statusMessage}</p>

    {#if loading}
        <p class="loading-message">Cargando...</p>
    {:else}
        <div class="controls-bar">
            <label for="filter-role">Filtrar por Rol:</label>
            <select id="filter-role" bind:value={filterRole}>
                <option value="All">Todos</option>
                {#each ROLES as role}
                    <option value={role}>{role}</option>
                {/each}
            </select>

            <label for="search-term">Buscar:</label>
            <input type="text" id="search-term" bind:value={searchTerm} placeholder="Nombre o Código de Barras">

            <button on:click={fetchUsers} class="refresh-btn">🔄 Recargar</button>
        </div>

        <div class="table-scroll">
            <table>
                <thead>
                    <tr>
                        <th>Nombre Completo</th>
                        <th>Cód. Barra Usuario</th>
                        <th>Grado Escolar</th>
                        <th>Rol Actual</th>
                        <th>Cambiar Rol</th>
                    </tr>
                </thead>
                <tbody>
                    {#each filteredUsers as user (user.id)}
                        <tr>
                            <td>{user.nombre_completo}</td>
                            <td>{user.codigo_barra_usuario}</td>
                            <td>{user.grado_escolar || '-'}</td>
                            <td><span class="role-tag role-{user.rol.toLowerCase()}">{user.rol}</span></td>
                            <td>
                                <select 
                                    on:change={(e) => updateRole(user.id, e.currentTarget.value)} 
                                    value={user.rol}
                                >
                                    {#each ROLES as role}
                                        <option value={role}>{role}</option>
                                    {/each}
                                </select>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {/if}
</div>

<style>
    .role-manager-container {
        max-width: 1000px;
        margin: 40px auto;
        padding: 20px;
        background-color: #f9f9f9;
        border-radius: 8px;
    }
    h2 {
        color: #004d40;
        margin-bottom: 25px;
    }
    .status-message {
        background-color: #e8f5e9;
        color: #1b5e20;
        padding: 10px;
        border-radius: 4px;
        margin-bottom: 20px;
    }
    .controls-bar {
        display: flex;
        gap: 20px;
        align-items: center;
        margin-bottom: 25px;
        padding: 15px;
        background-color: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .controls-bar input, .controls-bar select {
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 4px;
    }
    .refresh-btn {
        padding: 8px 15px;
        background-color: #03a9f4;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }
    .table-scroll {
        overflow-x: auto;
    }
    table {
        width: 100%;
        border-collapse: collapse;
        background-color: white;
    }
    th, td {
        padding: 12px;
        text-align: left;
        border-bottom: 1px solid #ddd;
    }
    th {
        background-color: #00796b;
        color: white;
    }
    .role-tag {
        display: inline-block;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.85rem;
        font-weight: bold;
    }
    /* Estilos basados en el rol (para rápida identificación visual) */
    .role-estudiante { background-color: #bbdefb; color: #1565c0; }
    .role-maestro { background-color: #c8e6c9; color: #388e3c; }
    .role-bibliotecario { background-color: #ffccbc; color: #d84315; }
    .role-comunidad { background-color: #fff9c4; color: #fbc02d; }
</style>
