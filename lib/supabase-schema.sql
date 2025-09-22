-- Schema SQL para Supabase - Lexhoy Portal
-- Estructura compatible con Algolia para despachos multi-sede

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de despachos (estructura principal) - CREAR PRIMERO
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

-- Tabla de usuarios (ahora puede referenciar despachos)
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  telefono VARCHAR(20),
  fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ultimo_acceso TIMESTAMP WITH TIME ZONE,
  activo BOOLEAN DEFAULT true,
  email_verificado BOOLEAN DEFAULT false,
  plan VARCHAR(20) DEFAULT 'basico' CHECK (plan IN ('basico', 'profesional', 'enterprise')),
  despacho_id UUID REFERENCES public.despachos(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- Tabla de sedes (oficinas del despacho)
CREATE TABLE public.sedes (
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
  
  -- Horarios (JSON)
  horarios JSONB DEFAULT '{}',
  
  -- Redes sociales (JSON)
  redes_sociales JSONB DEFAULT '{}',
  
  -- Notas internas
  observaciones TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de leads
CREATE TABLE public.leads (
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

-- Tabla de interacciones con leads
CREATE TABLE public.lead_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  despacho_id UUID NOT NULL REFERENCES public.despachos(id),
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('llamada', 'email', 'reunion', 'propuesta', 'contrato', 'nota')),
  descripcion TEXT,
  fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resultado VARCHAR(20) CHECK (resultado IN ('exitoso', 'sin_respuesta', 'reagendar', 'no_interesado', 'convertido')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimización
CREATE INDEX idx_despachos_object_id ON public.despachos(object_id);
CREATE INDEX idx_despachos_slug ON public.despachos(slug);
CREATE INDEX idx_despachos_areas_practica ON public.despachos USING GIN(areas_practica);
CREATE INDEX idx_sedes_despacho_id ON public.sedes(despacho_id);
CREATE INDEX idx_sedes_provincia ON public.sedes(provincia);
CREATE INDEX idx_sedes_localidad ON public.sedes(localidad);
CREATE INDEX idx_sedes_areas_practica ON public.sedes USING GIN(areas_practica);
CREATE INDEX idx_leads_despacho_id ON public.leads(despacho_id);
CREATE INDEX idx_leads_estado ON public.leads(estado);
CREATE INDEX idx_leads_especialidad ON public.leads(especialidad);
CREATE INDEX idx_leads_fecha_creacion ON public.leads(fecha_creacion);
CREATE INDEX idx_lead_interactions_lead_id ON public.lead_interactions(lead_id);

-- Triggers para actualizar timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_despachos_updated_at BEFORE UPDATE ON public.despachos FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_sedes_updated_at BEFORE UPDATE ON public.sedes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Trigger para actualizar num_sedes en despachos
CREATE OR REPLACE FUNCTION update_num_sedes()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.despachos 
    SET num_sedes = (
        SELECT COUNT(*) 
        FROM public.sedes 
        WHERE despacho_id = COALESCE(NEW.despacho_id, OLD.despacho_id)
        AND activa = true
    )
    WHERE id = COALESCE(NEW.despacho_id, OLD.despacho_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE TRIGGER update_despacho_num_sedes 
    AFTER INSERT OR UPDATE OR DELETE ON public.sedes 
    FOR EACH ROW EXECUTE PROCEDURE update_num_sedes();

-- RLS (Row Level Security) políticas básicas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.despachos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sedes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_interactions ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo vean sus propios datos
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Política para despachos - los usuarios pueden ver su propio despacho
CREATE POLICY "Users can view own despacho" ON public.despachos FOR SELECT USING (
    id IN (SELECT despacho_id FROM public.users WHERE id = auth.uid())
);

-- Política para sedes - los usuarios pueden ver las sedes de su despacho
CREATE POLICY "Users can view own despacho sedes" ON public.sedes FOR SELECT USING (
    despacho_id IN (SELECT despacho_id FROM public.users WHERE id = auth.uid())
);

-- Política para leads - los usuarios pueden ver los leads de su despacho
CREATE POLICY "Users can view own despacho leads" ON public.leads FOR SELECT USING (
    despacho_id IN (SELECT despacho_id FROM public.users WHERE id = auth.uid())
);

-- Datos de ejemplo (puedes comentar esta sección en producción)
-- INSERT INTO public.despachos (object_id, nombre, slug, areas_practica) VALUES 
-- ('lexhoy-001', 'Despacho Jurídico Ejemplar', 'despacho-juridico-ejemplar', ARRAY['civil', 'penal', 'laboral']);

-- INSERT INTO public.sedes (despacho_id, nombre, localidad, provincia, es_principal, areas_practica) VALUES 
-- ((SELECT id FROM public.despachos WHERE object_id = 'lexhoy-001'), 'Sede Central', 'Madrid', 'Madrid', true, ARRAY['civil', 'penal']);