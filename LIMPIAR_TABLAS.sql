-- Script para limpiar las tablas y empezar de cero
-- Ejecuta esto en Supabase SQL Editor

-- 1. Eliminar todas las sedes huérfanas
DELETE FROM sedes;

-- 2. Eliminar todos los despachos
DELETE FROM despachos;

-- 3. Eliminar todas las solicitudes
DELETE FROM solicitudes_despacho;

-- 4. Verificar que las tablas están vacías
SELECT 'Despachos restantes:' as tabla, COUNT(*) as total FROM despachos
UNION ALL
SELECT 'Sedes restantes:' as tabla, COUNT(*) as total FROM sedes
UNION ALL
SELECT 'Solicitudes restantes:' as tabla, COUNT(*) as total FROM solicitudes_despacho;
