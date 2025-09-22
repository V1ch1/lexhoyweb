-- ACTUALIZACIÓN DEL SCHEMA: Sistema de Roles y Permisos
-- Ejecutar después de tener las tablas básicas creadas

-- 1. Agregar campos de roles a la tabla users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS rol VARCHAR(20) DEFAULT 'despacho_admin' CHECK (rol IN ('super_admin', 'despacho_admin')),
ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'activo', 'inactivo', 'suspendido')),
ADD COLUMN IF NOT EXISTS fecha_aprobacion TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS aprobado_por UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS notas_admin TEXT;

-- 2. Crear tabla de asignaciones usuario-despacho (muchos a muchos)
CREATE TABLE IF NOT EXISTS public.user_despachos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  despacho_id UUID NOT NULL REFERENCES public.despachos(id) ON DELETE CASCADE,
  fecha_asignacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  asignado_por UUID REFERENCES public.users(id),
  activo BOOLEAN DEFAULT true,
  permisos JSONB DEFAULT '{"leer": true, "escribir": true, "eliminar": false}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, despacho_id)
);

-- 3. Agregar campos de estado a despachos
ALTER TABLE public.despachos
ADD COLUMN IF NOT EXISTS estado_registro VARCHAR(20) DEFAULT 'borrador' CHECK (estado_registro IN ('borrador', 'pendiente', 'aprobado', 'rechazado', 'suspendido')),
ADD COLUMN IF NOT EXISTS fecha_solicitud TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS fecha_aprobacion TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS aprobado_por UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS notas_aprobacion TEXT,
ADD COLUMN IF NOT EXISTS sincronizado_algolia BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sincronizado_wordpress BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS fecha_sync_algolia TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS fecha_sync_wordpress TIMESTAMP WITH TIME ZONE;

-- 4. Tabla de solicitudes de registro (flujo de aprobación)
CREATE TABLE IF NOT EXISTS public.solicitudes_registro (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  telefono VARCHAR(20),
  empresa VARCHAR(255),
  mensaje TEXT,
  datos_despacho JSONB, -- Información completa del despacho a crear
  estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
  fecha_solicitud TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_respuesta TIMESTAMP WITH TIME ZONE,
  respondido_por UUID REFERENCES public.users(id),
  notas_respuesta TEXT,
  user_creado_id UUID REFERENCES public.users(id), -- Usuario creado tras aprobación
  despacho_creado_id UUID REFERENCES public.despachos(id), -- Despacho creado tras aprobación
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabla de logs de sincronización
CREATE TABLE IF NOT EXISTS public.sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('algolia', 'wordpress')),
  accion VARCHAR(20) NOT NULL CHECK (accion IN ('create', 'update', 'delete')),
  entidad VARCHAR(20) NOT NULL CHECK (entidad IN ('despacho', 'sede', 'user')),
  entidad_id UUID NOT NULL,
  datos_enviados JSONB,
  respuesta_api JSONB,
  exitoso BOOLEAN DEFAULT false,
  error_mensaje TEXT,
  fecha_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reintentos INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Índices para optimización
CREATE INDEX IF NOT EXISTS idx_users_rol ON public.users(rol);
CREATE INDEX IF NOT EXISTS idx_users_estado ON public.users(estado);
CREATE INDEX IF NOT EXISTS idx_user_despachos_user_id ON public.user_despachos(user_id);
CREATE INDEX IF NOT EXISTS idx_user_despachos_despacho_id ON public.user_despachos(despacho_id);
CREATE INDEX IF NOT EXISTS idx_despachos_estado_registro ON public.despachos(estado_registro);
CREATE INDEX IF NOT EXISTS idx_solicitudes_estado ON public.solicitudes_registro(estado);
CREATE INDEX IF NOT EXISTS idx_sync_logs_tipo_fecha ON public.sync_logs(tipo, fecha_sync);

-- 7. Triggers para user_despachos
DROP TRIGGER IF EXISTS update_user_despachos_updated_at ON public.user_despachos;
CREATE TRIGGER update_user_despachos_updated_at 
  BEFORE UPDATE ON public.user_despachos 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_solicitudes_registro_updated_at ON public.solicitudes_registro;
CREATE TRIGGER update_solicitudes_registro_updated_at 
  BEFORE UPDATE ON public.solicitudes_registro 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 8. Función para sincronizar el campo legacy despacho_id
CREATE OR REPLACE FUNCTION sync_user_despacho_legacy()
RETURNS TRIGGER AS $$
BEGIN
  -- Si es el primer despacho asignado, actualizar el campo legacy
  IF (SELECT COUNT(*) FROM public.user_despachos WHERE user_id = NEW.user_id AND activo = true) = 1 THEN
    UPDATE public.users 
    SET despacho_id = NEW.despacho_id 
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS sync_user_despacho_legacy_trigger ON public.user_despachos;
CREATE TRIGGER sync_user_despacho_legacy_trigger
  AFTER INSERT ON public.user_despachos
  FOR EACH ROW EXECUTE PROCEDURE sync_user_despacho_legacy();

