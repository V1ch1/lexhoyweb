# 🗄️ MIGRACIÓN: Ampliar Schema de Tabla `sedes`

> **Fecha**: 2025-11-04  
> **Estado**: ❌ **NO NECESARIA** - Los campos ya existen en la base de datos  
> **Objetivo Original**: Agregar campos necesarios para funcionalidad completa de sedes

---

## ⚠️ IMPORTANTE: MIGRACIÓN NO NECESARIA

Después de verificar con datos reales de producción, se confirmó que **todos los campos ya existen** en la tabla `sedes`.

El documento `DATABASE_SCHEMA.md` estaba desactualizado y ha sido corregido.

**Ver**: `docs/SCHEMA_SEDES_REAL.md` para el schema real verificado.

---

## 📝 NOTA HISTÓRICA

Este documento se creó asumiendo que faltaban campos, pero la realidad es que:
- ✅ Todos los campos de ubicación ya existen
- ✅ Todos los campos de estado ya existen  
- ✅ Todos los campos JSONB ya existen
- ✅ Los timestamps ya existen

**No es necesario ejecutar ninguna migración.**

---

## 📋 CAMPOS A AGREGAR

La tabla `sedes` actual es muy básica. Necesitamos agregar los siguientes campos:

### 1. Ubicación Detallada
```sql
ALTER TABLE sedes ADD COLUMN IF NOT EXISTS calle VARCHAR;
ALTER TABLE sedes ADD COLUMN IF NOT EXISTS numero VARCHAR;
ALTER TABLE sedes ADD COLUMN IF NOT EXISTS piso VARCHAR;
ALTER TABLE sedes ADD COLUMN IF NOT EXISTS localidad VARCHAR;
ALTER TABLE sedes ADD COLUMN IF NOT EXISTS provincia VARCHAR;
ALTER TABLE sedes ADD COLUMN IF NOT EXISTS codigo_postal VARCHAR;
ALTER TABLE sedes ADD COLUMN IF NOT EXISTS pais VARCHAR DEFAULT 'España';
```

### 2. Estado y Control
```sql
ALTER TABLE sedes ADD COLUMN IF NOT EXISTS es_principal BOOLEAN DEFAULT false;
ALTER TABLE sedes ADD COLUMN IF NOT EXISTS activa BOOLEAN DEFAULT true;
ALTER TABLE sedes ADD COLUMN IF NOT EXISTS estado_verificacion VARCHAR DEFAULT 'pendiente';
ALTER TABLE sedes ADD COLUMN IF NOT EXISTS sincronizado_wp BOOLEAN DEFAULT false;
```

### 3. Contacto Adicional
```sql
ALTER TABLE sedes ADD COLUMN IF NOT EXISTS telefono VARCHAR;
ALTER TABLE sedes ADD COLUMN IF NOT EXISTS email VARCHAR;
```

### 4. Multimedia
```sql
ALTER TABLE sedes ADD COLUMN IF NOT EXISTS foto_perfil TEXT;
ALTER TABLE sedes ADD COLUMN IF NOT EXISTS logo TEXT;
```

### 5. Profesional
```sql
ALTER TABLE sedes ADD COLUMN IF NOT EXISTS numero_colegiado VARCHAR;
ALTER TABLE sedes ADD COLUMN IF NOT EXISTS colegio VARCHAR;
ALTER TABLE sedes ADD COLUMN IF NOT EXISTS experiencia TEXT;
ALTER TABLE sedes ADD COLUMN IF NOT EXISTS areas_practica TEXT[];
ALTER TABLE sedes ADD COLUMN IF NOT EXISTS especialidades TEXT;
ALTER TABLE sedes ADD COLUMN IF NOT EXISTS servicios_especificos TEXT;
```

### 6. Datos Estructurados
```sql
ALTER TABLE sedes ADD COLUMN IF NOT EXISTS horarios JSONB;
ALTER TABLE sedes ADD COLUMN IF NOT EXISTS redes_sociales JSONB;
ALTER TABLE sedes ADD COLUMN IF NOT EXISTS direccion JSONB;
ALTER TABLE sedes ADD COLUMN IF NOT EXISTS observaciones TEXT;
```

### 7. Auditoría
```sql
ALTER TABLE sedes ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE sedes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
```

---

## 🔧 SCRIPT COMPLETO DE MIGRACIÓN

