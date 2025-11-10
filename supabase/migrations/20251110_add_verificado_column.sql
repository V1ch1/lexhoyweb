-- Agregar columna verificado a la tabla despachos
-- Esta columna indica si el despacho ha sido verificado por un administrador

ALTER TABLE despachos 
ADD COLUMN IF NOT EXISTS verificado BOOLEAN DEFAULT false;

-- Agregar comentario a la columna
COMMENT ON COLUMN despachos.verificado IS 'Indica si el despacho ha sido verificado por un administrador';

-- Crear índice para búsquedas rápidas por estado de verificación
CREATE INDEX IF NOT EXISTS idx_despachos_verificado ON despachos(verificado);
