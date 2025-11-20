-- =====================================================
-- MIGRACIÓN TABLA USERS: UUID → TEXT (Clerk IDs)
-- =====================================================
-- IMPORTANTE: Ejecutar este script en Supabase SQL Editor
-- Backup realizado en: scripts/backups/usuarios-pre-clerk-*.json
-- =====================================================

-- 1. CREAR TABLA DE RESPALDO
CREATE TABLE IF NOT EXISTS users_backup_pre_clerk AS 
SELECT * FROM users;

COMMENT ON TABLE users_backup_pre_clerk IS 'Backup de usuarios antes de migración a Clerk - 2025-11-20';

-- 2. ELIMINAR TODAS LAS POLÍTICAS RLS QUE DEPENDEN DE users.id
-- Primero, eliminar TODAS las políticas sin importar el nombre
DO $$ 
DECLARE 
  pol record;
BEGIN
  FOR pol IN 
    SELECT schemaname, tablename, policyname
    FROM pg_policies 
    WHERE (schemaname = 'public' 
    AND tablename IN ('users', 'solicitudes_despacho', 'user_despachos', 'notificaciones', 'despacho_ownership_requests', 'despacho_propiedad_historial', 'leads', 'entradas_proyecto'))
    OR (schemaname = 'storage' AND tablename = 'objects')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- Políticas específicas de la tabla users (por si acaso)
DROP POLICY IF EXISTS "Acceso publico anon" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Super admins can view all users" ON users;
DROP POLICY IF EXISTS "Super admins can update all users" ON users;
DROP POLICY IF EXISTS "Permitir lectura pública" ON users;
DROP POLICY IF EXISTS "Permitir actualización propia" ON users;
DROP POLICY IF EXISTS "Permitir inserción" ON users;

-- Políticas de solicitudes_despacho (todas las posibles)
DROP POLICY IF EXISTS "select_own" ON solicitudes_despacho;
DROP POLICY IF EXISTS "insert_own" ON solicitudes_despacho;
DROP POLICY IF EXISTS "update_own" ON solicitudes_despacho;
DROP POLICY IF EXISTS "delete_own" ON solicitudes_despacho;
DROP POLICY IF EXISTS "select_admin" ON solicitudes_despacho;
DROP POLICY IF EXISTS "update_admin" ON solicitudes_despacho;
DROP POLICY IF EXISTS "delete_admin" ON solicitudes_despacho;
DROP POLICY IF EXISTS "view_own" ON solicitudes_despacho;
DROP POLICY IF EXISTS "manage_own" ON solicitudes_despacho;

-- Políticas de user_despachos (todas las posibles)
DROP POLICY IF EXISTS "Users can view own despachos" ON user_despachos;
DROP POLICY IF EXISTS "Users can insert own despachos" ON user_despachos;
DROP POLICY IF EXISTS "Users can update own despachos" ON user_despachos;
DROP POLICY IF EXISTS "Users can delete own despachos" ON user_despachos;
DROP POLICY IF EXISTS "select_own" ON user_despachos;
DROP POLICY IF EXISTS "insert_own" ON user_despachos;
DROP POLICY IF EXISTS "update_own" ON user_despachos;
DROP POLICY IF EXISTS "delete_own" ON user_despachos;

-- Políticas de notificaciones (todas las posibles)
DROP POLICY IF EXISTS "Users can view own notifications" ON notificaciones;
DROP POLICY IF EXISTS "Users can update own notifications" ON notificaciones;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notificaciones;
DROP POLICY IF EXISTS "select_own" ON notificaciones;
DROP POLICY IF EXISTS "update_own" ON notificaciones;
DROP POLICY IF EXISTS "delete_own" ON notificaciones;

-- Políticas de despacho_ownership_requests (todas las posibles)
DROP POLICY IF EXISTS "Users can view own requests" ON despacho_ownership_requests;
DROP POLICY IF EXISTS "Users can create requests" ON despacho_ownership_requests;
DROP POLICY IF EXISTS "Users can update own requests" ON despacho_ownership_requests;
DROP POLICY IF EXISTS "Users can delete own requests" ON despacho_ownership_requests;
DROP POLICY IF EXISTS "select_own" ON despacho_ownership_requests;
DROP POLICY IF EXISTS "insert_own" ON despacho_ownership_requests;
DROP POLICY IF EXISTS "update_own" ON despacho_ownership_requests;
DROP POLICY IF EXISTS "delete_own" ON despacho_ownership_requests;

-- 3. DESHABILITAR RLS TEMPORALMENTE EN TODAS LAS TABLAS AFECTADAS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS solicitudes_despacho DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_despachos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notificaciones DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS despacho_ownership_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS despacho_propiedad_historial DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS entradas_proyecto DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE IF EXISTS storage.objects DISABLE ROW LEVEL SECURITY; -- No tenemos permisos, skip

