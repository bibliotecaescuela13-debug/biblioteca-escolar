// svelte.config.js

// Mantener esta línea para el preprocesamiento
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'; 

// --- CAMBIO CLAVE AQUÍ: Importar el adaptador de Netlify ---
import adapter from '@sveltejs/adapter-netlify'; 
// -----------------------------------------------------------

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// ... (La configuración del preprocesamiento se mantiene igual)
	preprocess: vitePreprocess(),

	kit: {
		// --- CAMBIO CLAVE AQUÍ: Usar el adaptador de Netlify ---
		adapter: adapter({
            // Puedes dejar las opciones vacías o añadir configuración específica si la necesitas
        })
        // ----------------------------------------------------
	}
};

export default config;
