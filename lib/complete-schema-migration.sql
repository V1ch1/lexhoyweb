-- ============================================
-- MIGRACIÓN COMPLETA DE ESQUEMA A PRODUCCIÓN
-- Basado en el esquema de desarrollo con roles actualizados
-- ============================================

-- 1. Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Crear tabla de despachos (estructura principal)
CREATE TABLE IF NOT EXISTS public.despachos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  object_id VARCHAR(100) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  num_sedes INTEGER DEFAULT 1,
  areas_practica TEXT[] DEFAULT '{}',
  ultima_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verificado BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Actualizar tabla users existente para compatibilidad con el esquema completo
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS ultimo_acceso TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_verificado BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS plan VARCHAR(20) DEFAULT 'basico';

-- Agregar constraint para plan si no existe
DO $$ 
BEGIN
    ALTER TABLE public.users ADD CONSTRAINT users_plan_check CHECK (plan IN ('basico', 'profesional', 'enterprise'));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 4. Crear tabla user_despachos (relación muchos a muchos)
CREATE TABLE IF NOT EXISTS public.user_despachos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  despacho_id UUID NOT NULL REFERENCES public.despachos(id) ON DELETE CASCADE,
  rol_en_despacho VARCHAR(50) DEFAULT 'miembro' CHECK (rol_en_despacho IN ('admin', 'miembro', 'invitado')),
  fecha_asignacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, despacho_id)
);

-- 5. Crear tabla de solicitudes de registro
CREATE TABLE IF NOT EXISTS public.solicitudes_registro (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  telefono VARCHAR(20),
  mensaje TEXT,
  estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobada', 'rechazada')),
  fecha_solicitud TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_procesado TIMESTAMP WITH TIME ZONE,
  procesado_por UUID REFERENCES public.users(id),
  notas_admin TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Crear tabla de sedes
CREATE TABLE IF NOT EXISTS public.sedes (
  id SERIAL PRIMARY KEY,
  despacho_id UUID NOT NULL REFERENCES public.despachos(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  web VARCHAR(255),
  ano_fundacion VARCHAR(4),
  tamano_despacho VARCHAR(50),
  persona_contacto VARCHAR(255),
  email_contacto VARCHAR(255),
  telefono VARCHAR(20),
  numero_colegiado VARCHAR(50),
  colegio VARCHAR(255),
  experiencia TEXT,
  
  -- Dirección
  calle VARCHAR(255),
  numero VARCHAR(10),
  piso VARCHAR(10),
  localidad VARCHAR(100),
  provincia VARCHAR(100),
  codigo_postal VARCHAR(10),
  pais VARCHAR(50) DEFAULT 'España',
  
  -- Información profesional
  especialidades TEXT,
  servicios_especificos TEXT,
  areas_practica TEXT[] DEFAULT '{}',
  
  -- Estados
  estado_verificacion VARCHAR(20) DEFAULT 'pendiente' CHECK (estado_verificacion IN ('pendiente', 'verificado', 'rechazado')),
  estado_registro VARCHAR(20) DEFAULT 'activo' CHECK (estado_registro IN ('activo', 'inactivo', 'suspendido')),
  is_verified BOOLEAN DEFAULT false,
  es_principal BOOLEAN DEFAULT false,
  activa BOOLEAN DEFAULT true,
  
  -- Multimedia
  foto_perfil VARCHAR(500),
  
  -- Horarios y redes sociales (JSON)
  horarios JSONB DEFAULT '{}',
  redes_sociales JSONB DEFAULT '{}',
  
  -- Notas internas
  observaciones TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Crear tabla de leads
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  despacho_id UUID NOT NULL REFERENCES public.despachos(id),
  sede_id INTEGER REFERENCES public.sedes(id),
  
  -- Información del cliente
  cliente_nombre VARCHAR(255) NOT NULL,
  cliente_email VARCHAR(255) NOT NULL,
  cliente_telefono VARCHAR(20),
  
  -- Información de la consulta
  consulta TEXT NOT NULL,
  especialidad VARCHAR(100) NOT NULL,
  urgencia VARCHAR(20) DEFAULT 'media' CHECK (urgencia IN ('baja', 'media', 'alta', 'urgente')),
  presupuesto_estimado DECIMAL(10,2),
  
  -- Ubicación
  provincia VARCHAR(100),
  ciudad VARCHAR(100),
  codigo_postal VARCHAR(10),
  
  -- Estado y gestión
  estado VARCHAR(20) DEFAULT 'nuevo' CHECK (estado IN ('nuevo', 'contactado', 'cerrado')),
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_asignacion TIMESTAMP WITH TIME ZONE,
  fecha_cierre TIMESTAMP WITH TIME ZONE,
  
  -- Origen
  fuente VARCHAR(100) DEFAULT 'web',
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  
  -- Seguimiento
  notas TEXT,
  valoracion INTEGER CHECK (valoracion >= 1 AND valoracion <= 5),
  feedback TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Crear tabla de interacciones con leads
CREATE TABLE IF NOT EXISTS public.lead_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  despacho_id UUID NOT NULL REFERENCES public.despachos(id),
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('llamada', 'email', 'reunion', 'propuesta', 'contrato', 'nota')),
  descripcion TEXT,
  fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resultado VARCHAR(20) CHECK (resultado IN ('exitoso', 'sin_respuesta', 'reagendar', 'no_interesado', 'convertido')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Crear índices para optimización
CREATE INDEX IF NOT EXISTS idx_despachos_object_id ON public.despachos(object_id);
CREATE INDEX IF NOT EXISTS idx_despachos_slug ON public.despachos(slug);
CREATE INDEX IF NOT EXISTS idx_despachos_areas_practica ON public.despachos USING GIN(areas_practica);
CREATE INDEX IF NOT EXISTS idx_user_despachos_user_id ON public.user_despachos(user_id);
CREATE INDEX IF NOT EXISTS idx_user_despachos_despacho_id ON public.user_despachos(despacho_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_estado ON public.solicitudes_registro(estado);
CREATE INDEX IF NOT EXISTS idx_solicitudes_fecha ON public.solicitudes_registro(fecha_solicitud);
CREATE INDEX IF NOT EXISTS idx_sedes_despacho_id ON public.sedes(despacho_id);
CREATE INDEX IF NOT EXISTS idx_sedes_provincia ON public.sedes(provincia);
CREATE INDEX IF NOT EXISTS idx_sedes_localidad ON public.sedes(localidad);
CREATE INDEX IF NOT EXISTS idx_leads_despacho_id ON public.leads(despacho_id);
CREATE INDEX IF NOT EXISTS idx_leads_estado ON public.leads(estado);
CREATE INDEX IF NOT EXISTS idx_leads_especialidad ON public.leads(especialidad);

-- 10. Crear o reemplazar función para actualizar timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 11. Crear triggers para actualizar timestamps
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_despachos_updated_at ON public.despachos;
CREATE TRIGGER update_despachos_updated_at BEFORE UPDATE ON public.despachos FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_despachos_updated_at ON public.user_despachos;
CREATE TRIGGER update_user_despachos_updated_at BEFORE UPDATE ON public.user_despachos FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_solicitudes_updated_at ON public.solicitudes_registro;
CREATE TRIGGER update_solicitudes_updated_at BEFORE UPDATE ON public.solicitudes_registro FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_sedes_updated_at ON public.sedes;
CREATE TRIGGER update_sedes_updated_at BEFORE UPDATE ON public.sedes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_leads_updated_at ON public.leads;
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 12. Verificar la migración
SELECT 'Migración completada' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;