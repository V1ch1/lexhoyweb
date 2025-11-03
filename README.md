# Lexhoy Portal - Área Personal para Despachos de Abogados

🚀 **Deploy Automático Configurado** - Cada push despliega automáticamente en Vercel

## 📋 Descripción del Proyecto

**Lexhoy Portal** es una aplicación web que permite a los despachos de abogados acceder a un área personal donde pueden gestionar su perfil, acceder a servicios del portal Lexhoy.com y administrar leads generados por lectores que buscan servicios legales.

Este proyecto es una extensión del ecosistema Lexhoy.com, que actualmente incluye:
- Portal de noticias jurídicas 
- Buscador de despachos de abogados con más de 10.000 registros
- Base de datos integrada con WordPress y Algolia

## 🎯 Objetivos Principales

### 1. Portal de Servicios
- **Quiénes Somos**: Información corporativa sobre Lexhoy.com
- **Carta de Servicios**: Descripción detallada de todos los servicios que ofrece el portal
- **Propuesta de Valor**: Beneficios para despachos de abogados

### 2. Gestión de Perfil del Despacho
- **Alta de Despacho**: Registro de nuevos despachos en la plataforma
- **Modificación de Datos**: Actualización de información del despacho
- **Sincronización**: Integración bidireccional con Algolia y WordPress
- **Validación**: Sistema de verificación de datos

### 3. Sistema de Leads
- **Visualización de Leads**: Dashboard con leads generados por lectores
- **Gestión de Contactos**: Herramientas para contactar con potenciales clientes
- **Seguimiento**: Estado y historial de leads
- **Notificaciones**: Alertas de nuevos leads disponibles

## 🏗️ Arquitectura Técnica

### Frontend
- **Framework**: Next.js 15 con App Router
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Componentes**: React 19
- **SEO**: Next-SEO

### Integraciones
- **Base de Datos Principal**: Algolia (10.000+ despachos)
- **CMS**: WordPress (sincronización bidireccional)
- **Autenticación**: Sistema personalizado para despachos
- **APIs**: RESTful y/o GraphQL según necesidades

### Flujo de Datos
```
WordPress ↔ Algolia ↔ Lexhoy Portal
     ↑                      ↓
Lectores/Leads ←→ Sistema de Leads
```

## 📱 Funcionalidades Detalladas

### Área de Autenticación
- **Login**: Acceso seguro para despachos registrados
- **Registro**: Proceso de alta para nuevos despachos
- **Recuperación**: Sistema de restablecimiento de contraseñas
- **Verificación**: Validación de email y datos del despacho

### Dashboard Principal
- **Resumen**: Métricas principales del despacho
- **Navegación**: Acceso rápido a todas las secciones
- **Notificaciones**: Alertas y comunicaciones importantes
- **Perfil**: Vista rápida de datos del despacho

### Portal Informativo
- **Página de Inicio**: Presentación de Lexhoy.com
- **Sobre Nosotros**: Historia, misión y equipo
- **Servicios**: 
  - Portal de noticias jurídicas
  - Buscador de despachos
  - Generación de leads
  - Marketing digital legal
- **Contacto**: Formularios y datos de contacto

### Gestión de Perfil
- **Datos Básicos**:
  - Nombre del despacho
  - Dirección completa
  - Teléfonos y emails
  - Sitio web y redes sociales
- **Especialidades Jurídicas**:
  - Áreas de práctica
  - Certificaciones
  - Experiencia
- **Información Comercial**:
  - Horarios de atención
  - Idiomas
  - Formas de pago
- **Multimedia**:
  - Logo del despacho
  - Imágenes de oficinas
  - Videos de presentación

### Sistema de Leads
- **Dashboard de Leads** ✅:
  - Lista de leads con datos reales
  - Filtros por ubicación, especialidad, urgencia  
  - Estados: nuevo, contactado, cerrado
  - Métricas de valor estimado
- **Gestión Multi-sede** ✅:
  - Soporte para múltiples oficinas por despacho
  - Verificación independiente por sede
  - Horarios y contacto específico
  - Redes sociales por sede
- **Backend Completo** ✅:
  - Base de datos Supabase PostgreSQL
  - TypeScript con tipos seguros
  - API de servicios (DespachoService)
  - Estructura compatible con Algolia
- **Dashboard de Ejemplo**:
  - `/dashboard/ejemplo` - Demo con datos de muestra
  - Diseño responsive con Tailwind CSS
  - Componentes de leads y sedes
  - Estados y métricas en tiempo real

## 🔗 Integraciones Técnicas

