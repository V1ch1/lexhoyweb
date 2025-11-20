-- ARCHIVADO: fix-user-role.sql
-- Patch temporal para actualizar el rol del usuario jose@blancoyenbatea.com
UPDATE users 
SET 
  rol = 'super_admin',
  plan = 'premium',
  activo = true,
  nombre = 'José',
  apellidos = 'Ramón Blanco Casal'
WHERE email = 'jose@blancoyenbatea.com';

-- Verificar actualización
SELECT id, email, nombre, apellidos, rol, plan, activo 
FROM users 
WHERE email = 'jose@blancoyenbatea.com';
