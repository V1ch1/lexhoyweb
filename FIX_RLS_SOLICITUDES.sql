-- ============================================
-- FIX: Políticas RLS para solicitudes_despacho
-- ============================================

-- 1. Ver políticas actuales
SELECT * FROM pg_policies WHERE tablename = 'solicitudes_despacho';

-- 2. Eliminar políticas si existen
DROP POLICY IF EXISTS "Usuarios pueden ver sus solicitudes" ON solicitudes_despacho;
DROP POLICY IF EXISTS "Super admin ve todas las solicitudes" ON solicitudes_despacho;

-- 3. Crear política para que usuarios vean sus propias solicitudes
CREATE POLICY "Usuarios pueden ver sus solicitudes"
ON solicitudes_despacho
FOR SELECT
TO authenticated
USING (user_id::uuid = auth.uid());

-- 4. Crear política para super_admin vea todas
CREATE POLICY "Super admin ve todas las solicitudes"
ON solicitudes_despacho
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.rol = 'super_admin'
  )
);

-- 4. Verificar
SELECT * FROM pg_policies WHERE tablename = 'solicitudes_despacho';
