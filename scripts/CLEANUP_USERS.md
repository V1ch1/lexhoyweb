# 🗑️ Limpieza Manual de Usuarios en Supabase

## Opción 1: Ver Todos los Usuarios

Ejecuta este query en Supabase SQL Editor:

```sql
SELECT 
  id,
  email,
  nombre,
  apellidos,
  rol,
  activo,
  fecha_registro,
  ultimo_acceso
FROM users
ORDER BY fecha_registro DESC;
```

## Opción 2: Eliminar Usuario Específico

```sql
-- Reemplaza 'email@example.com' con el email del usuario a eliminar
DELETE FROM users WHERE email = 'jose@blancoyenbatea.com';
```

## Opción 3: Eliminar Todos los Usuarios Inactivos

```sql
DELETE FROM users WHERE activo = false;
```

## Opción 4: Eliminar TODOS los Usuarios (⚠️ CUIDADO)

```sql
-- Primero eliminar relaciones
DELETE FROM user_despachos;
DELETE FROM solicitudes_asignacion_despacho;

-- Luego eliminar usuarios
DELETE FROM users;
```

## Verificar Usuarios en Clerk

1. Ve a: https://dashboard.clerk.com/
2. Selecciona tu aplicación
3. Ve a "Users"
4. Anota los emails que SÍ existen en Clerk

## Usuarios que Deberías Mantener

Según Clerk Dashboard, mantén solo estos usuarios en Supabase:
- Los que aparecen en Clerk Dashboard
- Los que tienen `activo = true`

## Eliminar Usuarios Específicos

Si sabes qué usuarios eliminar, usa:

```sql
-- Usuario 1
DELETE FROM users WHERE email = 'usuario1@example.com';

-- Usuario 2  
DELETE FROM users WHERE email = 'usuario2@example.com';

-- Etc...
```

## Después de Limpiar

1. Crea un usuario de prueba en Clerk:
   - Email: `test@lexhoy.local`
   - Password: `TestPassword123!`

2. Verifica que aparece en Supabase (webhook automático)

3. Prueba login en `/sign-in`
