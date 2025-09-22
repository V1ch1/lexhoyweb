-- PASO 3: Índices, triggers y políticas
-- Ejecutar este bloque después del paso 2

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

-- Datos de ejemplo (opcional)
INSERT INTO public.despachos (object_id, nombre, slug, areas_practica) VALUES 
('lexhoy-demo-001', 'Despacho Jurídico Ejemplar', 'despacho-juridico-ejemplar', ARRAY['civil', 'penal', 'laboral']);

INSERT INTO public.sedes (despacho_id, nombre, localidad, provincia, es_principal, areas_practica, telefono, email_contacto) VALUES 
((SELECT id FROM public.despachos WHERE object_id = 'lexhoy-demo-001'), 'Sede Central Madrid', 'Madrid', 'Madrid', true, ARRAY['civil', 'penal'], '+34 91 123 45 67', 'madrid@despacho.com');