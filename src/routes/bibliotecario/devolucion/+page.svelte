<script lang="ts">
    import Scanner from '$lib/components/Scanner.svelte'; // Reutilizamos el componente Scanner
    import { supabase } from '$lib/utils/supabaseClient'; 

    let scanStep: 'book' = 'book';
    let documentCode: string | null = null;
    let activeLoanData: any = null;
    let statusMessage: string = 'Inicie escaneando el código de barras del libro a devolver.';
    let isProcessing: boolean = false;

    // Función que se ejecuta al recibir un código decodificado
    async function handleScan(code: string) {
        if (isProcessing) return;
        isProcessing = true;
        
        documentCode = code;
        await lookupAndFinalizeReturn(code);
        
        isProcessing = false;
    }

    // 1. Buscar Préstamo Activo y Procesar Devolución
    async function lookupAndFinalizeReturn(code: string) {
        statusMessage = '🔎 Buscando préstamo activo para este libro...';

        // Primero, obtener el ID del documento usando el código de biblioteca
        const { data: doc, error: docError } = await supabase
            .from('documentos')
            .select('id, titulo_preferido')
            .eq('codigo_biblioteca', code)
            .single();

        if (docError || !doc) {
            statusMessage = '❌ Error: Documento no encontrado o código incorrecto.';
            documentCode = null;
            return;
        }

        // Segundo, buscar el préstamo ACTIVO más reciente para ese documento
        const { data: loan, error: loanError } = await supabase
            .from('prestamos')
            .select(`
                id, fecha_prestamo, fecha_devolucion_esperada, 
                usuarios(nombre_completo, rol) 
            `)
            .eq('documento_id', doc.id)
            .eq('estado', 'Activo')
            .order('fecha_prestamo', { ascending: false }) // El préstamo activo más reciente
            .limit(1)
            .single();
            
        if (loanError || !loan) {
            statusMessage = `⚠️ El libro "${doc.titulo_preferido}" no tiene un préstamo activo.`;
            documentCode = null;
            return;
        }

        // Tercero, registrar la devolución y actualizar el stock
        activeLoanData = { ...loan, titulo: doc.titulo_preferido };
        await finalizeReturn(doc.id, loan.id);
    }

    // 2. Ejecutar la Devolución en la Base de Datos
    async function finalizeReturn(documentId: string, loanId: string) {
        statusMessage = '⏳ Registrando devolución y actualizando inventario...';
        const currentDate = new Date().toISOString().split('T')[0];

        // Transacción 1: Actualizar el registro del préstamo
        const { error: loanUpdateError } = await supabase
            .from('prestamos')
            .update({ 
                fecha_devolucion_real: currentDate,
                estado: 'Devuelto'
            })
            .eq('id', loanId);

        // Transacción 2: Aumentar el stock disponible del documento
        // Usamos una función de incremento atómico para seguridad:
        const { error: stockUpdateError } = await supabase
            .from('documentos')
            .update({ stock_disponible: supabase.sql`stock_disponible + 1` })
            .eq('id', documentId);

        if (loanUpdateError || stockUpdateError) {
            statusMessage = '🚨 Error crítico al registrar la devolución o actualizar el stock.';
            console.error('Errores:', loanUpdateError, stockUpdateError);
        } else {
            statusMessage = `🎉 ¡Devolución de "${activeLoanData.titulo}" registrada con éxito!`;
            checkOverdue(activeLoanData.fecha_devolucion_esperada, currentDate);
            
            // Reiniciar después de un breve mensaje
            setTimeout(resetState, 5000); 
        }
    }
    
    // 3. Revisar si hubo un retraso
    function checkOverdue(expectedDate: string, realDate: string) {
        const expected = new Date(expectedDate).getTime();
        const real = new Date(realDate).getTime();
        
        if (real > expected) {
            statusMessage += ' ⚠️ ¡ATENCIÓN! El libro fue devuelto con retraso.';
        }
    }

    function resetState() {
        documentCode = null;
        activeLoanData = null;
        statusMessage = 'Listo para escanear el próximo libro a devolver.';
    }
</script>

<div class="return-page">
    <h2 class="page-title">↩️ Devolución Rápida de Libros</h2>
    
    <div class="status-box">
        <p class="status-message">Estado: **{statusMessage}**</p>
    </div>

    {#if !activeLoanData}
        <Scanner title="Escanee el Código del Libro" onScanSuccess={handleScan} />
    {:else}
        <div class="summary-box">
            <h3>✅ Devolución Procesada</h3>
            <p>Libro: **{activeLoanData.titulo}**</p>
            <p>Prestado a: **{activeLoanData.usuarios.nombre_completo}** ({activeLoanData.usuarios.rol})</p>
            <p>Fecha de Préstamo: {activeLoanData.fecha_prestamo}</p>
            <p>Fecha Esperada: {activeLoanData.fecha_devolucion_esperada}</p>
            
            <button on:click={resetState} class="next-btn">Escanear Siguiente</button>
        </div>
    {/if}
</div>

<style>
    .return-page {
        max-width: 600px;
        margin: 40px auto;
        text-align: center;
    }
    .page-title { 
        color: #1e8449; 
        margin-bottom: 30px; 
        font-size: 2rem;
    }
    .status-box { 
        background: #e8f5e9; 
        padding: 15px; 
        border-radius: 8px; 
        margin-bottom: 20px; 
    }
    .status-message { 
        color: #1b5e20; 
        font-weight: bold; 
    }
    .summary-box {
        background: #fff;
        padding: 30px;
        border-radius: 10px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    .summary-box h3 {
        color: #1e8449;
        margin-bottom: 20px;
    }
    .next-btn {
        background-color: #28a745;
        color: white;
        padding: 10px 20px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        margin-top: 20px;
    }
</style>
