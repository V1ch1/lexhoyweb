-- Ejecuta este SQL en Supabase SQL Editor para obtener la estructura actual
-- Copia el resultado completo y pégamelo

-- 1. Estructura de la tabla despachos
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'despachos'
ORDER BY ordinal_position;

-- 2. Estructura de la tabla sedes
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'sedes'
ORDER BY ordinal_position;

-- 3. Estructura de la tabla users
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- 4. Estructura de la tabla user_despachos
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'user_despachos'
ORDER BY ordinal_position;

-- 5. Estructura de la tabla solicitudes_despacho
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'solicitudes_despacho'
ORDER BY ordinal_position;
