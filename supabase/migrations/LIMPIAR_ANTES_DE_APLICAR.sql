-- Script de limpieza para eliminar la tabla y políticas existentes
-- Ejecutar PRIMERO si ya intentaste aplicar las migraciones antes

-- Eliminar tabla (esto eliminará automáticamente todas las políticas y constraints)
DROP TABLE IF EXISTS pending_daily_notifications CASCADE;

-- Eliminar función si existe
DROP FUNCTION IF EXISTS cleanup_old_pending_notifications();

-- Verificar que se eliminó
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'pending_daily_notifications'
) as tabla_existe;

-- Debería mostrar: tabla_existe: false
