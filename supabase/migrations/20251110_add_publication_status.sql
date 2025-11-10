-- Agregar campo para gestionar el estado de publicación
-- Fecha: 10 de noviembre de 2025

-- Agregar columna para el estado de publicación
ALTER TABLE despachos 
ADD COLUMN IF NOT EXISTS estado_publicacion VARCHAR(20) DEFAULT 'publish';

-- Comentario
COMMENT ON COLUMN despachos.estado_publicacion IS 'Estado de publicación en WordPress: publish, draft, trash';

-- Actualizar despachos existentes basándose en el campo activo
UPDATE despachos 
SET estado_publicacion = CASE 
  WHEN activo = true THEN 'publish'
  WHEN activo = false THEN 'draft'
  ELSE 'draft'
END
WHERE estado_publicacion IS NULL;
