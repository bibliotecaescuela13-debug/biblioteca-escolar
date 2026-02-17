<script>
	import { onMount } from 'svelte';

	/** @type {{ title?: string; onScanSuccess?: (code: string) => void }} */
	let {
		title = 'Escáner de Código',
		onScanSuccess = (code) => console.log('Scanned:', code)
	} = $props();

	/** @type {HTMLInputElement | undefined} */
	let scanInput = $state();
	let scanValue = $state('');
	let status = $state('Listo para escanear. Haga clic en el campo y pase el escáner.');

	/** @param {KeyboardEvent} event */
	function handleKeydown(event) {
		if (event.ctrlKey || event.altKey || event.shiftKey || event.metaKey) return;

		if (event.key === 'Enter') {
			event.preventDefault();

			if (scanValue) {
				status = `Código detectado: ${scanValue}`;
				onScanSuccess(scanValue);
				scanValue = '';
			}
		}
	}

	onMount(() => {
		if (scanInput) {
			scanInput.focus();
		}
	});
</script>

<div class="scanner-box">
	<h3>{title}</h3>

	<div class="status">
		<p>{status}</p>
	</div>

	<input
		bind:this={scanInput}
		bind:value={scanValue}
		onkeydown={handleKeydown}
		type="text"
		placeholder="Escanee aquí..."
		aria-label="Campo de escaneo"
		class="scan-input"
		autocomplete="off"
	/>

	<div class="hint">(En un entorno real, este campo captura automáticamente el código de barras.)</div>
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
	}
	.hint {
		margin-top: 15px;
		font-size: 0.8em;
		color: #777;
	}
</style>
