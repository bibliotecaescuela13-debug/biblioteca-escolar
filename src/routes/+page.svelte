<script lang="ts">
    import { hasSupabaseEnv, supabase } from '$lib/utils/supabaseClient';

     let loading = false;
     let error: string | null = null;

    function mapAuthError(message: string) {
        const normalized = message.toLowerCase();
        if (normalized.includes('unsupported provider') || normalized.includes('provider is not enabled')) {
            return 'Google Auth no está habilitado en Supabase. Actívalo en Authentication > Providers > Google.';
        }
        return message;
    }

    async function handleGoogleAuth() {
         error = null;
         if (!hasSupabaseEnv) {
             error = 'Configura VITE_PUBLIC_SUPABASE_URL y VITE_PUBLIC_SUPABASE_ANON_KEY para continuar.';
             return;
         }
         loading = true;
         const { error: oauthError } = await supabase.auth.signInWithOAuth({
             provider: 'google',
             options: { redirectTo: `${window.location.origin}/search` }
         });

         if (oauthError) {
             error = mapAuthError(oauthError.message);
             loading = false;
         }
     }
</script>

<div class="auth-container">
    <h1>📚 Biblioteca Escolar</h1>
    <p class="subtitle">Accede con tu cuenta institucional de Google.</p>

    {#if error}
        <p class="error-message">❌ {error}</p>
    {/if}

    <button type="button" disabled={loading} class="google-btn" on:click={handleGoogleAuth}>
        {loading ? 'Redirigiendo…' : 'Continuar con Google'}
    </button>
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
    h1 {
         color: #00796b;
         margin-bottom: 10px;
         font-size: 1.8rem;
     }
    .subtitle {
        color: #666;
        margin-bottom: 25px;
     }
     .error-message {
         color: #d32f2f;
         background-color: #ffebee;
         padding: 10px;
         border-radius: 5px;
         margin-bottom: 15px;
     }
    .google-btn {
        width: 100%;
        padding: 12px;
        background-color: #ffffff;
        color: #333;
        border: 1px solid #ccc;
        border-radius: 5px;
         cursor: pointer;
        font-size: 1rem;
        font-weight: 600;
    }
    .google-btn:hover:not(:disabled) {
        background-color: #f3f3f3;
     }
</style>