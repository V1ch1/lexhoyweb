-- =====================================================
-- SISTEMA DE MARKETPLACE DE LEADS PARA LEXHOY
-- =====================================================
-- Este schema crea las tablas necesarias para el sistema
-- de captura, procesamiento con IA y venta de leads

-- =====================================================
-- 1. TABLA DE LEADS (Actualizada)
-- =====================================================
-- Almacena los leads capturados desde LexHoy.com
DROP TABLE IF EXISTS leads CASCADE;

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Información del lead (datos personales - PRIVADOS)
  nombre VARCHAR(255) NOT NULL,
  correo VARCHAR(255) NOT NULL,
  telefono VARCHAR(50),
  cuerpo_mensaje TEXT NOT NULL,
  
  -- Origen del lead
  url_pagina TEXT NOT NULL,
  titulo_post VARCHAR(500) NOT NULL,
  fuente VARCHAR(100) DEFAULT 'lexhoy.com',
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  
  -- Clasificación automática
  especialidad VARCHAR(100),
  provincia VARCHAR(100),
  ciudad VARCHAR(100),
  urgencia VARCHAR(20) CHECK (urgencia IN ('baja', 'media', 'alta', 'urgente')),
  
  -- Resumen generado por IA (PÚBLICO - sin datos personales)
  resumen_ia TEXT, -- Resumen anónimo que ven los despachos antes de comprar
  precio_estimado DECIMAL(10, 2), -- Precio estimado por IA
  palabras_clave TEXT[], -- Keywords extraídas por IA
  
  -- Estado del lead en el marketplace
  estado VARCHAR(50) DEFAULT 'pendiente' CHECK (estado IN (
    'pendiente',      -- Recién capturado, pendiente de procesamiento IA
    'procesado',      -- IA ha generado resumen, listo para marketplace
    'en_subasta',     -- Disponible para pujas
    'vendido',        -- Comprado por un despacho
    'expirado',       -- No se vendió en el tiempo límite
    'descartado'      -- No cumple criterios de calidad
  )),
  
  -- Información de venta
  comprador_id UUID REFERENCES users(id),
  precio_venta DECIMAL(10, 2),
  fecha_venta TIMESTAMP WITH TIME ZONE,
  
  -- Subasta
  precio_base DECIMAL(10, 2) DEFAULT 50.00,
  precio_actual DECIMAL(10, 2),
  fecha_inicio_subasta TIMESTAMP WITH TIME ZONE,
  fecha_fin_subasta TIMESTAMP WITH TIME ZONE,
  
  -- Calidad del lead (calculado por IA)
  puntuacion_calidad INTEGER CHECK (puntuacion_calidad BETWEEN 1 AND 100),
  nivel_detalle VARCHAR(20) CHECK (nivel_detalle IN ('bajo', 'medio', 'alto')),
  
  -- Consentimientos
  acepta_terminos BOOLEAN DEFAULT false,
  acepta_privacidad BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  procesado_at TIMESTAMP WITH TIME ZONE, -- Cuando la IA lo procesó
  
  -- Índices para búsquedas
  CONSTRAINT valid_precio CHECK (precio_venta IS NULL OR precio_venta > 0)
);

-- Índices para optimizar consultas
CREATE INDEX idx_leads_estado ON leads(estado);
CREATE INDEX idx_leads_especialidad ON leads(especialidad);
CREATE INDEX idx_leads_provincia ON leads(provincia);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_comprador ON leads(comprador_id);
CREATE INDEX idx_leads_subasta_activa ON leads(estado, fecha_fin_subasta) 
  WHERE estado = 'en_subasta';

-- =====================================================
-- 2. TABLA DE PUJAS
-- =====================================================
-- Almacena las pujas de los despachos por leads
CREATE TABLE pujas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  despacho_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  monto DECIMAL(10, 2) NOT NULL CHECK (monto > 0),
  mensaje TEXT, -- Mensaje opcional del despacho
  
  estado VARCHAR(20) DEFAULT 'activa' CHECK (estado IN (
    'activa',      -- Puja válida
    'superada',    -- Otra puja la superó
    'ganadora',    -- Ganó la subasta
    'cancelada'    -- Despacho canceló su puja
  )),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(lead_id, despacho_id, created_at) -- Un despacho puede pujar varias veces
);

CREATE INDEX idx_pujas_lead ON pujas(lead_id, monto DESC);
CREATE INDEX idx_pujas_despacho ON pujas(despacho_id, created_at DESC);
CREATE INDEX idx_pujas_estado ON pujas(estado);

-- =====================================================
-- 3. TABLA DE COMPRAS DE LEADS
-- =====================================================
-- Registro de leads comprados (compra directa o ganados en subasta)
CREATE TABLE compras_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  comprador_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  tipo_compra VARCHAR(20) NOT NULL CHECK (tipo_compra IN ('directa', 'subasta')),
  precio_pagado DECIMAL(10, 2) NOT NULL CHECK (precio_pagado > 0),
  
  -- Datos del lead (copiados en el momento de la compra para historial)
  lead_snapshot JSONB NOT NULL, -- Snapshot completo del lead
  
  -- Estado de la compra
  estado VARCHAR(20) DEFAULT 'completada' CHECK (estado IN (
    'completada',
    'reembolsada',
    'disputada'
  )),
  
  -- Valoración del lead (después de contactar)
  valoracion INTEGER CHECK (valoracion BETWEEN 1 AND 5),
  comentario_valoracion TEXT,
  fecha_valoracion TIMESTAMP WITH TIME ZONE,
  
  -- Resultado
  convertido BOOLEAN DEFAULT false,
  fecha_conversion TIMESTAMP WITH TIME ZONE,
  valor_conversion DECIMAL(10, 2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(lead_id) -- Un lead solo se puede vender una vez
);

