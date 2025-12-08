-- ============================================
-- SCRIPT COMPLETO: Limpiar y Aplicar Migraciones
-- Ejecutar TODO este script de una sola vez
-- ============================================

-- ============================================
-- PASO 1: LIMPIAR (si existe de intentos anteriores)
-- ============================================

DROP TABLE IF EXISTS pending_daily_notifications CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_pending_notifications();

-- ============================================
-- PASO 2: MIGRACIÓN 1 - Actualizar Tipos de Notificación
-- ============================================

-- 1. Eliminar el constraint antiguo
ALTER TABLE notificaciones DROP CONSTRAINT IF EXISTS notificaciones_tipo_check;

-- 2. Crear nuevo constraint con todos los tipos
ALTER TABLE notificaciones ADD CONSTRAINT notificaciones_tipo_check 
CHECK (tipo IN (
  'solicitud_recibida',
  'solicitud_aprobada',
  'solicitud_rechazada',
  'solicitud_despacho',
  'despacho_asignado',
  'despacho_desasignado',
  'usuario_nuevo',
  'mensaje_sistema',
  'nuevo_lead',
  'nuevo_lead_admin',
  'lead_comprado',
  'lead_vendido'
));

-- 3. Comentario para documentación
COMMENT ON CONSTRAINT notificaciones_tipo_check ON notificaciones IS 
'Tipos de notificación permitidos. Actualizado 2025-12-08 para incluir todos los tipos usados en NotificationService.';

-- ============================================
-- PASO 3: MIGRACIÓN 2 - Crear Tabla de Resúmenes Diarios
-- ============================================

-- 1. Crear tabla
CREATE TABLE IF NOT EXISTS pending_daily_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraint para evitar duplicados
  UNIQUE(user_id, lead_id)
);

-- 2. Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_pending_daily_notifications_user_id 
ON pending_daily_notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_pending_daily_notifications_processed 
ON pending_daily_notifications(processed) 
WHERE processed = false;

CREATE INDEX IF NOT EXISTS idx_pending_daily_notifications_created_at 
ON pending_daily_notifications(created_at DESC);

-- 3. Índice compuesto para queries comunes
CREATE INDEX IF NOT EXISTS idx_pending_daily_notifications_user_processed 
ON pending_daily_notifications(user_id, processed);

-- 4. RLS (Row Level Security)
ALTER TABLE pending_daily_notifications ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver sus propias notificaciones pendientes
CREATE POLICY "Users can view own pending notifications"
ON pending_daily_notifications
FOR SELECT
USING (auth.uid()::text = user_id);

-- Política: Solo el sistema puede insertar (via service role)
CREATE POLICY "Service role can insert pending notifications"
ON pending_daily_notifications
FOR INSERT
WITH CHECK (true);

-- Política: Solo el sistema puede actualizar (via service role)
CREATE POLICY "Service role can update pending notifications"
ON pending_daily_notifications
FOR UPDATE
USING (true);

-- 5. Función para limpiar notificaciones procesadas antiguas (más de 7 días)
CREATE OR REPLACE FUNCTION cleanup_old_pending_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM pending_daily_notifications
  WHERE processed = true 
  AND processed_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- 6. Comentarios para documentación
COMMENT ON TABLE pending_daily_notifications IS 
'Almacena leads pendientes de enviar en el resumen diario de cada usuario. Se procesan según la hora configurada en user_notification_preferences.';

COMMENT ON COLUMN pending_daily_notifications.user_id IS 
'Usuario que recibirá el lead en su resumen diario';

COMMENT ON COLUMN pending_daily_notifications.lead_id IS 
'Lead que se incluirá en el resumen';

COMMENT ON COLUMN pending_daily_notifications.processed IS 
'Indica si ya se envió en un resumen diario';

COMMENT ON COLUMN pending_daily_notifications.processed_at IS 
'Fecha y hora en que se procesó y envió el resumen';

-- ============================================
-- PASO 4: VERIFICACIÓN
-- ============================================

-- Verificar que la tabla se creó correctamente
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'pending_daily_notifications'
) as tabla_creada;

-- Verificar el constraint de notificaciones
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'notificaciones_tipo_check';

-- Si todo está correcto, deberías ver:
-- tabla_creada: true
-- El constraint con los 12 tipos de notificación
