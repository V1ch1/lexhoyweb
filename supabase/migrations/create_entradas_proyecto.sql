-- Tabla para Entradas en Proyecto (Marketing)
-- Sistema independiente de WordPress para gestionar contenido en desarrollo

CREATE TABLE IF NOT EXISTS entradas_proyecto (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Información del usuario creador
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  
  -- Contenido de la entrada
  titulo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  imagen_url TEXT,
  
  -- Estado y metadatos
  estado TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'publicada', 'despublicada')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE,
  
  -- Índices para búsqueda
  CONSTRAINT titulo_min_length CHECK (char_length(titulo) >= 3),
  CONSTRAINT descripcion_min_length CHECK (char_length(descripcion) >= 10)
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_entradas_proyecto_user ON entradas_proyecto(user_id);
CREATE INDEX idx_entradas_proyecto_estado ON entradas_proyecto(estado);
CREATE INDEX idx_entradas_proyecto_created ON entradas_proyecto(created_at DESC);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_entradas_proyecto_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  
  -- Si cambia a publicada, actualizar published_at
  IF NEW.estado = 'publicada' AND OLD.estado != 'publicada' THEN
    NEW.published_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_entradas_proyecto_updated_at
  BEFORE UPDATE ON entradas_proyecto
  FOR EACH ROW
  EXECUTE FUNCTION update_entradas_proyecto_updated_at();

-- Row Level Security (RLS)
ALTER TABLE entradas_proyecto ENABLE ROW LEVEL SECURITY;

-- Policy: Todos pueden ver entradas publicadas
CREATE POLICY "Entradas publicadas son visibles para todos"
  ON entradas_proyecto
  FOR SELECT
  USING (estado = 'publicada');

-- Policy: Super admins pueden ver todas las entradas
CREATE POLICY "Super admins pueden ver todas las entradas"
  ON entradas_proyecto
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.rol = 'super_admin'
    )
  );

-- Policy: Solo super admins pueden crear entradas
CREATE POLICY "Solo super admins pueden crear entradas"
  ON entradas_proyecto
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.rol = 'super_admin'
    )
  );

-- Policy: Solo super admins pueden actualizar entradas
CREATE POLICY "Solo super admins pueden actualizar entradas"
  ON entradas_proyecto
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.rol = 'super_admin'
    )
  );

-- Policy: Solo super admins pueden eliminar entradas
CREATE POLICY "Solo super admins pueden eliminar entradas"
  ON entradas_proyecto
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.rol = 'super_admin'
    )
  );

-- Comentarios para documentación
COMMENT ON TABLE entradas_proyecto IS 'Entradas de marketing en desarrollo, gestionadas por super admins';
COMMENT ON COLUMN entradas_proyecto.estado IS 'Estado de la entrada: borrador, publicada, despublicada';
COMMENT ON COLUMN entradas_proyecto.published_at IS 'Fecha de primera publicación';
