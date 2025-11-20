-- =====================================================
-- MIGRACIÓN SIMPLIFICADA: UUID → TEXT (Clerk IDs)
-- =====================================================
-- Backup: scripts/backups/usuarios-pre-clerk-*.json
-- =====================================================

-- 1. BACKUP
CREATE TABLE IF NOT EXISTS users_backup_pre_clerk AS SELECT * FROM users;

-- 2. DROP TODAS LAS POLICIES DINÁMICAMENTE (SOLO PUBLIC SCHEMA)
DO $$ 
DECLARE pol record;
BEGIN
  FOR pol IN SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- 3. DISABLE RLS EN TODO (SOLO PUBLIC SCHEMA)
DO $$
DECLARE tbl record;
BEGIN
-- 7. CAMBIAR users.id: UUID → TEXT
ALTER TABLE users ALTER COLUMN id TYPE TEXT;

-- 8. CAMBIAR users.aprobado_por: UUID → TEXT (si existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'aprobado_por') THEN
    ALTER TABLE users ALTER COLUMN aprobado_por TYPE TEXT;
  END IF;
END $$;

-- 9. AGREGAR clerk_id
ALTER TABLE users ADD COLUMN IF NOT EXISTS clerk_id TEXT UNIQUE;

-- 9.5 ELIMINAR EXPLÍCITAMENTE FK DE participaciones_marketing (si existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'participaciones_marketing_user_id_fkey' 
    AND table_name = 'participaciones_marketing'
  ) THEN
    ALTER TABLE participaciones_marketing DROP CONSTRAINT participaciones_marketing_user_id_fkey;
  END IF;
END $$;

-- 10. CAMBIAR TODAS LAS COLUMNAS user_id UUID → TEXT (SOLO PUBLIC SCHEMA)
DO $$ 
DECLARE r record;
BEGIN
  FOR r IN 
    SELECT table_schema, table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND data_type = 'uuid'
      AND table_name != 'users'
      AND (column_name LIKE '%user_id%' OR column_name LIKE '%_por' 
           OR column_name IN ('user_id', 'asignado_por', 'creado_por', 'actualizado_por'))
  LOOP
    EXECUTE format('ALTER TABLE %I.%I ALTER COLUMN %I TYPE TEXT', r.table_schema, r.table_name, r.column_name);
  END LOOP;
END $$;

-- 11. RECREAR FKs (SOLO PUBLIC SCHEMA)
DO $$ 
DECLARE r record;
BEGIN
  FOR r IN 
    SELECT table_schema, table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND data_type = 'text'
      AND table_name != 'users'
      AND (column_name LIKE '%user_id%' OR column_name LIKE '%_por' 
           OR column_name IN ('user_id', 'asignado_por', 'creado_por', 'actualizado_por'))
  LOOP
    BEGIN
      EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT %s FOREIGN KEY (%I) REFERENCES public.users(id) ON DELETE CASCADE',
        r.table_schema, r.table_name, format('%s_%s_fkey', r.table_name, r.column_name), r.column_name);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END LOOP;
  
  -- users.aprobado_por self-reference
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'aprobado_por') THEN
    ALTER TABLE users ADD CONSTRAINT users_aprobado_por_fkey 
      FOREIGN KEY (aprobado_por) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 12. ÍNDICES
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 13. RE-ENABLE RLS Y RECREAR POLICIES
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acceso publico anon" ON users FOR SELECT USING (true);
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid()::text = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id);
CREATE POLICY "Permitir inserción desde webhook" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Super admins full access" ON users FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND rol = 'super_admin')
);

-- Policies para otras tablas
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'solicitudes_despacho') THEN
    ALTER TABLE solicitudes_despacho ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "select_own" ON solicitudes_despacho FOR SELECT USING (auth.uid()::text = user_id);
    CREATE POLICY "insert_own" ON solicitudes_despacho FOR INSERT WITH CHECK (auth.uid()::text = user_id);
    CREATE POLICY "update_own" ON solicitudes_despacho FOR UPDATE USING (auth.uid()::text = user_id);
    CREATE POLICY "delete_own" ON solicitudes_despacho FOR DELETE USING (auth.uid()::text = user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_despachos') THEN
    ALTER TABLE user_despachos ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users can view own despachos" ON user_despachos FOR SELECT USING (auth.uid()::text = user_id);
    CREATE POLICY "Users can insert own despachos" ON user_despachos FOR INSERT WITH CHECK (auth.uid()::text = user_id);
    CREATE POLICY "Users can update own despachos" ON user_despachos FOR UPDATE USING (auth.uid()::text = user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notificaciones') THEN
    ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users can view own notifications" ON notificaciones FOR SELECT USING (auth.uid()::text = user_id);
    CREATE POLICY "Users can update own notifications" ON notificaciones FOR UPDATE USING (auth.uid()::text = user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'despacho_ownership_requests') THEN
    ALTER TABLE despacho_ownership_requests ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users can view own requests" ON despacho_ownership_requests FOR SELECT USING (auth.uid()::text = user_id);
    CREATE POLICY "Users can create requests" ON despacho_ownership_requests FOR INSERT WITH CHECK (auth.uid()::text = user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'despacho_propiedad_historial') THEN
    ALTER TABLE despacho_propiedad_historial ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users can view own history" ON despacho_propiedad_historial FOR SELECT USING (auth.uid()::text = user_id);
    CREATE POLICY "Super admins pueden ver historial" ON despacho_propiedad_historial FOR SELECT USING (
      EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND rol = 'super_admin')
    );
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leads') THEN
    ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Leads access control" ON leads FOR ALL USING (
      auth.uid()::text = user_id OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND rol = 'super_admin')
    );
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'entradas_proyecto') THEN
    ALTER TABLE entradas_proyecto ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Solo super admins pueden crear entradas" ON entradas_proyecto FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND rol = 'super_admin')
    );
    CREATE POLICY "Todos pueden leer entradas" ON entradas_proyecto FOR SELECT USING (true);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'participaciones_marketing') THEN
    ALTER TABLE participaciones_marketing ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users can view own participations" ON participaciones_marketing FOR SELECT USING (auth.uid()::text = user_id);
    CREATE POLICY "Users can create participations" ON participaciones_marketing FOR INSERT WITH CHECK (auth.uid()::text = user_id);
  END IF;
END $$;

-- VERIFICACIÓN
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position;