CREATE INDEX idx_compras_comprador ON compras_leads(comprador_id, created_at DESC);
CREATE INDEX idx_compras_lead ON compras_leads(lead_id);
CREATE INDEX idx_compras_estado ON compras_leads(estado);

-- =====================================================
-- 4. TABLA DE VISUALIZACIONES DE LEADS
-- =====================================================
-- Tracking de qué despachos han visto qué leads
CREATE TABLE visualizaciones_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  despacho_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  vistas INTEGER DEFAULT 1,
  primera_vista TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ultima_vista TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(lead_id, despacho_id)
);

CREATE INDEX idx_visualizaciones_lead ON visualizaciones_leads(lead_id);
CREATE INDEX idx_visualizaciones_despacho ON visualizaciones_leads(despacho_id);

-- =====================================================
-- 5. TABLA DE LOGS DE PROCESAMIENTO IA
-- =====================================================
-- Registro de procesamiento de IA para auditoría
CREATE TABLE logs_procesamiento_ia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  
  modelo_ia VARCHAR(100) NOT NULL, -- ej: 'gpt-4', 'gpt-3.5-turbo'
  prompt_usado TEXT,
  respuesta_ia TEXT,
  tokens_usados INTEGER,
  tiempo_procesamiento_ms INTEGER,
  
  exito BOOLEAN DEFAULT true,
  error_mensaje TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_logs_ia_lead ON logs_procesamiento_ia(lead_id);
CREATE INDEX idx_logs_ia_created ON logs_procesamiento_ia(created_at DESC);

-- =====================================================
-- 6. FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compras_updated_at BEFORE UPDATE ON compras_leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para actualizar precio actual del lead cuando hay nueva puja
CREATE OR REPLACE FUNCTION actualizar_precio_lead()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE leads 
    SET precio_actual = NEW.monto
    WHERE id = NEW.lead_id 
    AND (precio_actual IS NULL OR NEW.monto > precio_actual);
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_actualizar_precio_lead 
AFTER INSERT ON pujas
FOR EACH ROW EXECUTE FUNCTION actualizar_precio_lead();

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE pujas ENABLE ROW LEVEL SECURITY;
ALTER TABLE compras_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE visualizaciones_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_procesamiento_ia ENABLE ROW LEVEL SECURITY;

-- Políticas para LEADS
-- Super admins pueden ver todo
CREATE POLICY "Super admins pueden ver todos los leads"
  ON leads FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.rol = 'super_admin'
    )
  );

-- Despachos solo ven leads procesados (resumen IA, sin datos personales)
CREATE POLICY "Despachos ven leads procesados"
  ON leads FOR SELECT
  TO authenticated
  USING (
    estado IN ('procesado', 'en_subasta') 
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.rol IN ('despacho_admin', 'usuario')
    )
  );

-- Compradores ven datos completos de sus leads comprados
CREATE POLICY "Compradores ven sus leads completos"
  ON leads FOR SELECT
  TO authenticated
  USING (
    comprador_id = auth.uid()
  );

-- Solo super admins pueden insertar leads
CREATE POLICY "Solo admins crean leads"
  ON leads FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.rol = 'super_admin'
    )
  );

-- Políticas para PUJAS
CREATE POLICY "Usuarios ven sus propias pujas"
  ON pujas FOR SELECT
  TO authenticated
  USING (despacho_id = auth.uid());

CREATE POLICY "Usuarios pueden crear pujas"
  ON pujas FOR INSERT
  TO authenticated
  WITH CHECK (despacho_id = auth.uid());

-- Políticas para COMPRAS
CREATE POLICY "Usuarios ven sus compras"
  ON compras_leads FOR SELECT
  TO authenticated
  USING (comprador_id = auth.uid());

-- Políticas para VISUALIZACIONES
CREATE POLICY "Usuarios ven sus visualizaciones"
  ON visualizaciones_leads FOR SELECT
  TO authenticated
  USING (despacho_id = auth.uid());

CREATE POLICY "Usuarios registran visualizaciones"
  ON visualizaciones_leads FOR INSERT
  TO authenticated
  WITH CHECK (despacho_id = auth.uid());

-- =====================================================
-- 8. DATOS DE EJEMPLO (OPCIONAL - COMENTADO)
-- =====================================================
/*
-- Insertar un lead de ejemplo
INSERT INTO leads (
  nombre, correo, telefono, cuerpo_mensaje,
  url_pagina, titulo_post, especialidad, provincia,
  resumen_ia, precio_estimado, estado, puntuacion_calidad
) VALUES (
  'Juan Pérez', 'juan@ejemplo.com', '600123456',
  'Necesito asesoramiento urgente sobre un despido improcedente...',
  'https://lexhoy.com/despido-improcedente',
  'Guía sobre Despidos Improcedentes 2024',
  'Laboral', 'Madrid',
  'Cliente busca asesoramiento sobre despido improcedente. Caso urgente con documentación disponible. Ubicación: Madrid.',
  75.00, 'procesado', 85
);
*/

-- =====================================================
-- FIN DEL SCHEMA
-- =====================================================