-- 9. Políticas RLS actualizadas
-- Los super_admin pueden ver todo, los despacho_admin solo sus asignaciones

-- Política para users - super_admin ve todo, despacho_admin solo su perfil
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users access control" ON public.users;
CREATE POLICY "Users access control" ON public.users FOR SELECT USING (
  -- Super admin ve todo
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND rol = 'super_admin') OR
  -- Usuario normal ve solo su perfil
  auth.uid() = id
);

-- Política para despachos - super_admin ve todo, despacho_admin solo asignados
DROP POLICY IF EXISTS "Users can view own despacho" ON public.despachos;
DROP POLICY IF EXISTS "Despachos access control" ON public.despachos;
CREATE POLICY "Despachos access control" ON public.despachos FOR SELECT USING (
  -- Super admin ve todo
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND rol = 'super_admin') OR
  -- Usuario normal ve solo despachos asignados
  id IN (SELECT despacho_id FROM public.user_despachos WHERE user_id = auth.uid() AND activo = true)
);

-- Política para sedes - igual que despachos
DROP POLICY IF EXISTS "Users can view own despacho sedes" ON public.sedes;
DROP POLICY IF EXISTS "Sedes access control" ON public.sedes;
CREATE POLICY "Sedes access control" ON public.sedes FOR SELECT USING (
  -- Super admin ve todo
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND rol = 'super_admin') OR
  -- Usuario normal ve solo sedes de despachos asignados
  despacho_id IN (SELECT despacho_id FROM public.user_despachos WHERE user_id = auth.uid() AND activo = true)
);

-- Política para leads - igual que despachos
DROP POLICY IF EXISTS "Users can view own despacho leads" ON public.leads;
DROP POLICY IF EXISTS "Leads access control" ON public.leads;
CREATE POLICY "Leads access control" ON public.leads FOR SELECT USING (
  -- Super admin ve todo
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND rol = 'super_admin') OR
  -- Usuario normal ve solo leads de despachos asignados
  despacho_id IN (SELECT despacho_id FROM public.user_despachos WHERE user_id = auth.uid() AND activo = true)
);

-- Políticas para las nuevas tablas
ALTER TABLE public.user_despachos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitudes_registro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

-- Solo super_admin puede ver user_despachos
DROP POLICY IF EXISTS "Super admin user despachos" ON public.user_despachos;
CREATE POLICY "Super admin user despachos" ON public.user_despachos FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND rol = 'super_admin')
);

-- Solo super_admin puede ver solicitudes
DROP POLICY IF EXISTS "Super admin solicitudes" ON public.solicitudes_registro;
CREATE POLICY "Super admin solicitudes" ON public.solicitudes_registro FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND rol = 'super_admin')
);

-- Solo super_admin puede ver logs de sync
DROP POLICY IF EXISTS "Super admin sync logs" ON public.sync_logs;
CREATE POLICY "Super admin sync logs" ON public.sync_logs FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND rol = 'super_admin')
);

-- 10. Crear el primer super administrador (CAMBIAR EMAIL)
INSERT INTO public.users (
  email, 
  nombre, 
  apellidos, 
  rol, 
  estado, 
  activo, 
  email_verificado,
  fecha_aprobacion
) VALUES (
  'jose@blancoyenbatea.com', -- TU EMAIL REAL
  'José', 
  'Administrador',
  'super_admin',
  'activo',
  true,
  true,
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  rol = 'super_admin',
  estado = 'activo',
  activo = true,
  email_verificado = true;

-- 11. Datos de ejemplo adicionales
-- Usuario normal de ejemplo
INSERT INTO public.users (
  email, 
  nombre, 
  apellidos, 
  rol, 
  estado,
  fecha_aprobacion,
  aprobado_por
) VALUES (
  'despacho@ejemplo.com',
  'Juan',
  'García',
  'despacho_admin',
  'activo',
  NOW(),
  (SELECT id FROM public.users WHERE email = 'jose@blancoyenbatea.com')
) ON CONFLICT (email) DO NOTHING;

-- Asignar despacho al usuario ejemplo
INSERT INTO public.user_despachos (
  user_id,
  despacho_id,
  asignado_por
) VALUES (
  (SELECT id FROM public.users WHERE email = 'despacho@ejemplo.com'),
  (SELECT id FROM public.despachos WHERE object_id = 'lexhoy-demo-001'),
  (SELECT id FROM public.users WHERE email = 'jose@blancoyenbatea.com')
) ON CONFLICT (user_id, despacho_id) DO NOTHING;