-- ARCHIVADO: fix-rls-policies.sql
-- Script usado temporalmente para debugging de RLS. Se archiva por seguridad.

-- PASO 1: Ver el error específico en Supabase
-- Ejecuta esto primero para ver qué policies existen
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users';

-- PASO 2: Eliminar TODAS las policies existentes
DROP POLICY IF EXISTS "Acceso publico anon" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Permitir inserción desde webhook" ON users;
DROP POLICY IF EXISTS "Super admins full access" ON users;
DROP POLICY IF EXISTS "Allow public read access" ON users;
DROP POLICY IF EXISTS "Allow insert for authenticated" ON users;
DROP POLICY IF EXISTS "Allow users to update own profile" ON users;
DROP POLICY IF EXISTS "Super admin full access" ON users;

-- PASO 3: DESHABILITAR RLS TEMPORALMENTE (para debugging)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- PASO 4: Verificar que las policies se crearon
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'users';

-- PASO 5: Actualizar tu usuario con rol super_admin
UPDATE users 
SET 
  rol = 'super_admin',
  plan = 'premium',
  activo = true,
  nombre = 'José',
  apellidos = 'Ramón Blanco Casal'
WHERE id = 'user_35jzVvjg3gISeYZqejZVQDRv2cS';

-- PASO 6: Verificar el usuario
SELECT id, email, nombre, apellidos, rol, plan, activo 
FROM users 
WHERE id = 'user_35jzVvjg3gISeYZqejZVQDRv2cS';
