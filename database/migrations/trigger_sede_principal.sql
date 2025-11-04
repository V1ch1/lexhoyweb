-- =====================================================
-- TRIGGER: Validar Sede Principal Única
-- =====================================================
-- Asegura que solo haya UNA sede principal por despacho
-- Cuando se marca una sede como principal, desmarca las demás
-- =====================================================

-- Crear función del trigger
CREATE OR REPLACE FUNCTION validar_sede_principal()
RETURNS TRIGGER AS $$
BEGIN
  -- Si la nueva/actualizada sede es principal
  IF NEW.es_principal = true THEN
    -- Desmarcar todas las demás sedes del mismo despacho
    UPDATE sedes
    SET es_principal = false
    WHERE despacho_id = NEW.despacho_id
      AND id != NEW.id
      AND es_principal = true;
    
    -- Log para debug (opcional)
    RAISE NOTICE 'Sede % marcada como principal para despacho %', NEW.id, NEW.despacho_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para INSERT
CREATE TRIGGER trigger_validar_sede_principal_insert
BEFORE INSERT ON sedes
FOR EACH ROW
EXECUTE FUNCTION validar_sede_principal();

-- Crear trigger para UPDATE
CREATE TRIGGER trigger_validar_sede_principal_update
BEFORE UPDATE ON sedes
FOR EACH ROW
WHEN (OLD.es_principal IS DISTINCT FROM NEW.es_principal)
EXECUTE FUNCTION validar_sede_principal();

-- =====================================================
-- VALIDACIÓN: Asegurar que siempre haya una sede principal
-- =====================================================
-- Esta función se ejecuta después de DELETE para asegurar
-- que si se elimina la sede principal, otra tome su lugar
-- =====================================================

CREATE OR REPLACE FUNCTION asegurar_sede_principal()
RETURNS TRIGGER AS $$
DECLARE
  sede_count INTEGER;
  primera_sede_id INTEGER;
BEGIN
  -- Si se eliminó una sede principal
  IF OLD.es_principal = true THEN
    -- Contar cuántas sedes quedan en el despacho
    SELECT COUNT(*), MIN(id)
    INTO sede_count, primera_sede_id
    FROM sedes
    WHERE despacho_id = OLD.despacho_id
      AND activa = true;
    
    -- Si quedan sedes, marcar la primera como principal
    IF sede_count > 0 THEN
      UPDATE sedes
      SET es_principal = true
      WHERE id = primera_sede_id;
      
      RAISE NOTICE 'Sede % marcada como nueva principal para despacho %', primera_sede_id, OLD.despacho_id;
    END IF;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para DELETE
CREATE TRIGGER trigger_asegurar_sede_principal_delete
AFTER DELETE ON sedes
FOR EACH ROW
EXECUTE FUNCTION asegurar_sede_principal();

-- =====================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON FUNCTION validar_sede_principal() IS 
'Asegura que solo haya una sede principal por despacho. 
Cuando se marca una sede como principal, desmarca automáticamente las demás.';

COMMENT ON FUNCTION asegurar_sede_principal() IS 
'Asegura que siempre haya una sede principal por despacho. 
Si se elimina la sede principal, marca otra como principal automáticamente.';

-- =====================================================
-- TESTING (Ejecutar manualmente para probar)
-- =====================================================

-- Test 1: Crear dos sedes, ambas marcadas como principales
-- Solo la última debería quedar como principal
/*
INSERT INTO sedes (despacho_id, nombre, es_principal, localidad, provincia, telefono, email_contacto)
VALUES 
  ('tu-despacho-uuid', 'Sede 1', true, 'Madrid', 'Madrid', '123456789', 'test1@test.com'),
  ('tu-despacho-uuid', 'Sede 2', true, 'Barcelona', 'Barcelona', '987654321', 'test2@test.com');

-- Verificar: Solo Sede 2 debe ser principal
SELECT id, nombre, es_principal FROM sedes WHERE despacho_id = 'tu-despacho-uuid';
*/

-- Test 2: Actualizar una sede no principal a principal
-- La anterior principal debe desmarcarse
/*
UPDATE sedes 
SET es_principal = true 
WHERE nombre = 'Sede 1' AND despacho_id = 'tu-despacho-uuid';

-- Verificar: Solo Sede 1 debe ser principal ahora
SELECT id, nombre, es_principal FROM sedes WHERE despacho_id = 'tu-despacho-uuid';
*/

-- Test 3: Eliminar la sede principal
-- Otra sede debe marcarse como principal automáticamente
/*
DELETE FROM sedes WHERE nombre = 'Sede 1' AND despacho_id = 'tu-despacho-uuid';

-- Verificar: Sede 2 debe ser principal ahora
SELECT id, nombre, es_principal FROM sedes WHERE despacho_id = 'tu-despacho-uuid';
*/

-- =====================================================
-- ROLLBACK (Si necesitas deshacer)
-- =====================================================
/*
DROP TRIGGER IF EXISTS trigger_validar_sede_principal_insert ON sedes;
DROP TRIGGER IF EXISTS trigger_validar_sede_principal_update ON sedes;
DROP TRIGGER IF EXISTS trigger_asegurar_sede_principal_delete ON sedes;
DROP FUNCTION IF EXISTS validar_sede_principal();
DROP FUNCTION IF EXISTS asegurar_sede_principal();
*/
