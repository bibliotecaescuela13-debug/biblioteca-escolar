<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { createWorker } from 'tesseract.js'; // Usaremos esto para simular la detección o como base para un escáner real si lo implementamos

    // Propiedad para el título que se mostrará en la interfaz
    let { title = 'Escáner de Código' } = $props();

    // Propiedad para el callback cuando se escanea con éxito
    let { onScanSuccess = (code: string) => console.log('Scanned:', code) } = $props();

    let scanInput: HTMLInputElement;
    let scanValue = '';
    let status = 'Listo para escanear. Haga clic en el campo y pase el escáner.';
    let isScanning = false;

    // --- Lógica de Simulación (o base para un hardware de escáner real) ---

    // Usaremos la entrada de teclado para simular la lectura del escáner.
    function handleKeydown(event: KeyboardEvent) {
        // Ignorar teclas modificadoras
        if (event.ctrlKey || event.altKey || event.shiftKey || event.metaKey) return;

        // Si la tecla presionada es Enter (final del código de barras)
        if (event.key === 'Enter') {
            event.preventDefault();
            
            // Si hay un valor, lo procesamos
            if (scanValue) {
                status = `Código detectado: ${scanValue}`;
                onScanSuccess(scanValue);
                scanValue = ''; // Limpiar el input para el próximo escaneo
            }
        }
    }

    onMount(() => {
        // Enfocar el input al cargar para que el escáner (o el teclado) pueda empezar a escribir inmediatamente
        if (scanInput) {
            scanInput.focus();
        }
    });

    // --- Si implementas un escáner basado en cámara (usando QuaggaJS, etc.), iría aquí ---
    
</script>

<div class="scanner-box">
    <h3>{title}</h3>
    
    <div class="status">
        <p>{status}</p>
    </div>

    <input 
        bind:this={scanInput}
        bind:value={scanValue}
        on:keydown={handleKeydown}
        type="text"
        placeholder="Escanee aquí..."
        aria-label="Campo de escaneo"
        class="scan-input"
        autocomplete="off"
    />

    <div class="hint">
        (En un entorno real, este campo captura automáticamente el código de barras.)
    </div>
</div>

<style>
    .scanner-box {
        text-align: center;
        padding: 30px;
        border: 2px solid #004d40;
        border-radius: 12px;
        background-color: #fff;
        margin: 30px auto;
        max-width: 400px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    }
    h3 {
        color: #004d40;
        margin-top: 0;
    }
    .status {
        background-color: #e0f2f1;
        padding: 10px;
        border-radius: 6px;
        margin-bottom: 20px;
        color: #004d40;
        font-weight: bold;
    }
    .scan-input {
        width: 90%;
        padding: 12px;
        font-size: 1.1em;
        text-align: center;
        border: 1px solid #ccc;
        border-radius: 4px;
        /* Ocultamos visualmente el campo en producción si usamos una cámara,
           pero lo dejamos visible ahora para la simulación con teclado */
    }
    .hint {
        margin-top: 15px;
        font-size: 0.8em;
        color: #777;
    }
</style>
