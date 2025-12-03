-- Tabla de preferencias de notificaciones por usuario
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  
  -- Preferencias de email
  email_new_lead BOOLEAN DEFAULT true,
  email_lead_purchased BOOLEAN DEFAULT true,
  email_solicitud_status BOOLEAN DEFAULT true,
  email_despacho_changes BOOLEAN DEFAULT true,
  email_marketing BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índice para búsquedas rápidas por user_id
CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_user_id 
ON user_notification_preferences(user_id);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_user_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_notification_preferences_updated_at
BEFORE UPDATE ON user_notification_preferences
FOR EACH ROW
EXECUTE FUNCTION update_user_notification_preferences_updated_at();

-- RLS Policies
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Los usuarios solo pueden ver y editar sus propias preferencias
CREATE POLICY "Users can view own preferences"
ON user_notification_preferences
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
ON user_notification_preferences
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
ON user_notification_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);
