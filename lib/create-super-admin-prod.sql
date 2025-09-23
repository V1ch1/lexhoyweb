-- ============================================
-- CREAR SUPER ADMIN EN PRODUCCIÓN
-- ============================================

-- Ejecutar DESPUÉS de registrarse en la aplicación
-- Cambiar EMAIL por el email que uses para registrarte

UPDATE public.users 
SET rol = 'super_admin', estado = 'activo'
WHERE email = 'blancocasal@hotmail.com';

-- Verificar que funcionó
SELECT id, email, nombre, apellidos, rol, estado, created_at
FROM public.users 
WHERE email = 'blancocasal@hotmail.com';