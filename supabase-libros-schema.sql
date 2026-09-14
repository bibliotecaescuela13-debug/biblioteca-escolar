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

-- El catálogo es público; toda operación administrativa exige autenticación
-- y el rol definido por public.is_library_admin() en supabase-schema.sql.
CREATE POLICY "Public read access for libros"
ON libros FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "Library admin full access for libros"
ON libros FOR ALL TO authenticated
USING (public.is_library_admin())
WITH CHECK (public.is_library_admin());

CREATE POLICY "Library admin full access for prestamos"
ON prestamos FOR ALL TO authenticated
USING (public.is_library_admin())
WITH CHECK (public.is_library_admin());

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.libros'::regclass
      and conname = 'libros_disponibilidad_valida'
  ) then
    alter table public.libros
      add constraint libros_disponibilidad_valida
      check (cantidad_disponible >= 0 and cantidad_disponible <= cantidad_total) not valid;
  end if;
end;
$$;

create or replace function public.ajustar_disponibilidad_por_total()
returns trigger
language plpgsql
as $$
declare
  ejemplares_prestados integer;
begin
  if new.cantidad_total is distinct from old.cantidad_total then
    ejemplares_prestados := old.cantidad_total - old.cantidad_disponible;

    if new.cantidad_total < ejemplares_prestados then
      raise exception 'La cantidad total no puede ser menor que los ejemplares prestados (%).', ejemplares_prestados
        using errcode = '23514';
    end if;

    new.cantidad_disponible := new.cantidad_total - ejemplares_prestados;
  end if;

  new.estado := case when new.cantidad_disponible > 0 then 'disponible' else 'prestado' end;
  return new;
end;
$$;

create or replace function public.actualizar_disponibilidad_libro()
returns trigger
language plpgsql
as $$
declare
  old_prestado boolean := false;
  new_prestado boolean := false;
begin
  if tg_op = 'INSERT' then
    if coalesce(new.estado, 'activo') <> 'devuelto' then
      update public.libros
      set cantidad_disponible = cantidad_disponible - 1,
          estado = case when cantidad_disponible - 1 > 0 then 'disponible' else 'prestado' end
      where id = new.libro_id
        and cantidad_disponible > 0;

      if not found then
        raise exception 'El libro ya no tiene ejemplares disponibles.'
          using errcode = '23514';
      end if;
    end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    if coalesce(old.estado, 'activo') <> 'devuelto' then
      update public.libros
      set cantidad_disponible = least(cantidad_disponible + 1, cantidad_total),
          estado = 'disponible'
      where id = old.libro_id;
    end if;
    return old;
  end if;

  old_prestado := coalesce(old.estado, 'activo') <> 'devuelto';
  new_prestado := coalesce(new.estado, 'activo') <> 'devuelto';

  if old.libro_id is distinct from new.libro_id then
    if old_prestado then
      update public.libros
      set cantidad_disponible = least(cantidad_disponible + 1, cantidad_total),
          estado = 'disponible'
      where id = old.libro_id;
    end if;

    if new_prestado then
      update public.libros
      set cantidad_disponible = cantidad_disponible - 1,
          estado = case when cantidad_disponible - 1 > 0 then 'disponible' else 'prestado' end
      where id = new.libro_id
        and cantidad_disponible > 0;

      if not found then
        raise exception 'El nuevo libro ya no tiene ejemplares disponibles.'
          using errcode = '23514';
      end if;
    end if;
  elsif old_prestado and not new_prestado then
    update public.libros
    set cantidad_disponible = least(cantidad_disponible + 1, cantidad_total),
        estado = 'disponible'
    where id = new.libro_id;
  elsif not old_prestado and new_prestado then
    update public.libros
    set cantidad_disponible = cantidad_disponible - 1,
        estado = case when cantidad_disponible - 1 > 0 then 'disponible' else 'prestado' end
    where id = new.libro_id
      and cantidad_disponible > 0;

    if not found then
      raise exception 'El libro ya no tiene ejemplares disponibles.'
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trigger_actualizar_disponibilidad on public.prestamos;
create trigger trigger_actualizar_disponibilidad
after insert or delete or update of libro_id, estado on public.prestamos
for each row execute function public.actualizar_disponibilidad_libro();

drop trigger if exists trigger_ajustar_disponibilidad_por_total on public.libros;
create trigger trigger_ajustar_disponibilidad_por_total
before update of cantidad_total, cantidad_disponible on public.libros
for each row execute function public.ajustar_disponibilidad_por_total();


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
