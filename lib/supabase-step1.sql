-- PASO 1: Extensiones y tabla base
-- Ejecutar este bloque primero

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de despachos (PRIMERO - no tiene dependencias)
CREATE TABLE public.despachos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  object_id VARCHAR(100) UNIQUE NOT NULL, -- ID para Algolia
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  num_sedes INTEGER DEFAULT 1,
  areas_practica TEXT[] DEFAULT '{}', -- Array de especialidades
  ultima_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verificado BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);