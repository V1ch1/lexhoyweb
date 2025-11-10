-- Agregar columnas para sincronización con WordPress
-- Fecha: 10 de noviembre de 2025

-- Agregar columnas a la tabla despachos
ALTER TABLE despachos 
ADD COLUMN IF NOT EXISTS object_id INTEGER,
ADD COLUMN IF NOT EXISTS sincronizado_wp BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ultima_sincronizacion TIMESTAMPTZ;

-- Crear índice para búsquedas por object_id
CREATE INDEX IF NOT EXISTS idx_despachos_object_id ON despachos(object_id);

-- Crear índice para despachos no sincronizados
CREATE INDEX IF NOT EXISTS idx_despachos_sincronizado_wp ON despachos(sincronizado_wp) 
WHERE sincronizado_wp = false;

-- Comentarios
COMMENT ON COLUMN despachos.object_id IS 'ID del post en WordPress (wp_posts.ID)';
COMMENT ON COLUMN despachos.sincronizado_wp IS 'Indica si el despacho está sincronizado con WordPress';
COMMENT ON COLUMN despachos.ultima_sincronizacion IS 'Timestamp de la última sincronización exitosa con WordPress';

-- Actualizar despachos existentes que tienen slug de WordPress
-- Estos despachos probablemente fueron importados de WordPress
UPDATE despachos 
SET sincronizado_wp = true 
WHERE slug IS NOT NULL 
  AND slug != '' 
  AND sincronizado_wp IS NULL;
