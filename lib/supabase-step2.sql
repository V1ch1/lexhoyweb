-- PASO 2: Tablas que dependen de despachos
-- Ejecutar este bloque después del paso 1

-- Tabla de usuarios (depende de despachos)
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

-- Tabla de sedes (depende de despachos)
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

-- Tabla de leads (depende de despachos y sedes)
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

-- Tabla de interacciones con leads (depende de leads y despachos)
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