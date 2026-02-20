# Supabase

## Cómo aplicar las migraciones

1. Entra en tu proyecto: [Supabase Dashboard](https://supabase.com/dashboard) → tu proyecto.
2. Ve a **SQL Editor** y crea una nueva query.
3. Ejecuta en este orden:
   - `migrations/20260216000000_create_user_profiles.sql` — tabla de perfil de usuario.
   - `migrations/20260216000001_create_provincia_municipio.sql` — tablas `provincia` y `municipio` para los selectores del perfil.
   - `migrations/20260216000002_create_sitios_relevantes.sql` — RLS para lectura de `sitios_relevantes`.
   - `migrations/20260216200000_add_sitios_admin_columns.sql` — añade `creado_por`, `creado_at`, `estado_suscripcion`.
   - `migrations/20260216200001_admin_profiles_and_rls.sql` — tabla `admin_profiles` y trigger para nuevos usuarios.
   - `migrations/20260216200002_sitios_rls_auth.sql` — políticas RLS con Supabase Auth.
   - `migrations/20260216200003_user_update_own_sitio.sql` — usuarios pueden editar sus propios sitios.
   - `migrations/20260217000000_provincia_municipio_auth_read.sql` — authenticated puede leer provincia/municipio.
   - `migrations/20260217000001_user_profiles_authenticated.sql` — authenticated puede guardar perfil (provincia/municipio para filtrar sitios).
   - `migrations/20260218000000_sitios_fecha_estado_terminos.sql` — fecha_cambio_estado, fecha_aceptado, acepto_terminos, expirar_suscripciones.

Después puedes insertar provincias y municipios en `provincia` y `municipio`.

## Crear el primer administrador

Después de que un usuario se haya registrado en la app (Supabase Auth), asígnalo como admin ejecutando en el SQL Editor:

```sql

```

O actualiza uno existente:

```sql
update public.admin_profiles set role = 'admin' where email = 'admin@ejemplo.com';
```

La app filtra los municipios por la provincia elegida, muestra solo sitios con `estado_suscripcion = 'aceptado'` en la página principal, y la página Administración usa Supabase Auth con roles admin/user.

Para que la lista de sitios se actualice en tiempo real al agregar o editar registros (sin recargar la app), activa **Realtime** para la tabla `sitios_relevantes`: en el [Dashboard de Supabase](https://supabase.com/dashboard) → **Database** → **Replication** → activa la tabla `public.sitios_relevantes`.

## Términos y condiciones

Para registrar un sitio, el usuario debe aceptar los términos. Sube el PDF a Supabase Storage (p. ej. `descargas/TerminosCondiciones.pdf`) o configura `EXPO_PUBLIC_TERMINOS_URL` en `.env`.
