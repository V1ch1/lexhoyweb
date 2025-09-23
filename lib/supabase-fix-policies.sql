-- FIX: Políticas RLS para permitir que super_admin actualice usuarios
-- Este script resuelve el problema de permisos para cambio de roles

-- 1. Eliminar políticas conflictivas
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users access control" ON public.users;

-- 2. Crear nueva política unificada para SELECT 
CREATE POLICY "Users access control" ON public.users FOR SELECT USING (
  -- Super admin ve todo
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND rol = 'super_admin') OR
  -- Usuario normal ve solo su perfil
  auth.uid() = id
);

-- 3. Crear nueva política para UPDATE
CREATE POLICY "Users update control" ON public.users FOR UPDATE USING (
  -- Super admin puede actualizar todo
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND rol = 'super_admin') OR
  -- Usuario normal solo puede actualizar su perfil
  auth.uid() = id
);

-- 4. Crear política para INSERT (solo super_admin)
DROP POLICY IF EXISTS "Users insert control" ON public.users;
CREATE POLICY "Users insert control" ON public.users FOR INSERT WITH CHECK (
  -- Solo super admin puede crear usuarios
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND rol = 'super_admin')
);

-- 5. Verificar que el usuario actual tiene permisos de super_admin
-- (Este comentario es solo informativo, la consulta real se ejecuta en la app)
-- SELECT rol FROM public.users WHERE id = auth.uid();

-- 6. Confirmar que las políticas están activas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users' 
ORDER BY policyname;