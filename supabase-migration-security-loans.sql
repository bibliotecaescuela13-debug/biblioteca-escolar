-- Apply this file once in the Supabase SQL Editor after the existing schemas.
-- It protects administrative data and makes book availability consistent with loans.

begin;

create or replace function public.is_library_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((auth.jwt() ->> 'email') = 'bibliotecamarianomoreno9@gmail.com', false);
$$;

revoke all on function public.is_library_admin() from public;
grant execute on function public.is_library_admin() to authenticated;

drop policy if exists "Enable all access for usuarios" on public.usuarios;
drop policy if exists "Enable all access for servicios_impresion" on public.servicios_impresion;
drop policy if exists "Enable all access for servicios_video" on public.servicios_video;
drop policy if exists "Enable all access for actividades_lectura" on public.actividades_lectura;
drop policy if exists "Enable all access for asistencia_lectura" on public.asistencia_lectura;
drop policy if exists "Enable all access for libros" on public.libros;
drop policy if exists "Enable all access for prestamos" on public.prestamos;
drop policy if exists "Public read access for libros" on public.libros;
drop policy if exists "Library admin full access for libros" on public.libros;
drop policy if exists "Library admin full access for usuarios" on public.usuarios;
drop policy if exists "Library admin full access for prestamos" on public.prestamos;
drop policy if exists "Library admin full access for servicios_impresion" on public.servicios_impresion;
drop policy if exists "Library admin full access for servicios_video" on public.servicios_video;
drop policy if exists "Library admin full access for actividades_lectura" on public.actividades_lectura;
drop policy if exists "Library admin full access for asistencia_lectura" on public.asistencia_lectura;

create policy "Public read access for libros"
on public.libros for select
to anon, authenticated
using (true);

create policy "Library admin full access for libros"
on public.libros for all
to authenticated
using (public.is_library_admin())
with check (public.is_library_admin());

create policy "Library admin full access for usuarios"
on public.usuarios for all
to authenticated
using (public.is_library_admin())
with check (public.is_library_admin());

create policy "Library admin full access for prestamos"
on public.prestamos for all
to authenticated
using (public.is_library_admin())
with check (public.is_library_admin());

create policy "Library admin full access for servicios_impresion"
on public.servicios_impresion for all
to authenticated
using (public.is_library_admin())
with check (public.is_library_admin());

create policy "Library admin full access for servicios_video"
on public.servicios_video for all
to authenticated
using (public.is_library_admin())
with check (public.is_library_admin());

create policy "Library admin full access for actividades_lectura"
on public.actividades_lectura for all
to authenticated
using (public.is_library_admin())
with check (public.is_library_admin());

create policy "Library admin full access for asistencia_lectura"
on public.asistencia_lectura for all
to authenticated
using (public.is_library_admin())
with check (public.is_library_admin());

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

commit;
