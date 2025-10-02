-- Tabla de notificaciones
CREATE TABLE IF NOT EXISTS notificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN (
    'solicitud_recibida',
    'solicitud_aprobada',
    'solicitud_rechazada',
    'despacho_asignado',
    'despacho_desasignado',
    'usuario_nuevo',
    'mensaje_sistema'
  )),
  titulo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  leida BOOLEAN DEFAULT false,
  url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_notificaciones_user_id ON notificaciones(user_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_leida ON notificaciones(leida);
CREATE INDEX IF NOT EXISTS idx_notificaciones_created_at ON notificaciones(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notificaciones_user_leida ON notificaciones(user_id, leida);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_notificaciones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_notificaciones_updated_at ON notificaciones;
CREATE TRIGGER trigger_update_notificaciones_updated_at
  BEFORE UPDATE ON notificaciones
  FOR EACH ROW
  EXECUTE FUNCTION update_notificaciones_updated_at();

-- Política RLS (Row Level Security)
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver sus propias notificaciones
CREATE POLICY "Users can view own notifications"
  ON notificaciones FOR SELECT
  USING (auth.uid()::text = user_id);

-- Política: Los usuarios pueden actualizar sus propias notificaciones
CREATE POLICY "Users can update own notifications"
  ON notificaciones FOR UPDATE
  USING (auth.uid()::text = user_id);

-- Política: Solo el sistema puede insertar notificaciones (via service role)
CREATE POLICY "Service role can insert notifications"
  ON notificaciones FOR INSERT
  WITH CHECK (true);

-- Política: Los usuarios pueden eliminar sus propias notificaciones
CREATE POLICY "Users can delete own notifications"
  ON notificaciones FOR DELETE
  USING (auth.uid()::text = user_id);
