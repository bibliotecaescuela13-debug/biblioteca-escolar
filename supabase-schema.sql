-- SCHEMA PARA BIBLIOTECA ESCOLAR
-- Ejecutar estos comandos en Supabase SQL Editor

-- Tabla de usuarios (docentes, padres, estudiantes)
CREATE TABLE usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('docente', 'padre', 'estudiante')),
  identificacion TEXT,
  grado TEXT,
  seccion TEXT,
  telefono TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de servicios de impresión
CREATE TABLE servicios_impresion (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  usuario_nombre TEXT NOT NULL,
  cantidad_copias INTEGER NOT NULL,
  tipo_impresion TEXT CHECK (tipo_impresion IN ('blanco_negro', 'color')),
  costo DECIMAL(10,2),
  detalles TEXT,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  hora TIME NOT NULL DEFAULT CURRENT_TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de servicios de sala de video
CREATE TABLE servicios_video (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  usuario_nombre TEXT NOT NULL,
  proposito TEXT NOT NULL,
  duracion_minutos INTEGER,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  hora_inicio TIME NOT NULL,
  hora_fin TIME,
  detalles TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de actividades de promoción de lectura
CREATE TABLE actividades_lectura (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre_actividad TEXT NOT NULL,
  tipo TEXT CHECK (tipo IN ('taller', 'club', 'evento', 'presentacion')),
  descripcion TEXT,
  fecha DATE NOT NULL,
  participantes INTEGER,
  responsable TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de asistencia a actividades de lectura
CREATE TABLE asistencia_lectura (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  actividad_id UUID REFERENCES actividades_lectura(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  usuario_nombre TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_usuarios_tipo ON usuarios(tipo);
CREATE INDEX idx_usuarios_nombre ON usuarios(nombre);
CREATE INDEX idx_impresion_fecha ON servicios_impresion(fecha);
CREATE INDEX idx_impresion_usuario ON servicios_impresion(usuario_id);
CREATE INDEX idx_video_fecha ON servicios_video(fecha);
CREATE INDEX idx_video_usuario ON servicios_video(usuario_id);
CREATE INDEX idx_lectura_fecha ON actividades_lectura(fecha);

-- Habilitar Row Level Security (RLS)
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicios_impresion ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicios_video ENABLE ROW LEVEL SECURITY;
ALTER TABLE actividades_lectura ENABLE ROW LEVEL SECURITY;
ALTER TABLE asistencia_lectura ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (permitir todo por ahora - ajustar según necesidades)
CREATE POLICY "Enable all access for usuarios" ON usuarios FOR ALL USING (true);
CREATE POLICY "Enable all access for servicios_impresion" ON servicios_impresion FOR ALL USING (true);
CREATE POLICY "Enable all access for servicios_video" ON servicios_video FOR ALL USING (true);
CREATE POLICY "Enable all access for actividades_lectura" ON actividades_lectura FOR ALL USING (true);
CREATE POLICY "Enable all access for asistencia_lectura" ON asistencia_lectura FOR ALL USING (true);
