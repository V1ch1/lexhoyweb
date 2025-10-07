-- Script para actualizar el rol de un usuario en Supabase Auth
-- Ejecutar en Supabase SQL Editor

-- Ver el user_metadata actual del usuario
SELECT 
  id,
  email,
  raw_user_meta_data
FROM auth.users
WHERE email = 'jose@blancoyenbatea.com';

-- Actualizar el rol en user_metadata
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"super_admin"'
)
WHERE email = 'jose@blancoyenbatea.com';

-- Verificar que se actualizó correctamente
SELECT 
  id,
  email,
  raw_user_meta_data->>'role' as role,
  raw_user_meta_data
FROM auth.users
WHERE email = 'jose@blancoyenbatea.com';

-- NOTA: Después de ejecutar este script:
-- 1. Limpia el localStorage en el navegador: localStorage.clear()
-- 2. Cierra sesión
-- 3. Vuelve a iniciar sesión
-- 4. El rol debería ser 'super_admin'
