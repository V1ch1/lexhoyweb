-- Cambiar la columna verificado de boolean a varchar para soportar 3 estados
-- Estados: 'pendiente', 'verificado', 'rechazado'

-- Primero, eliminar el índice existente
DROP INDEX IF EXISTS idx_despachos_verificado;

-- Eliminar la columna verificado si existe
ALTER TABLE despachos DROP COLUMN IF EXISTS verificado;

-- Agregar nueva columna estado_verificacion
ALTER TABLE despachos 
ADD COLUMN IF NOT EXISTS estado_verificacion VARCHAR(20) DEFAULT 'pendiente';

-- Agregar comentario a la columna
COMMENT ON COLUMN despachos.estado_verificacion IS 'Estado de verificación del despacho: pendiente, verificado, rechazado';

-- Crear índice para búsquedas rápidas por estado de verificación
CREATE INDEX IF NOT EXISTS idx_despachos_estado_verificacion ON despachos(estado_verificacion);

-- Agregar constraint para validar valores
ALTER TABLE despachos 
ADD CONSTRAINT check_estado_verificacion 
CHECK (estado_verificacion IN ('pendiente', 'verificado', 'rechazado'));
