-- Obtener estructura de las tablas restantes

-- 1. Tabla notificaciones
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'notificaciones'
ORDER BY ordinal_position;

-- 2. Tabla leads
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'leads'
ORDER BY ordinal_position;

-- 3. Tabla lead_interactions
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'lead_interactions'
ORDER BY ordinal_position;

-- 4. Tabla sync_logs
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'sync_logs'
ORDER BY ordinal_position;