```sql
-- ============================================
-- MIGRACIÓN: Ampliar tabla sedes
-- Fecha: 2025-11-04
-- ============================================

BEGIN;

-- 1. Ubicación Detallada
ALTER TABLE sedes ADD COLUMN IF NOT EXISTS calle VARCHAR;
ALTER TABLE sedes ADD COLUMN IF NOT EXISTS numero VARCHAR;
ALTER TABLE sedes ADD COLUMN IF NOT EXISTS piso VARCHAR;
ALTER TABLE sedes ADD COLUMN IF NOT EXISTS localidad VARCHAR;
ALTER TABLE sedes ADD COLUMN IF NOT EXISTS provincia VARCHAR;
ALTER TABLE sedes ADD COLUMN IF NOT EXISTS codigo_postal VARCHAR;
ALTER TABLE sedes ADD COLUMN IF NOT EXISTS pais VARCHAR DEFAULT 'España';

-- 2. Estado y Control
ALTER TABLE sedes ADD COLUMN IF NOT EXISTS es_principal BOOLEAN DEFAULT false;
ALTER TABLE sedes ADD COLUMN IF NOT EXISTS activa BOOLEAN DEFAULT true;
ALTER TABLE sedes ADD COLUMN IF NOT EXISTS estado_verificacion VARCHAR DEFAULT 'pendiente';
ALTER TABLE sedes ADD COLUMN IF NOT EXISTS sincronizado_wp BOOLEAN DEFAULT false;

-- 3. Contacto Adicional
ALTER TABLE sedes ADD COLUMN IF NOT EXISTS telefono VARCHAR;
ALTER TABLE sedes ADD COLUMN IF NOT EXISTS email VARCHAR;

-- 4. Multimedia
ALTER TABLE sedes ADD COLUMN IF NOT EXISTS foto_perfil TEXT;
ALTER TABLE sedes ADD COLUMN IF NOT EXISTS logo TEXT;

-- 5. Profesional
ALTER TABLE sedes ADD COLUMN IF NOT EXISTS numero_colegiado VARCHAR;
ALTER TABLE sedes ADD COLUMN IF NOT EXISTS colegio VARCHAR;
ALTER TABLE sedes ADD COLUMN IF NOT EXISTS experiencia TEXT;
ALTER TABLE sedes ADD COLUMN IF NOT EXISTS areas_practica TEXT[];
ALTER TABLE sedes ADD COLUMN IF NOT EXISTS especialidades TEXT;
ALTER TABLE sedes ADD COLUMN IF NOT EXISTS servicios_especificos TEXT;

-- 6. Datos Estructurados
ALTER TABLE sedes ADD COLUMN IF NOT EXISTS horarios JSONB;
ALTER TABLE sedes ADD COLUMN IF NOT EXISTS redes_sociales JSONB;
ALTER TABLE sedes ADD COLUMN IF NOT EXISTS direccion JSONB;
ALTER TABLE sedes ADD COLUMN IF NOT EXISTS observaciones TEXT;

-- 7. Auditoría
ALTER TABLE sedes ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE sedes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- 8. Actualizar sedes existentes
UPDATE sedes 
SET 
  created_at = NOW(),
  updated_at = NOW(),
  activa = true,
  estado_verificacion = 'pendiente'
WHERE created_at IS NULL;

-- 9. Marcar la primera sede de cada despacho como principal
WITH primera_sede AS (
  SELECT DISTINCT ON (despacho_id) id, despacho_id
  FROM sedes
  ORDER BY despacho_id, id ASC
)
UPDATE sedes
SET es_principal = true
WHERE id IN (SELECT id FROM primera_sede)
  AND es_principal IS NULL;

-- 10. Crear índices
CREATE INDEX IF NOT EXISTS idx_sedes_despacho_id ON sedes(despacho_id);
CREATE INDEX IF NOT EXISTS idx_sedes_es_principal ON sedes(es_principal);
CREATE INDEX IF NOT EXISTS idx_sedes_activa ON sedes(activa);

-- 11. Crear trigger para updated_at
CREATE OR REPLACE FUNCTION update_sedes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_sedes_updated_at ON sedes;
CREATE TRIGGER trigger_update_sedes_updated_at
BEFORE UPDATE ON sedes
FOR EACH ROW
EXECUTE FUNCTION update_sedes_updated_at();

COMMIT;
```

---

## ⚠️ IMPORTANTE: Restricción de Sede Principal

