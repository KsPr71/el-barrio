# Supabase

## Cómo aplicar las migraciones

1. Entra en tu proyecto: [Supabase Dashboard](https://supabase.com/dashboard) → tu proyecto.
2. Ve a **SQL Editor** y crea una nueva query.
3. Ejecuta en este orden:
   - `migrations/20260216000000_create_user_profiles.sql` — tabla de perfil de usuario.
   - `migrations/20260216000001_create_provincia_municipio.sql` — tablas `provincia` y `municipio` para los selectores del perfil.
   - `migrations/20260216000002_create_sitios_relevantes.sql` — RLS para lectura de `sitios_relevantes` (la tabla ya existe con id, nombre, localizacion, descripcion, imagenes, ofertas, menus, etc.).

Después puedes insertar provincias y municipios en `provincia` y `municipio`. La app filtra los municipios por la provincia elegida y muestra los registros de `sitios_relevantes` en cards en Inicio.
