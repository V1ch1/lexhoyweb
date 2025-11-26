-- Migración: Crear tablas para tokens de autenticación
-- Fecha: 2025-11-26
-- Descripción: Tablas para verificación de email y recuperación de contraseña con NextAuth

-- Tabla para tokens de verificación de email
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_email_verification_token ON email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_verification_user ON email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_expires ON email_verification_tokens(expires_at);

-- Tabla para tokens de recuperación de contraseña
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_user ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_expires ON password_reset_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_password_reset_used ON password_reset_tokens(used);

-- Función para limpiar tokens expirados
-- Esta función debe ejecutarse periódicamente (ej: diariamente con cron)
CREATE OR REPLACE FUNCTION cleanup_expired_auth_tokens()
RETURNS void AS $$
BEGIN
  -- Eliminar tokens de verificación expirados (más de 24 horas)
  DELETE FROM email_verification_tokens 
  WHERE expires_at < NOW();
  
  -- Eliminar tokens de reset usados o expirados (más de 1 hora)
  DELETE FROM password_reset_tokens 
  WHERE expires_at < NOW() OR (used = TRUE AND used_at < NOW() - INTERVAL '7 days');
  
  RAISE NOTICE 'Tokens expirados eliminados correctamente';
END;
$$ LANGUAGE plpgsql;

-- Comentarios para documentación
COMMENT ON TABLE email_verification_tokens IS 'Tokens para verificación de email de nuevos usuarios';
COMMENT ON TABLE password_reset_tokens IS 'Tokens para recuperación de contraseña';
COMMENT ON FUNCTION cleanup_expired_auth_tokens() IS 'Limpia tokens expirados y usados. Ejecutar diariamente con cron.';

-- Ejecutar limpieza inicial
SELECT cleanup_expired_auth_tokens();
