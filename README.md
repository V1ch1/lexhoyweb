# 🏛️ LexHoy - Portal de Despachos de Abogados

> **Sistema completo de gestión de despachos jurídicos con sincronización multi-plataforma**  
> Next.js 15 · Supabase · WordPress · Algolia

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green?logo=supabase)](https://supabase.com/)
[![Deploy](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com/)

---

## 📋 Descripción

**LexHoy** es una plataforma integral para la gestión de despachos de abogados que permite:

- 🏢 **Gestión completa de despachos** (CRUD con múltiples sedes)
- 🔄 **Sincronización automática** entre Next.js, WordPress y Algolia
- 👥 **Sistema de usuarios** con roles y permisos
- 📢 **Notificaciones en tiempo real**
- 🔍 **Buscador inteligente** con más de 14,000 despachos indexados
- 📊 **Dashboard administrativo** con estadísticas

---

## 🏗️ Arquitectura

```
┌─────────────────┐      ┌──────────────┐      ┌─────────────┐
│   Next.js 15    │◄────►│   Supabase   │◄────►│  WordPress  │
│  (Frontend +    │      │  (Database + │      │   (CMS +    │
│   API Routes)   │      │   Storage)   │      │   Plugin)   │
└─────────────────┘      └──────────────┘      └─────────────┘
         │                                              │
         │                                              │
         └──────────────────┬───────────────────────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │     Algolia     │
                   │  (Search Index) │
                   └─────────────────┘
```

### Stack Tecnológico

**Frontend & Backend**

- **Framework**: Next.js 15.5.4 (App Router)
- **Lenguaje**: TypeScript 5.0
- **Estilos**: Tailwind CSS 3.4
- **UI**: React 19.0

**Base de Datos & Storage**

- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage (imágenes WebP)
- **Auth**: Supabase Auth

**Integraciones**

- **CMS**: WordPress 6.x + Plugin personalizado
- **Search**: Algolia (índice `despachos`)
- **Email**: Resend API
- **Deployment**: Vercel

---

## 🚀 Características Principales

### 🏢 Gestión de Despachos

- ✅ **CRUD Completo**
  - `GET /api/despachos/[id]` - Obtener despacho específico
  - `POST /api/crear-despacho` - Crear nuevo despacho
  - `PUT /api/despachos/[id]` - Actualizar despacho completo
  - `DELETE /api/despachos/[id]` - Eliminar despacho (super_admin)

- 🏢 **Gestión de Sedes**
  - CRUD completo de sedes por despacho
  - Sede principal obligatoria
  - Múltiples ubicaciones por despacho

- 🔄 **Sincronización Automática**
  - Next.js → Supabase ✅
  - Supabase → WordPress ✅
  - WordPress → Algolia ✅

### 👥 Sistema de Usuarios

- **Roles**: `super_admin`, `despacho_admin`, `despacho_user`
- **Permisos**: Asignación de despachos, solicitudes, aprobaciones
- **Notificaciones**: Sistema de alertas en tiempo real

### 🔍 Buscador de Despachos

- 🔎 Búsqueda unificada: Supabase + WordPress + Algolia
- 🏷️ Filtros avanzados: Provincia, localidad, especialidad
- 📊 **14,038 despachos** indexados
- ⚡ Resultados instantáneos con Algolia

---

## 📁 Estructura del Proyecto

```
lexhoyweb/
├── app/
│   ├── api/                    # API Routes
│   │   ├── crear-despacho/     # Crear despacho
│   │   ├── despachos/[id]/     # GET, PUT, DELETE despacho
│   │   ├── users/              # Gestión usuarios
│   │   └── admin/              # Endpoints admin
│   ├── dashboard/              # Páginas dashboard
│   └── auth/                   # Login, registro
├── components/
│   ├── despachos/              # Componentes despachos
│   └── ui/                     # Componentes base
├── lib/
│   ├── supabase.ts             # Cliente Supabase
│   ├── syncService.ts          # Sincronización
│   └── imageOptimizer.ts       # Optimización imágenes
├── docs/                       # Documentación técnica
└── scripts/                    # Scripts utilidad

LexHoy-Despachos/              # Plugin WordPress
├── includes/
│   ├── class-lexhoy-despachos-cpt.php
│   └── class-lexhoy-sedes-manager.php
└── admin/
```

---

## 🔧 Instalación

### 1. Clonar e Instalar

```bash
git clone https://github.com/V1ch1/LexHoy-Despachos.git
cd LexHoy-Despachos/lexhoyweb
npm install
```

### 2. Configurar Variables de Entorno

Crear `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

# WordPress
WORDPRESS_URL=https://lexhoy.com
WORDPRESS_USERNAME=tu-usuario
WORDPRESS_APPLICATION_PASSWORD=tu-app-password

# Resend
RESEND_API_KEY=tu-resend-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Ejecutar

```bash
npm run dev
# Abre http://localhost:3000
```

---

## 📚 Documentación

| Documento                                     | Descripción             |
| --------------------------------------------- | ----------------------- |
| [API.md](docs/API.md)                         | Referencia de endpoints |
| [DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) | Esquema de BD           |
| [DEPLOYMENT.md](DEPLOYMENT.md)                | Guía de deployment      |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md)      | Solución de problemas   |

---

## 🐛 Problemas Resueltos Recientemente

### ✅ Datos Serializados en Algolia (Nov 2025)

Limpieza de 12,038 despachos con campos serializados

### ✅ Despachos Fantasma (Nov 2025)

Filtrado de asignaciones huérfanas en API

### ✅ Validación de Nombre (Nov 2025)

Campo nombre ahora obligatorio en creación

---

## 📦 Deployment

### Vercel (Recomendado)

```bash
vercel link
vercel env add NEXT_PUBLIC_SUPABASE_URL
# ... configurar resto de variables
vercel --prod
```

Ver [DEPLOYMENT.md](DEPLOYMENT.md) para guía completa.

---

## 📝 Changelog

### v1.2.0 (Nov 2025)

- ✅ Endpoints GET/PUT para `/api/despachos/[id]`
- ✅ Limpieza de archivos temporales
- ✅ Filtrado de despachos fantasma
- ✅ Validación nombre obligatorio

### v1.1.0 (Nov 2025)

- ✅ Fix datos serializados en Algolia
- ✅ Sistema sincronización mejorado
- ✅ Limpieza registros grandes

---

## 📄 Licencia

Propietario - LexHoy.com © 2025

---

## 👨‍💻 Contacto

**LexHoy Development Team**

- 🌐 [lexhoy.com](https://lexhoy.com)
- 📧 contacto@lexhoy.com

---

**¿Problemas?** Consulta [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
