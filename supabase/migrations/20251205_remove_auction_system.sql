-- Migración: Eliminar sistema de subastas
-- Fecha: 2025-12-05

-- 1. Eliminar tabla de pujas si existe
DROP TABLE IF EXISTS lead_pujas CASCADE;

-- 2. Eliminar campos de subasta de la tabla leads
ALTER TABLE leads 
  DROP COLUMN IF EXISTS precio_actual,
  DROP COLUMN IF EXISTS fecha_fin_subasta;

-- 3. Actualizar estados válidos (eliminar 'en_subasta')
-- Cambiar cualquier lead en 'en_subasta' a 'pendiente'
UPDATE leads 
SET estado = 'pendiente' 
WHERE estado = 'en_subasta';

-- 4. Añadir constraint para estados válidos
ALTER TABLE leads 
  DROP CONSTRAINT IF EXISTS leads_estado_check;

ALTER TABLE leads 
  ADD CONSTRAINT leads_estado_check 
  CHECK (estado IN ('pendiente', 'vendido', 'rechazado'));

-- Comentario: Sistema de subastas eliminado. Solo compra directa disponible.
