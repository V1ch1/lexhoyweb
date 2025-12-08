-- Actualizar constraint de tipos de notificación para incluir todos los tipos usados en el código
-- Migración: 20251208_update_notification_types.sql

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
