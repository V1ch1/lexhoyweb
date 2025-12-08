-- Script de verificación manual del sistema de notificaciones
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar tabla pending_daily_notifications
SELECT 
  'pending_daily_notifications' as tabla,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'pending_daily_notifications'
  ) as existe;

-- 2. Verificar constraint de tipos de notificación
SELECT 
  'notificaciones_tipo_check' as constraint_name,
  pg_get_constraintdef(oid) as definicion
FROM pg_constraint 
WHERE conname = 'notificaciones_tipo_check';

-- 3. Verificar índices de pending_daily_notifications
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'pending_daily_notifications'
ORDER BY indexname;

-- 4. Verificar políticas RLS
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'pending_daily_notifications';

-- 5. Contar notificaciones por tipo (para ver si hay datos)
SELECT 
  tipo,
  COUNT(*) as total
FROM notificaciones
GROUP BY tipo
ORDER BY total DESC;

-- ✅ Si ves resultados sin errores, el sistema está funcionando correctamente
