-- ============================================
-- FIX: Políticas RLS para user_despachos
-- ============================================

-- 1. Ver políticas actuales
SELECT * FROM pg_policies WHERE tablename = 'user_despachos';

-- 2. Eliminar políticas existentes si hay conflicto
DROP POLICY IF EXISTS "Users can view own despachos" ON user_despachos;
DROP POLICY IF EXISTS "Usuarios pueden ver sus despachos" ON user_despachos;

-- 3. Crear política para que usuarios puedan ver sus propias asignaciones
CREATE POLICY "Usuarios pueden ver sus despachos"
ON user_despachos
FOR SELECT
TO authenticated
USING (user_id::uuid = auth.uid());

-- 4. Verificar que se creó
SELECT * FROM pg_policies WHERE tablename = 'user_despachos';
