# 🚀 Guía Rápida de Inicio

## Configuración Express (15 minutos)

### 1. Supabase (5 min)
```
1. Ir a supabase.com → Crear cuenta
2. New Project → Nombre: "biblioteca-escolar"
3. SQL Editor → Pegar contenido de supabase-schema.sql → Run
4. Settings → API → Copiar:
   - Project URL
   - anon public key
```

### 2. Proyecto Local (5 min)
```bash
cd biblioteca-escolar
npm install
cp .env.example .env
# Editar .env con tus credenciales de Supabase
npm run dev
```

### 3. Netlify Deploy (5 min)
```
1. Subir proyecto a GitHub
2. netlify.com → New site → Import from Git
3. Seleccionar repo
4. Environment variables:
   - VITE_SUPABASE_URL: [tu URL]
   - VITE_SUPABASE_ANON_KEY: [tu key]
5. Deploy!
```

## Primer Uso

### Paso 1: Agregar Usuarios
**Opción A - Importar CSV:**
1. Click "Usuarios" → "Plantilla" (descargar)
2. Llenar CSV con tus datos
3. "Importar CSV" → Seleccionar archivo

**Opción B - Manual:**
- Click "Usuarios" → "Agregar" → Completar formulario

### Paso 2: Registrar Servicios
- **Impresión**: Click "Impresión" → "Registrar"
  - Usuario → Cantidad → Tipo (B/N o Color) → Guardar
  
- **Sala Video**: Click "Sala Video" → "Registrar Uso"
  - Usuario → Propósito → Hora → Guardar

- **Lectura**: Click "Lectura" → "Nueva Actividad"
  - Nombre → Tipo → Fecha → Guardar

### Paso 3: Consultar y Exportar
- Dashboard muestra estadísticas de hoy/semana
- "Exportar Todo" descarga CSV con todos los datos
- Cada módulo tiene su botón de exportación

## Tips de Velocidad ⚡

### Registro Ultra-Rápido
1. Ten la sección del servicio abierta
2. Click "Registrar" → Formulario mínimo
3. Solo campos esenciales obligatorios
4. Enter para guardar

### Atajos
- Dashboard: Resumen visual rápido
- Importar usuarios en lote al inicio del año
- Exportar datos al final de cada semana/mes

## Troubleshooting Rápido

**No carga datos:**
- Verifica .env o variables en Netlify
- Revisa que SQL schema se ejecutó

**Error al importar CSV:**
- Verifica formato: nombre,tipo,identificacion,grado,seccion,telefono,email
- No dejes filas vacías

**Netlify falla:**
- Verifica que variables de entorno estén configuradas
- Revisa logs en Netlify dashboard

## ¿Necesitas Módulo de Libros?

Cuando lo necesites:
1. Ejecuta `supabase-libros-schema.sql` en Supabase
2. Avísame para agregar los componentes React
3. Listo para catálogo + préstamos

---

**Documentación completa:** Ver README.md
