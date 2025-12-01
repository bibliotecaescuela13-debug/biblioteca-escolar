<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>
<script lang="ts">
    import { supabase } from '$lib/utils/supabaseClient';
    import { goto } from '$app/navigation';

    let email = '';
    let password = '';
    let loading = false;
    let error: string | null = null;
    let isRegistering = false; // Alterna entre Login y Registro

    async function handleAuth() {
        error = null;
        loading = true;

        let authPromise;
        if (isRegistering) {
            // Intenta el registro Nota Supabase Auth gestiona el envío de emails de confirmación.
            authPromise = supabase.auth.signUp({
                email,
                password,
            });
            statusMessage = '¡Registro exitoso! Revisa tu correo electrónico para confirmar tu cuenta.';
        } else {
            // Intenta el inicio de sesión
            authPromise = supabase.auth.signInWithPassword({
                email,
                password,
            });
        }

        const { error: authError, data } = await authPromise;

        if (authError) {
            error = authError.message;
        } else if (data.user) {
            // Si el login fue exitoso, redirige a la página principal de búsqueda
            goto('/search');
        }
        
        loading = false;
    }
</script>

<div class="auth-container">
    <h2>{isRegistering ? 'Registrar Usuario' : 'Iniciar Sesión'}</h2>

    <form on:submit|preventDefault={handleAuth} class="auth-form">
        <label for="email">Correo Electrónico</label>
        <input type="email" bind:value={email} required disabled={loading} placeholder="usuario@escuela.edu">

        <label for="password">Contraseña</label>
        <input type="password" bind:value={password} required disabled={loading} placeholder="••••••••">

        {#if error}
            <p class="error-message">❌ {error}</p>
        {/if}

        <button type="submit" disabled={loading} class="auth-btn">
            {loading ? 'Cargando...' : (isRegistering ? 'Registrarse' : 'Entrar')}
        </button>
    </form>

    <div class="toggle-mode">
        <button on:click={() => isRegistering = !isRegistering} class="toggle-btn">
            {isRegistering ? '¿Ya tienes cuenta? Inicia Sesión' : '¿Necesitas una cuenta? Regístrate'}
        </button>
    </div>
</div>

<style>
    .auth-container {
        max-width: 400px;
        margin: 50px auto;
        padding: 40px;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        background-color: #ffffff;
        text-align: center;
    }
    h2 {
        color: #00796b;
        margin-bottom: 30px;
    }
    .auth-form label {
        display: block;
        text-align: left;
        margin-bottom: 5px;
        font-weight: bold;
        color: #555;
    }
    .auth-form input {
        width: 100%;
        padding: 12px;
        margin-bottom: 20px;
        border: 1px solid #ddd;
        border-radius: 5px;
        box-sizing: border-box;
    }
    .auth-btn {
        width: 100%;
        padding: 12px;
        background-color: #4CAF50; /* Verde amigable */
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 1.1rem;
        transition: background-color 0.3s;
    }
    .auth-btn:hover:not(:disabled) {
        background-color: #45a049;
    }
    .error-message {
        color: #d32f2f;
        background-color: #ffebee;
        padding: 10px;
        border-radius: 5px;
        margin-bottom: 15px;
    }
    .toggle-mode {
        margin-top: 20px;
    }
    .toggle-btn {
        background: none;
        border: none;
        color: #00796b;
        cursor: pointer;
        text-decoration: underline;
    }
</style>
