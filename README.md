# 📚 Sistema de Gestión Biblioteca Escolar

Sistema modular para gestión de servicios anexos de biblioteca escolar: impresión, sala de video y promoción de lectura.

## ✨ Características

### Módulos Implementados
- **👥 Gestión de Usuarios**: Registro manual + importación masiva CSV (docentes, padres, estudiantes)
- **🖨️ Servicio de Impresión**: Registro ultra-rápido de copias (B/N y color)
- **📹 Sala de Video**: Control de uso y reservas
- **✨ Promoción de Lectura**: Gestión de talleres, clubes y eventos
- **📊 Dashboard**: Estadísticas de hoy/esta semana + exportación a Excel/CSV

### Características Técnicas
- **Backend**: Supabase (PostgreSQL en la nube)
- **Frontend**: React + Vite + Tailwind CSS
- **Deploy**: Netlify (hosting gratuito)
- **Diseño**: UI optimizada para velocidad y usabilidad escolar

---

## 🚀 Guía de Instalación

### Paso 1: Configurar Supabase

1. **Crear cuenta en Supabase**
   - Ve a [https://supabase.com](https://supabase.com)
   - Crea una cuenta gratuita

2. **Crear nuevo proyecto**
   - Click en "New Project"
   - Nombre: `biblioteca-escolar`
   - Contraseña de base de datos: Guarda esta contraseña
   - Región: Selecciona la más cercana
   - Plan: Free (gratuito)

3. **Ejecutar el schema SQL**
   - En el proyecto, ve a **SQL Editor** (menú lateral)
   - Abre el archivo `supabase-schema.sql` de este proyecto
   - Copia todo el contenido
   - Pégalo en el editor SQL de Supabase
   - Click en **Run** (abajo a la derecha)
   - Deberías ver: "Success. No rows returned"

4. **Obtener credenciales**
   - Ve a **Settings** → **API**
   - Copia estos dos valores:
     - `Project URL` → Esta será tu `VITE_SUPABASE_URL`
     - `anon public` key → Esta será tu `VITE_SUPABASE_ANON_KEY`

### Paso 2: Configurar Proyecto Local

1. **Clonar o descargar este proyecto**
   ```bash
   cd biblioteca-escolar
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   # Copia el archivo de ejemplo
   cp .env.example .env
   
   # Edita el archivo .env y agrega tus credenciales de Supabase
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
   ```

4. **Ejecutar en desarrollo**
   ```bash
   npm run dev
   ```
   
   La aplicación estará en: `http://localhost:5173`

### Paso 3: Desplegar en Netlify

1. **Preparar el proyecto**
   - Asegúrate de que tu proyecto esté en GitHub (crea un repositorio)
   - Sube todos los archivos excepto `node_modules` y `.env`

2. **Conectar con Netlify**
   - Ve a [https://netlify.com](https://netlify.com)
   - Click en "Add new site" → "Import an existing project"
   - Conecta tu cuenta de GitHub
   - Selecciona el repositorio `biblioteca-escolar`

3. **Configurar el build**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Click en "Show advanced" → "New variable"
   - Agrega tus variables de entorno:
     - `VITE_SUPABASE_URL`: tu URL de Supabase
     - `VITE_SUPABASE_ANON_KEY`: tu anon key

4. **Desplegar**
   - Click en "Deploy site"
   - Espera 1-2 minutos
   - ¡Listo! Tu app estará en: `https://tu-sitio.netlify.app`

---

## 📖 Guía de Uso

### Primer Uso

1. **Agregar usuarios**
   - Ve a la sección "Usuarios"
   - Opción A: Agregar uno por uno con el botón "Agregar"
   - Opción B: Importar masivamente:
     - Click en "Plantilla" para descargar el formato CSV
     - Llena el CSV con tus datos
     - Click en "Importar CSV" y selecciona el archivo

2. **Registrar servicios**
   - **Impresión**: Click en "Impresión" → "Registrar" → Completa el formulario rápido
   - **Sala de Video**: Click en "Sala Video" → "Registrar Uso"
   - **Promoción Lectura**: Click en "Lectura" → "Nueva Actividad"

3. **Ver estadísticas**
   - El "Panel" muestra resumen de hoy/esta semana
   - Click en "Exportar Todo" para descargar CSV con todos los datos

### Importación CSV - Formato Usuarios

Archivo CSV debe tener estas columnas (en este orden):
```
nombre,tipo,identificacion,grado,seccion,telefono,email
Juan Pérez,docente,12345678,,,555-1234,juan@escuela.com
María González,padre,87654321,,,555-5678,maria@email.com
Carlos López,estudiante,11223344,5to,A,555-9012,
```

**Tipos válidos**: `docente`, `padre`, `estudiante`

---

## 🔧 Mantenimiento

### Respaldo de Datos

**Desde Supabase:**
1. Ve a tu proyecto en Supabase
2. Database → Backups
3. Puedes programar backups automáticos (plan Pro) o hacer backups manuales

**Desde la aplicación:**
- Usa los botones "Exportar" en cada módulo
- Guarda los CSV como respaldo

### Actualizar la Aplicación

Si haces cambios en el código:
```bash
# Prueba localmente
npm run dev

# Si todo funciona bien, haz commit y push a GitHub
git add .
git commit -m "Descripción de cambios"
git push

# Netlify detectará los cambios y desplegará automáticamente
```

---

## 📋 Módulo de Libros (Futuro)

El sistema está preparado para agregar gestión de libros cuando lo necesites. 

**Funcionalidades planeadas:**
- Catálogo básico (título, autor, ISBN, ubicación)
- Préstamos y devoluciones
- Búsqueda de libros
- Historial de préstamos por usuario
- Alertas de libros vencidos

**Para activarlo**, necesitarás:
1. Ejecutar el schema SQL adicional (lo crearé cuando lo necesites)
2. Agregar los componentes del módulo de libros
3. Actualizar la navegación

---

## 🛠️ Solución de Problemas

### Error de conexión a Supabase
- Verifica que las variables de entorno estén correctas
- Confirma que el schema SQL se ejecutó correctamente
- Revisa la consola del navegador para mensajes de error

### Importación CSV falla
- Verifica que el archivo tenga el formato correcto
- Asegúrate de que no haya filas vacías al final
- Los valores con comas deben estar entre comillas

### Netlify no despliega
- Revisa los logs de build en Netlify
- Confirma que las variables de entorno estén configuradas
- Verifica que el archivo `netlify.toml` esté presente

---

## 📞 Soporte

Si necesitas ayuda:
1. Revisa esta documentación
2. Consulta la documentación de [Supabase](https://supabase.com/docs)
3. Consulta la documentación de [Netlify](https://docs.netlify.com)

---

## 📄 Licencia

Proyecto de código abierto para bibliotecas escolares.

---

**¡Feliz gestión bibliotecaria! 📚✨**