Debemos asegurar que cada despacho tenga **exactamente UNA** sede principal:

```sql
-- Función para validar una sola sede principal por despacho
CREATE OR REPLACE FUNCTION validar_sede_principal()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.es_principal = true THEN
    -- Desmarcar otras sedes principales del mismo despacho
    UPDATE sedes
    SET es_principal = false
    WHERE despacho_id = NEW.despacho_id
      AND id != NEW.id
      AND es_principal = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar sede principal
DROP TRIGGER IF EXISTS trigger_validar_sede_principal ON sedes;
CREATE TRIGGER trigger_validar_sede_principal
BEFORE INSERT OR UPDATE ON sedes
FOR EACH ROW
EXECUTE FUNCTION validar_sede_principal();
```

---

## 📊 SCHEMA FINAL DE `sedes`

```sql
CREATE TABLE sedes (
  -- Identificación
  id SERIAL PRIMARY KEY,
  despacho_id UUID NOT NULL REFERENCES despachos(id) ON DELETE CASCADE,
  
  -- Básicos
  nombre VARCHAR NOT NULL,
  descripcion TEXT,
  es_principal BOOLEAN DEFAULT false,
  
  -- Ubicación
  calle VARCHAR,
  numero VARCHAR,
  piso VARCHAR,
  localidad VARCHAR,
  provincia VARCHAR,
  codigo_postal VARCHAR,
  pais VARCHAR DEFAULT 'España',
  
  -- Contacto
  telefono VARCHAR,
  email VARCHAR,
  email_contacto VARCHAR,
  persona_contacto VARCHAR,
  web VARCHAR,
  
  -- Profesional
  ano_fundacion VARCHAR,
  tamano_despacho VARCHAR,
  numero_colegiado VARCHAR,
  colegio VARCHAR,
  experiencia TEXT,
  areas_practica TEXT[],
  especialidades TEXT,
  servicios_especificos TEXT,
  
  -- Multimedia
  foto_perfil TEXT,
  logo TEXT,
  
  -- Estado
  activa BOOLEAN DEFAULT true,
  estado_verificacion VARCHAR DEFAULT 'pendiente',
  sincronizado_wp BOOLEAN DEFAULT false,
  
  -- Datos estructurados
  horarios JSONB,
  redes_sociales JSONB,
  direccion JSONB,
  observaciones TEXT,
  
  -- Auditoría
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_sedes_despacho_id ON sedes(despacho_id);
CREATE INDEX idx_sedes_es_principal ON sedes(es_principal);
CREATE INDEX idx_sedes_activa ON sedes(activa);
```

---

## 🚀 CÓMO APLICAR LA MIGRACIÓN

### Opción 1: Supabase Dashboard (SQL Editor)
1. Ir a Supabase Dashboard
2. SQL Editor
3. Copiar y pegar el script completo
4. Ejecutar

### Opción 2: CLI de Supabase
```bash
supabase migration new ampliar_sedes_schema
# Copiar el script SQL al archivo generado
supabase db push
```

### Opción 3: Directamente en PostgreSQL
```bash
psql -h [HOST] -U [USER] -d [DATABASE] -f migracion_sedes.sql
```

---

## ✅ VERIFICACIÓN POST-MIGRACIÓN

```sql
-- Verificar que los campos existen
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'sedes'
ORDER BY ordinal_position;

-- Verificar que hay una sede principal por despacho
SELECT 
  d.nombre AS despacho,
  COUNT(*) AS total_sedes,
  SUM(CASE WHEN s.es_principal THEN 1 ELSE 0 END) AS sedes_principales
FROM despachos d
LEFT JOIN sedes s ON s.despacho_id = d.id
GROUP BY d.id, d.nombre
HAVING SUM(CASE WHEN s.es_principal THEN 1 ELSE 0 END) != 1;

-- Si la query anterior retorna resultados, hay despachos sin sede principal o con múltiples
```

---

## 📝 NOTAS

1. **Compatibilidad**: El script usa `IF NOT EXISTS` para ser idempotente
2. **Datos existentes**: Se preservan todos los datos actuales
3. **Sede principal**: Se marca automáticamente la primera sede de cada despacho
4. **Triggers**: Se crean triggers para mantener `updated_at` y validar sede principal
5. **Índices**: Se crean índices para mejorar performance

---

**Última actualización**: 2025-11-04  
**Estado**: ⏳ Pendiente de aplicar
