-- Script para limpiar y recrear la tabla instagram_videos
-- Ejecuta esto ANTES de aplicar la migración principal

-- Eliminar policies existentes si existen
DROP POLICY IF EXISTS "Todos pueden ver vídeos" ON instagram_videos;
DROP POLICY IF EXISTS "Solo super_admin puede crear vídeos" ON instagram_videos;
DROP POLICY IF EXISTS "Solo super_admin puede actualizar vídeos" ON instagram_videos;
DROP POLICY IF EXISTS "Solo super_admin puede eliminar vídeos" ON instagram_videos;

-- Eliminar trigger y función si existen
DROP TRIGGER IF EXISTS update_instagram_videos_updated_at_trigger ON instagram_videos;
DROP FUNCTION IF EXISTS update_instagram_videos_updated_at();

-- Eliminar índices si existen
DROP INDEX IF EXISTS idx_instagram_videos_category;
DROP INDEX IF EXISTS idx_instagram_videos_featured;
DROP INDEX IF EXISTS idx_instagram_videos_display_order;

-- Eliminar tabla si existe
DROP TABLE IF EXISTS instagram_videos CASCADE;