### Algolia
- **Búsqueda**: Indexación de despachos para búsqueda rápida
- **Filtros**: Múltiples criterios de filtrado
- **Geolocalización**: Búsqueda por proximidad
- **Actualización**: Sync en tiempo real

### WordPress
- **API REST**: Comunicación bidireccional
- **Custom Post Types**: Estructura de datos de despachos
- **ACF**: Campos personalizados avanzados
- **Webhooks**: Notificaciones de cambios

### Sistema de Leads
- **Origen**: Formularios en Lexhoy.com
- **Distribución**: Algoritmo de asignación a despachos
- **Notificaciones**: Email y push notifications
- **CRM**: Integración con sistemas externos (futuro)

## 🚀 Fases de Desarrollo

### Fase 1: Fundación (4-6 semanas)
- Configuración del proyecto Next.js
- Sistema de autenticación básico
- Portal informativo estático
- Diseño y componentes base

### Fase 2: Integración (3-4 semanas)
- Conexión con Algolia
- Sincronización con WordPress
- Gestión de perfil básica
- Dashboard principal

### Fase 3: Leads (4-5 semanas)
- Sistema de leads básico
- Dashboard de leads
- Herramientas de contacto
- Notificaciones

### Fase 4: Optimización (2-3 semanas)
- Mejoras de UX/UI
- Optimización de rendimiento
- Testing y QA
- Documentación final

## 📊 Métricas de Éxito

### KPIs del Portal
- Número de despachos registrados
- Tiempo de permanencia en el portal
- Uso de funcionalidades principales
- Satisfacción del usuario (NPS)

### KPIs del Sistema de Leads
- Número de leads distribuidos
- Tasa de respuesta de despachos
- Tiempo promedio de primera respuesta
- Conversión de leads a clientes

### KPIs Técnicos
- Tiempo de carga < 3 segundos
- Uptime > 99.5%
- Errores < 0.1%
- SEO Score > 90

## 🛠️ Stack Tecnológico

### Frontend
- Next.js 15.1.6
- React 19
- TypeScript 5+
- Tailwind CSS 3.4+
- Heroicons
- Next-SEO

### Backend/APIs
- **Supabase PostgreSQL** (principal) - Base de datos completa
- **Next.js API Routes** - Endpoints personalizados
- **Algolia Search API** - Búsqueda de despachos (10.000+ registros)
- **WordPress REST API** - Integración de contenido
- **Vercel Functions** - Funciones serverless

### Base de Datos
- **Supabase** (principal) - PostgreSQL con RLS y triggers
- **Algolia** (búsqueda) - Índice de despachos multi-sede  
- **WordPress MySQL** (contenido) - Sincronización opcional
- **Vercel KV** (cache) - Sesiones y datos temporales

#### Estructura Supabase
```sql
-- Tablas principales
despachos     -> Información de bufetes
sedes         -> Oficinas múltiples por despacho  
leads         -> Consultas de clientes
users         -> Autenticación de usuarios
interactions  -> Seguimiento de leads
```

**🔧 Configuración completa:** Ver `docs/SUPABASE_SETUP.md`

### Deploy & Hosting
- Vercel (frontend)
- Cloudflare (CDN)
- GitHub (control de versiones)

## 🚀 Getting Started

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Construir para producción
npm run build

# Ejecutar en producción
npm start
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

## 📚 Documentación

La documentación completa del proyecto está organizada en la carpeta `docs/`:

- **[Índice de Documentación](docs/README.md)** - Guía completa de toda la documentación
- **[Contexto del Proyecto](docs/CONTEXTO_PROYECTO.md)** - Arquitectura y decisiones técnicas
- **[Esquema de Base de Datos](docs/DATABASE_SCHEMA.md)** - Tablas, relaciones y políticas RLS

### 📊 Análisis y Mejoras
- **[Análisis Completo](docs/analisis/ANALISIS_PROYECTO_COMPLETO.md)** - Auditoría del proyecto
- **[Plan de Tareas](docs/fases/TAREAS_MEJORA.md)** - Roadmap de mejoras (67% completado)

### 🚀 Implementación
- **[Flujo de Despachos](docs/implementacion/FLUJO_COMPLETO_DESPACHOS.md)** - Sistema completo de gestión
- **[Resumen de Estado](docs/implementacion/RESUMEN.md)** - Estado actual del proyecto

---

## 📞 Contacto Técnico

Para consultas sobre desarrollo e implementación:
- **Repositorio**: lexhoyweb
- **Rama Principal**: master
- **Propietario**: V1ch1

---

**Última actualización:** 3 de noviembre de 2025  
*Documentación organizada y actualizada*