-- 4. ELIMINAR TODAS LAS FOREIGN KEYS que referencian users.id (DINÁMICO)
DO $$ 
DECLARE 
  fk record;
BEGIN
  FOR fk IN 
    SELECT 
      conrelid::regclass AS table_name,
      conname AS constraint_name
    FROM pg_constraint
    WHERE confrelid = 'users'::regclass
      AND contype = 'f'
  LOOP
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', fk.table_name, fk.constraint_name);
  END LOOP;
END $$;

-- storage.objects (si existe) - Skip, no tenemos permisos
-- ALTER TABLE IF EXISTS storage.objects 
-- DROP CONSTRAINT IF EXISTS objects_owner_fkey;

-- 5. ELIMINAR USUARIOS EXISTENTES (ya tenemos backup)
TRUNCATE TABLE users CASCADE;

-- 6. MODIFICAR COLUMNA ID: UUID → TEXT
ALTER TABLE users 
ALTER COLUMN id TYPE TEXT;

-- 7. AGREGAR COLUMNA clerk_id (redundancia para seguridad)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS clerk_id TEXT UNIQUE;

-- 8. CONVERTIR TODAS LAS COLUMNAS UUID A TEXT (3 PASOS)
DO $$ 
DECLARE 
  tbl record;
  col record;
BEGIN
  -- PASO 1: Cambiar users.aprobado_por primero (self-reference)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'aprobado_por' AND data_type = 'uuid'
  ) THEN
    ALTER TABLE users ALTER COLUMN aprobado_por TYPE TEXT;
    ALTER TABLE users ADD CONSTRAINT users_aprobado_por_fkey 
      FOREIGN KEY (aprobado_por) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
  
  -- PASO 2: Cambiar TODAS las columnas UUID a TEXT en otras tablas (sin crear FKs todavía)
  FOR tbl IN 
    SELECT DISTINCT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      AND table_name != 'users'
  LOOP
    FOR col IN
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = tbl.table_name
        AND table_schema = 'public'
        AND (column_name LIKE '%user_id%' 
             OR column_name LIKE '%_por' 
             OR column_name IN ('user_id', 'asignado_por', 'aprobado_por', 'creado_por', 'actualizado_por'))
        AND data_type = 'uuid'
    LOOP
      EXECUTE format('ALTER TABLE %I ALTER COLUMN %I TYPE TEXT', tbl.table_name, col.column_name);
    END LOOP;
  END LOOP;
  
  -- PASO 3: Ahora recrear FKs (users.id ya es TEXT, todas las columnas ya son TEXT)
  FOR tbl IN 
    SELECT DISTINCT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      AND table_name != 'users'
  LOOP
    FOR col IN
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = tbl.table_name
        AND table_schema = 'public'
        AND (column_name LIKE '%user_id%' 
             OR column_name LIKE '%_por' 
             OR column_name IN ('user_id', 'asignado_por', 'aprobado_por', 'creado_por', 'actualizado_por'))
        AND data_type = 'text'
    LOOP
      BEGIN
        EXECUTE format(
          'ALTER TABLE %I ADD CONSTRAINT %s FOREIGN KEY (%I) REFERENCES users(id) ON DELETE CASCADE',
          tbl.table_name,
          format('%s_%s_fkey', tbl.table_name, col.column_name),
          col.column_name
        );
      EXCEPTION WHEN duplicate_object THEN
        NULL; -- FK ya existe
      WHEN others THEN
        NULL; -- Columna no referencia users
      END;
    END LOOP;
  END LOOP;
END $$;

-- storage.objects: owner UUID → TEXT (si existe) - Skip, no tenemos permisos sobre tabla storage
-- DO $$
-- BEGIN
--   IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
--     ALTER TABLE storage.objects 
--     ALTER COLUMN owner TYPE TEXT;
--   END IF;
-- END $$;

-- 9. CREAR ÍNDICES PARA RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 10. RE-HABILITAR RLS Y RECREAR POLÍTICAS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Recrear políticas básicas de users compatibles con Clerk
CREATE POLICY "Acceso publico anon" ON users
  FOR SELECT
  USING (true);

CREATE POLICY "Users can view own profile" ON users
  FOR SELECT
  USING (auth.uid()::text = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE
  USING (auth.uid()::text = id);

CREATE POLICY "Permitir inserción desde webhook" ON users
  FOR INSERT
  WITH CHECK (true);

-- Política para super admins (usando rol almacenado en la tabla)
CREATE POLICY "Super admins full access" ON users
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::text
      AND rol = 'super_admin'
    )
  );

-- 11. RE-HABILITAR RLS EN TABLAS RELACIONADAS Y RECREAR POLÍTICAS

