-- Migración: Corregir ID de usuario para autogeneración
-- Fecha: 2025-11-26
-- Descripción: Establecer valor por defecto para la columna ID de users

-- Asegurar que la extensión para UUIDs existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Alterar la columna ID para que se genere automáticamente
ALTER TABLE users 
ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Recargar el caché del esquema
NOTIFY pgrst, 'reload schema';
