-- Migración: Agregar columna password_hash a la tabla users
-- Fecha: 2025-11-26
-- Descripción: Necesario para almacenar contraseñas hasheadas con NextAuth

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Comentario para documentación
COMMENT ON COLUMN users.password_hash IS 'Hash de la contraseña del usuario (bcrypt)';

-- Recargar el caché del esquema (opcional, pero recomendado)
NOTIFY pgrst, 'reload schema';
