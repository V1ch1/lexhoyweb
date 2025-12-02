# Módulo de Marketing

**Versión:** 1.0  
**Última actualización:** 2025-12-02  
**Estado:** ⚠️ Estructura Básica (20%)

---

## 📋 Índice

1. [Visión General](#visión-general)
2. [Funcionalidades Planificadas](#funcionalidades-planificadas)
3. [Estructura Actual](#estructura-actual)
4. [Roadmap](#roadmap)

---

## 🎯 Visión General

El módulo de marketing permitirá a los despachos y al equipo de LexHoy gestionar campañas, emails y analytics de marketing.

### Objetivos

- Aumentar la captación de leads
- Mejorar la conversión de leads a clientes
- Fidelizar despachos
- Medir ROI de campañas

---

## 🚀 Funcionalidades Planificadas

### 1. Campañas de Email

**Estado:** ❌ No implementado

**Descripción:**
Sistema para crear y enviar campañas de email marketing a despachos y clientes potenciales.

**Funcionalidades:**
- Crear campañas
- Diseñar emails (editor WYSIWYG)
- Segmentar audiencia
- Programar envíos
- Tracking de aperturas y clicks
- A/B testing

**Tecnologías:**
- **Email Service:** Resend / SendGrid
- **Editor:** React Email / Unlayer
- **Analytics:** Mixpanel / Amplitude

### 2. Landing Pages

**Estado:** ❌ No implementado

**Descripción:**
Constructor de landing pages para campañas específicas.

**Funcionalidades:**
- Plantillas prediseñadas
- Editor drag & drop
- Formularios personalizados
- Tracking de conversiones
- Integración con leads

**Tecnologías:**
- **Builder:** GrapesJS / Builder.io
- **Hosting:** Vercel
- **Analytics:** Google Analytics

### 3. Segmentación de Audiencia

**Estado:** ❌ No implementado

**Descripción:**
Crear segmentos de usuarios para campañas dirigidas.

**Criterios de Segmentación:**
- Rol (usuario, despacho_admin)
- Provincia
- Especialidad
- Actividad (activo, inactivo)
- Leads comprados
- Tasa de conversión

### 4. Analytics de Marketing

**Estado:** ❌ No implementado

**Descripción:**
Dashboard de métricas de marketing.

**Métricas:**
- Tráfico web
- Conversiones
- ROI de campañas
- Coste por lead
- Lifetime value
- Tasa de retención

### 5. Automatizaciones

**Estado:** ❌ No implementado

**Descripción:**
Flujos automáticos de marketing.

**Ejemplos:**
- Email de bienvenida al registrarse
- Recordatorio si no completa perfil
- Notificación de nuevos leads
- Reactivación de usuarios inactivos
- Upsell a plan premium

---

## 📁 Estructura Actual

### Ubicación

`/dashboard/marketing`

### Páginas Existentes

```
/dashboard/marketing
├── / (Dashboard principal)
├── /campanas (Placeholder)
├── /emails (Placeholder)
├── /landing-pages (Placeholder)
└── /analytics (Placeholder)
```

### Código Actual

```typescript
// app/dashboard/marketing/page.tsx
export default function MarketingPage() {
  return (
    <div>
      <h1>Marketing Dashboard</h1>
      <p>Módulo en desarrollo</p>
      
      <div className="grid grid-cols-3 gap-4">
        <Card title="Campañas" link="/dashboard/marketing/campanas" />
        <Card title="Emails" link="/dashboard/marketing/emails" />
        <Card title="Analytics" link="/dashboard/marketing/analytics" />
      </div>
    </div>
  );
}
```

---

## 🗺️ Roadmap

### Fase 1: Email Marketing (4-6 semanas)

- [ ] Integrar servicio de email (Resend)
- [ ] Crear plantillas de email
- [ ] Sistema de listas de contactos
- [ ] Envío de campañas
- [ ] Tracking básico

### Fase 2: Segmentación (2-3 semanas)

- [ ] Crear segmentos
- [ ] Filtros avanzados
- [ ] Guardar segmentos
- [ ] Aplicar a campañas

### Fase 3: Analytics (3-4 semanas)

- [ ] Dashboard de métricas
- [ ] Gráficos interactivos
- [ ] Reportes exportables
- [ ] Integración con Google Analytics

### Fase 4: Automatizaciones (4-6 semanas)

- [ ] Builder de flujos
- [ ] Triggers automáticos
- [ ] Condiciones y ramas
- [ ] Testing de flujos

### Fase 5: Landing Pages (6-8 semanas)

- [ ] Integrar page builder
- [ ] Plantillas
- [ ] Formularios
- [ ] Tracking de conversiones

---

## 🧩 Componentes Planificados

### `CampaignBuilder.tsx`

**Descripción:** Constructor de campañas de email

**Props:**
```typescript
interface CampaignBuilderProps {
  campaign?: Campaign;
  onSave: (campaign: Campaign) => void;
}
```

### `EmailEditor.tsx`

**Descripción:** Editor WYSIWYG de emails

**Props:**
```typescript
interface EmailEditorProps {
  template?: EmailTemplate;
  onChange: (html: string) => void;
}
```

### `SegmentBuilder.tsx`

**Descripción:** Constructor de segmentos de audiencia

**Props:**
```typescript
interface SegmentBuilderProps {
  segment?: Segment;
  onSave: (segment: Segment) => void;
}
```

### `MarketingAnalytics.tsx`

**Descripción:** Dashboard de analytics

**Props:**
```typescript
interface MarketingAnalyticsProps {
  dateRange: DateRange;
  campaigns?: Campaign[];
}
```

---

## 🗄️ Base de Datos (Planificada)

### Tabla: `campaigns`

```sql
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL,                     -- email | sms | push
  estado TEXT DEFAULT 'draft',            -- draft | scheduled | sent | archived
  
  -- Contenido
  asunto TEXT,
  contenido_html TEXT,
  contenido_texto TEXT,
  
  -- Segmentación
  segmento_id UUID REFERENCES segments(id),
  
  -- Programación
  fecha_envio TIMESTAMP,
  enviado_a INTEGER DEFAULT 0,
  
  -- Métricas
  abiertos INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversiones INTEGER DEFAULT 0,
  
  -- Meta
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Tabla: `segments`

```sql
CREATE TABLE segments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  
  -- Filtros (JSONB)
  filtros JSONB NOT NULL,
  
  -- Estadísticas
  usuarios_count INTEGER DEFAULT 0,
  ultima_actualizacion TIMESTAMP,
  
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Tabla: `email_events`

```sql
CREATE TABLE email_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id),
  user_id UUID REFERENCES users(id),
  
  evento TEXT NOT NULL,                   -- sent | delivered | opened | clicked | bounced
  fecha TIMESTAMP DEFAULT NOW(),
  
  -- Metadata
  ip_address TEXT,
  user_agent TEXT,
  link_clicked TEXT
);
```

---

## 🔌 API Endpoints (Planificados)

### POST `/api/marketing/campaigns`

**Descripción:** Crea una campaña

### GET `/api/marketing/campaigns`

**Descripción:** Lista campañas

### POST `/api/marketing/campaigns/[id]/send`

**Descripción:** Envía una campaña

### GET `/api/marketing/segments`

**Descripción:** Lista segmentos

### POST `/api/marketing/segments`

**Descripción:** Crea un segmento

### GET `/api/marketing/analytics`

**Descripción:** Obtiene métricas de marketing

---

## ✅ Estado Actual

### Implementado

- [x] Estructura de navegación
- [x] Páginas placeholder

### No Implementado

- [ ] Todo lo demás

---

## 📚 Referencias

- [Resend Docs](https://resend.com/docs)
- [React Email](https://react.email/)
- [Mixpanel](https://mixpanel.com/)
- [GrapesJS](https://grapesjs.com/)

---

**Última actualización:** 2025-12-02  
**Mantenido por:** José Ramón Blanco Casal