-- solicitudes_despacho
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'solicitudes_despacho') THEN
    ALTER TABLE solicitudes_despacho ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "select_own" ON solicitudes_despacho
      FOR SELECT
      USING (auth.uid()::text = user_id);
    
    CREATE POLICY "insert_own" ON solicitudes_despacho
      FOR INSERT
      WITH CHECK (auth.uid()::text = user_id);
    
    CREATE POLICY "update_own" ON solicitudes_despacho
      FOR UPDATE
      USING (auth.uid()::text = user_id);
    
    CREATE POLICY "delete_own" ON solicitudes_despacho
      FOR DELETE
      USING (auth.uid()::text = user_id);
  END IF;
END $$;

-- user_despachos
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_despachos') THEN
    ALTER TABLE user_despachos ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view own despachos" ON user_despachos
      FOR SELECT
      USING (auth.uid()::text = user_id);
    
    CREATE POLICY "Users can insert own despachos" ON user_despachos
      FOR INSERT
      WITH CHECK (auth.uid()::text = user_id);
    
    CREATE POLICY "Users can update own despachos" ON user_despachos
      FOR UPDATE
      USING (auth.uid()::text = user_id);
  END IF;
END $$;

-- notificaciones
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notificaciones') THEN
    ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view own notifications" ON notificaciones
      FOR SELECT
      USING (auth.uid()::text = user_id);
    
    CREATE POLICY "Users can update own notifications" ON notificaciones
      FOR UPDATE
      USING (auth.uid()::text = user_id);
  END IF;
END $$;

-- despacho_ownership_requests
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'despacho_ownership_requests') THEN
    ALTER TABLE despacho_ownership_requests ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view own requests" ON despacho_ownership_requests
      FOR SELECT
      USING (auth.uid()::text = user_id);
    
    CREATE POLICY "Users can create requests" ON despacho_ownership_requests
      FOR INSERT
      WITH CHECK (auth.uid()::text = user_id);
  END IF;
END $$;

-- despacho_propiedad_historial
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'despacho_propiedad_historial') THEN
    ALTER TABLE despacho_propiedad_historial ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view own history" ON despacho_propiedad_historial
      FOR SELECT
      USING (auth.uid()::text = user_id);
    
    CREATE POLICY "Super admins pueden ver historial" ON despacho_propiedad_historial
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE id = auth.uid()::text
          AND rol = 'super_admin'
        )
      );
  END IF;
END $$;

-- leads
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leads') THEN
    ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Leads access control" ON leads
      FOR ALL
      USING (
        auth.uid()::text = user_id
        OR EXISTS (
          SELECT 1 FROM users
          WHERE id = auth.uid()::text
          AND rol = 'super_admin'
        )
      );
  END IF;
END $$;

-- entradas_proyecto
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'entradas_proyecto') THEN
    ALTER TABLE entradas_proyecto ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Solo super admins pueden crear entradas" ON entradas_proyecto
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM users
          WHERE id = auth.uid()::text
          AND rol = 'super_admin'
        )
      );
    
    CREATE POLICY "Todos pueden leer entradas" ON entradas_proyecto
      FOR SELECT
      USING (true);
  END IF;
END $$;

-- storage.objects - Skip, no tenemos permisos sobre storage schema
-- DO $$
-- BEGIN
--   IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
--     ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
--     
--     CREATE POLICY "Super admins can upload images" ON storage.objects
--       FOR INSERT
--       WITH CHECK (
--         EXISTS (
--           SELECT 1 FROM public.users
--           WHERE id = auth.uid()::text
--           AND rol = 'super_admin'
--         )
--       );
--     
--     CREATE POLICY "Public can view images" ON storage.objects
--       FOR SELECT
--       USING (bucket_id = 'public');
--     
--     CREATE POLICY "Super admins can delete images" ON storage.objects
--       FOR DELETE
--       USING (
--         EXISTS (
--           SELECT 1 FROM public.users
--           WHERE id = auth.uid()::text
--           AND rol = 'super_admin'
--         )
--       );
--   END IF;
-- END $$;

-- =====================================================
-- VERIFICACIÓN POST-MIGRACIÓN
-- =====================================================

-- Verificar estructura de la tabla
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Verificar foreign keys
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND (tc.table_name = 'user_despachos' 
    OR tc.table_name = 'notificaciones'
    OR tc.table_name = 'despacho_ownership_requests')
  AND kcu.column_name = 'user_id';

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================
-- 1. Los usuarios existentes deberán RE-REGISTRARSE con Clerk
-- 2. El sistema de owner_email en despachos NO se ve afectado
-- 3. Las asignaciones en user_despachos se perderán (normal, usuarios nuevos)
-- 4. Los webhooks de Clerk crearán automáticamente usuarios con formato: user_xxxxx
-- 5. Si algo sale mal, restaurar desde users_backup_pre_clerk

-- Para restaurar en caso de emergencia:
-- TRUNCATE TABLE users CASCADE;
-- INSERT INTO users SELECT * FROM users_backup_pre_clerk;
-- ALTER TABLE users ALTER COLUMN id TYPE UUID USING id::uuid;
