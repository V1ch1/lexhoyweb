-- =====================================================
-- AÑADIR CAMPOS DE TRAZABILIDAD DE APROBACIÓN
-- =====================================================
-- Esta migración añade campos para rastrear quién y cuándo
-- aprobó el precio de un lead antes de ponerlo en subasta

-- Añadir campos a la tabla leads
ALTER TABLE leads 
  ADD COLUMN IF NOT EXISTS aprobado_por TEXT REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS fecha_aprobacion TIMESTAMP WITH TIME ZONE;

-- Crear índice para búsquedas por aprobador
CREATE INDEX IF NOT EXISTS idx_leads_aprobado_por ON leads(aprobado_por);

-- Comentarios para documentación
COMMENT ON COLUMN leads.precio_estimado IS 'Precio sugerido automáticamente por IA';
COMMENT ON COLUMN leads.precio_base IS 'Precio final aprobado por administrador para iniciar subasta';
COMMENT ON COLUMN leads.aprobado_por IS 'ID del administrador que aprobó el precio_base';
COMMENT ON COLUMN leads.fecha_aprobacion IS 'Fecha y hora en que se aprobó el precio_base';

-- =====================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================
