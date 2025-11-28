-- Script para limpiar duplicados de propiedad de despachos
-- Ejecutar en Supabase SQL Editor

-- 1. Ver el estado actual de duplicados
SELECT 
  d.id,
  d.nombre,
  d.owner_email,
  COUNT(ud.user_id) as num_asignaciones,
  STRING_AGG(u.email, ', ') as usuarios_asignados
FROM despachos d
LEFT JOIN user_despachos ud ON d.id = ud.despacho_id
LEFT JOIN users u ON ud.user_id = u.id
WHERE d.owner_email IS NOT NULL
GROUP BY d.id, d.nombre, d.owner_email
HAVING COUNT(ud.user_id) > 1
ORDER BY d.nombre;

-- 2. Limpiar owner_email del despacho "Vento" (o cualquier otro con duplicados)
-- Esto permite que se vuelva a solicitar la propiedad limpiamente
UPDATE despachos
SET owner_email = NULL
WHERE nombre LIKE '%Vento%';

-- 3. Eliminar asignaciones duplicadas en user_despachos
-- Mantener solo la más reciente para cada despacho
DELETE FROM user_despachos
WHERE id IN (
  SELECT ud.id
  FROM user_despachos ud
  INNER JOIN (
    SELECT despacho_id, MIN(created_at) as first_created
    FROM user_despachos
    GROUP BY despacho_id
    HAVING COUNT(*) > 1
  ) dups ON ud.despacho_id = dups.despacho_id
  WHERE ud.created_at > dups.first_created
);

-- 4. Degradar usuarios que ya no tienen despachos asignados
UPDATE users
SET rol = 'usuario'
WHERE rol = 'despacho_admin'
AND id NOT IN (
  SELECT DISTINCT user_id 
  FROM user_despachos
);

-- 5. Verificar el resultado
SELECT 
  u.email,
  u.rol,
  COUNT(ud.despacho_id) as num_despachos,
  STRING_AGG(d.nombre, ', ') as despachos
FROM users u
LEFT JOIN user_despachos ud ON u.id = ud.user_id
LEFT JOIN despachos d ON ud.despacho_id = d.id
WHERE u.email IN ('blancocasal@gmail.com', 'blancoyenbatea@gmail.com')
GROUP BY u.id, u.email, u.rol;
