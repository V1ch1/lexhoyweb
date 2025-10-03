-- Políticas RLS para solicitudes_despacho
-- Ejecuta esto en Supabase SQL Editor

-- 1. Habilitar RLS si no está habilitado
ALTER TABLE solicitudes_despacho ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas existentes (si las hay)
DROP POLICY IF EXISTS "Usuarios pueden crear solicitudes" ON solicitudes_despacho;
DROP POLICY IF EXISTS "Super admin puede leer solicitudes" ON solicitudes_despacho;
DROP POLICY IF EXISTS "Usuarios pueden leer sus solicitudes" ON solicitudes_despacho;
DROP POLICY IF EXISTS "Super admin puede actualizar solicitudes" ON solicitudes_despacho;

-- 3. Permitir a usuarios autenticados INSERTAR solicitudes
CREATE POLICY "Usuarios pueden crear solicitudes"
ON solicitudes_despacho
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 4. Permitir a super_admin LEER todas las solicitudes
CREATE POLICY "Super admin puede leer solicitudes"
ON solicitudes_despacho
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.rol = 'super_admin'
  )
);

-- 5. Permitir a usuarios LEER sus propias solicitudes
CREATE POLICY "Usuarios pueden leer sus solicitudes"
ON solicitudes_despacho
FOR SELECT
TO authenticated
USING (user_id::uuid = auth.uid());

-- 6. Permitir a super_admin ACTUALIZAR solicitudes (aprobar/rechazar)
CREATE POLICY "Super admin puede actualizar solicitudes"
ON solicitudes_despacho
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.rol = 'super_admin'
  )
);

-- 7. Verificar las políticas creadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'solicitudes_despacho';
