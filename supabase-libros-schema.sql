-- ============================================
-- MÓDULO DE LIBROS - PARA IMPLEMENTAR DESPUÉS
-- ============================================
-- Este schema está listo para cuando necesites agregar gestión de libros
-- Simplemente ejecuta este SQL en Supabase cuando lo necesites

-- Tabla de libros
CREATE TABLE libros (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  isbn TEXT,
  titulo TEXT NOT NULL,
  autor TEXT,
  editorial TEXT,
  anio_publicacion INTEGER,
  categoria TEXT,
  ubicacion TEXT, -- Ej: "Estante 3, Fila 2"
  estado TEXT CHECK (estado IN ('disponible', 'prestado', 'mantenimiento', 'perdido')) DEFAULT 'disponible',
  cantidad_total INTEGER DEFAULT 1,
  cantidad_disponible INTEGER DEFAULT 1,
  portada_url TEXT,
  descripcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de préstamos
CREATE TABLE prestamos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  libro_id UUID REFERENCES libros(id) ON DELETE RESTRICT,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE RESTRICT,
  libro_titulo TEXT NOT NULL,
  usuario_nombre TEXT NOT NULL,
  fecha_prestamo DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_devolucion_esperada DATE NOT NULL,
  fecha_devolucion_real DATE,
  estado TEXT CHECK (estado IN ('activo', 'devuelto', 'vencido')) DEFAULT 'activo',
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_libros_titulo ON libros(titulo);
CREATE INDEX idx_libros_autor ON libros(autor);
CREATE INDEX idx_libros_isbn ON libros(isbn);
CREATE INDEX idx_libros_estado ON libros(estado);
CREATE INDEX idx_prestamos_usuario ON prestamos(usuario_id);
CREATE INDEX idx_prestamos_libro ON prestamos(libro_id);
CREATE INDEX idx_prestamos_estado ON prestamos(estado);
CREATE INDEX idx_prestamos_fecha_devolucion ON prestamos(fecha_devolucion_esperada);

-- Habilitar RLS
ALTER TABLE libros ENABLE ROW LEVEL SECURITY;
ALTER TABLE prestamos ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Enable all access for libros" ON libros FOR ALL USING (true);
CREATE POLICY "Enable all access for prestamos" ON prestamos FOR ALL USING (true);

-- Función para actualizar disponibilidad de libros automáticamente
CREATE OR REPLACE FUNCTION actualizar_disponibilidad_libro()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Nuevo préstamo: reducir disponibilidad
    UPDATE libros 
    SET cantidad_disponible = cantidad_disponible - 1
    WHERE id = NEW.libro_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.estado = 'devuelto' AND OLD.estado != 'devuelto' THEN
    -- Devolución: aumentar disponibilidad
    UPDATE libros 
    SET cantidad_disponible = cantidad_disponible + 1
    WHERE id = NEW.libro_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar disponibilidad automáticamente
CREATE TRIGGER trigger_actualizar_disponibilidad
AFTER INSERT OR UPDATE ON prestamos
FOR EACH ROW
EXECUTE FUNCTION actualizar_disponibilidad_libro();

-- Vista para préstamos activos con información completa
CREATE VIEW vista_prestamos_activos AS
SELECT 
  p.*,
  l.titulo as libro_titulo_completo,
  l.autor,
  l.isbn,
  u.nombre as usuario_nombre_completo,
  u.tipo as usuario_tipo,
  u.telefono,
  u.email,
  CASE 
    WHEN p.fecha_devolucion_esperada < CURRENT_DATE THEN 'vencido'
    WHEN p.fecha_devolucion_esperada <= CURRENT_DATE + INTERVAL '3 days' THEN 'por_vencer'
    ELSE 'activo'
  END as alerta
FROM prestamos p
JOIN libros l ON p.libro_id = l.id
JOIN usuarios u ON p.usuario_id = u.id
WHERE p.estado = 'activo';

-- DATOS DE EJEMPLO (opcional - elimina esto si no quieres datos de prueba)
/*
INSERT INTO libros (titulo, autor, editorial, categoria, ubicacion, cantidad_total, cantidad_disponible) VALUES
('Cien Años de Soledad', 'Gabriel García Márquez', 'Sudamericana', 'Novela', 'Estante 1, Fila A', 3, 3),
('El Principito', 'Antoine de Saint-Exupéry', 'Salamandra', 'Infantil', 'Estante 2, Fila B', 5, 5),
('Don Quijote de la Mancha', 'Miguel de Cervantes', 'RAE', 'Clásico', 'Estante 1, Fila C', 2, 2);
*/
