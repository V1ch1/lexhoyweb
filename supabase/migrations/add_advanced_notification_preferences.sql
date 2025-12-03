-- Extender tabla de preferencias con filtros avanzados
ALTER TABLE user_notification_preferences
ADD COLUMN IF NOT EXISTS especialidades_interes TEXT[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS precio_min INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS precio_max INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS solo_alta_urgencia BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS resumen_diario BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS hora_resumen TIME DEFAULT '09:00:00';

-- Comentarios para documentación
COMMENT ON COLUMN user_notification_preferences.especialidades_interes IS 'Array de especialidades de interés del usuario. NULL = todas';
COMMENT ON COLUMN user_notification_preferences.precio_min IS 'Precio mínimo de leads de interés';
COMMENT ON COLUMN user_notification_preferences.precio_max IS 'Precio máximo de leads de interés';
COMMENT ON COLUMN user_notification_preferences.solo_alta_urgencia IS 'Solo notificar leads de alta urgencia';
COMMENT ON COLUMN user_notification_preferences.resumen_diario IS 'Recibir resumen diario en lugar de notificaciones individuales';
COMMENT ON COLUMN user_notification_preferences.hora_resumen IS 'Hora para enviar el resumen diario';
