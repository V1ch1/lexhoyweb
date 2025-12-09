-- Crear tabla para vídeos de Instagram (SIN RLS por ahora para evitar problemas)
CREATE TABLE IF NOT EXISTS instagram_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  instagram_url TEXT,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_featured BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_instagram_videos_category ON instagram_videos(category);
CREATE INDEX IF NOT EXISTS idx_instagram_videos_featured ON instagram_videos(is_featured);
CREATE INDEX IF NOT EXISTS idx_instagram_videos_display_order ON instagram_videos(display_order);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_instagram_videos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_instagram_videos_updated_at_trigger ON instagram_videos;
CREATE TRIGGER update_instagram_videos_updated_at_trigger
  BEFORE UPDATE ON instagram_videos
  FOR EACH ROW
  EXECUTE FUNCTION update_instagram_videos_updated_at();

-- NOTA: RLS deshabilitado temporalmente para evitar problemas de tipos
-- La seguridad se manejará a nivel de API
