-- Actualizar usuario jose@blancoyenbatea.com con rol super_admin
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
