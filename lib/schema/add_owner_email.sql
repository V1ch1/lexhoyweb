-- Añadir columna owner_email a la tabla despachos
-- Esta columna permite identificar al propietario de cada despacho

-- 1. Añadir la columna
ALTER TABLE despachos
ADD COLUMN IF NOT EXISTS owner_email TEXT;

-- 2. Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_despachos_owner_email 
ON despachos(owner_email);

-- 3. Verificar que se creó correctamente
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'despachos' 
  AND column_name = 'owner_email';

-- 4. Ver estructura completa de la tabla
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'despachos'
ORDER BY ordinal_position;
