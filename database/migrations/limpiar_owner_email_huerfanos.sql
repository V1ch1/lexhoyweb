-- =====================================================
-- SCRIPT: Limpiar owner_email huérfanos
-- =====================================================
-- Este script limpia los owner_email de despachos donde
-- el email ya no tiene relación en user_despachos
-- =====================================================

-- Ver despachos con owner_email pero sin relación en user_despachos
SELECT 
  d.id,
  d.nombre,
  d.owner_email,
  CASE 
    WHEN ud.id IS NULL THEN 'SIN RELACIÓN'
    ELSE 'CON RELACIÓN'
  END as estado
FROM despachos d
LEFT JOIN user_despachos ud ON d.id = ud.despacho_id
WHERE d.owner_email IS NOT NULL
ORDER BY d.nombre;

-- =====================================================
-- LIMPIAR owner_email huérfanos
-- =====================================================
-- Esto limpia los owner_email de despachos donde NO existe
-- una relación en user_despachos
-- =====================================================

UPDATE despachos d
SET 
  owner_email = NULL,
  updated_at = NOW()
WHERE 
  d.owner_email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 
    FROM user_despachos ud 
    WHERE ud.despacho_id = d.id
  );

-- Verificar resultado
SELECT 
  id,
  nombre,
  owner_email
FROM despachos
WHERE owner_email IS NOT NULL;

-- =====================================================
-- ALTERNATIVA: Limpiar solo para un email específico
-- =====================================================
-- Si solo quieres limpiar para blancocasal@gmail.com:
/*
UPDATE despachos d
SET 
  owner_email = NULL,
  updated_at = NOW()
WHERE 
  d.owner_email = 'blancocasal@gmail.com'
  AND NOT EXISTS (
    SELECT 1 
    FROM user_despachos ud 
    INNER JOIN users u ON ud.user_id = u.id
    WHERE ud.despacho_id = d.id
      AND u.email = 'blancocasal@gmail.com'
  );
*/
