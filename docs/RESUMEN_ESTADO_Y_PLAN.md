# 📊 RESUMEN DEL PROYECTO Y PLAN DE ACCIÓN

**Fecha**: 10 de noviembre de 2025  
**Proyecto**: LexHoy Portal (despachos.lexhoy.com)

---

## 🎯 RESUMEN EJECUTIVO

### El Proyecto
- **lexhoy.com**: Portal WordPress de noticias jurídicas con +10,000 despachos en Algolia
- **despachos.lexhoy.com**: Portal Next.js donde los despachos gestionan sus datos
- **Objetivo**: Establecer despachos.lexhoy.com como **fuente única de verdad**

### Arquitectura Actual
```
WordPress (lexhoy.com) ←→ Next.js (despachos.lexhoy.com) ←→ Algolia
                              ↓
                          Supabase (PostgreSQL)
```

---

## ✅ ESTADO ACTUAL - LO QUE FUNCIONA

### 1. Sistema de Usuarios Completo
- Registro y autenticación con Supabase ✅
- Roles: super_admin, despacho_admin, usuario ✅
- Aprobación de usuarios ✅
- Notificaciones en campana ✅

### 2. Gestión de Despachos Completa
- **Importación desde WordPress** ✅
- **CRUD de despachos** ✅
- **CRUD de sedes (múltiples por despacho)** ✅
- **Solicitud de propiedad** ✅
- **Aprobación/rechazo por admin** ✅

### 3. Sincronización Bidireccional WordPress
- **WordPress → Next.js**: `/api/sync-despacho` ✅
- **Next.js → WordPress**: `SyncService.enviarDespachoAWordPress()` ✅
- **Importación de sedes** ✅

### 4. Servicios Implementados
```
lib/
├── userService.ts ✅
├── despachoService.ts ✅
├── sedeService.ts ✅
├── syncService.ts ✅
├── notificationService.ts ✅
└── emailService.ts ✅
```

---

## ❌ LO QUE FALTA - PRIORIDADES

### 🔴 PRIORIDAD MÁXIMA

#### 1. Sincronización con Algolia
**Estado**: No implementado  
**Impacto**: CRÍTICO - Algolia es el buscador de lexhoy.com

**Tareas**:
- Crear `lib/algoliaService.ts`
- Sincronizar al crear/actualizar despachos
- Sincronizar al eliminar despachos
- Cola de reintentos para fallos

**Variables necesarias**:
```env
NEXT_PUBLIC_ALGOLIA_APP_ID=
NEXT_PUBLIC_ALGOLIA_SEARCH_KEY=
ALGOLIA_ADMIN_KEY=
```

#### 2. Sistema de Leads con IA
**Estado**: No implementado  
**Impacto**: CRÍTICO - Funcionalidad principal del negocio

**Flujo completo**:
1. Usuario llena formulario en lexhoy.com
2. Se captura en despachos.lexhoy.com
3. IA (OpenAI) procesa y anonimiza
4. Super admin revisa y aprueba precio
5. Se publica en marketplace
6. Despachos compran leads
7. Se revelan datos tras compra

**Componentes necesarios**:
- Tabla `leads_marketplace` en Supabase
- Tabla `leads_compras` en Supabase
- `lib/leadAIService.ts` (OpenAI)
- `/api/leads/capturar` (recibir formularios)
- `/admin/leads/pendientes` (aprobar leads)
- `/dashboard/leads/marketplace` (comprar leads)
- `/dashboard/leads/comprados` (ver leads comprados)

---

## 📋 PLAN DE IMPLEMENTACIÓN

### FASE 1: SINCRONIZACIÓN ALGOLIA (1-2 semanas)

#### Semana 1
- [ ] **Día 1-2**: Crear `lib/algoliaService.ts`
  - Método `sincronizarDespacho()`
  - Método `eliminarDespacho()`
  - Método `sincronizarTodos()`

- [ ] **Día 3-4**: Integrar en flujo de despachos
  - Modificar `/api/despachos/[id]/route.ts`
  - Añadir sincronización tras crear/actualizar
  - Añadir campo `sincronizado_algolia` en BD

- [ ] **Día 5**: Cola de sincronización
  - Crear tabla `sync_queue`
  - Implementar `lib/syncQueue.ts`
  - Endpoint para procesar cola

#### Semana 2
- [ ] **Día 1-2**: Panel de admin
  - `/admin/sincronizacion` para ver estado
  - Forzar sincronización manual
  - Ver logs de errores

- [ ] **Día 3-5**: Testing y ajustes
  - Probar sincronización completa
  - Verificar datos en Algolia
  - Documentar proceso

---

### FASE 2: SISTEMA DE LEADS (3-4 semanas)

#### Semana 1: Base de Datos y IA
- [ ] **Día 1**: Crear tablas
  - `leads_marketplace`
  - `leads_compras`
  - `leads_interacciones`

- [ ] **Día 2-3**: Servicio de IA
  - Crear `lib/leadAIService.ts`
  - Integrar OpenAI API
  - Método `procesarLead()`
  - Método `validarAnonimizacion()`

- [ ] **Día 4-5**: API de captura
  - `/api/leads/capturar`
  - Validaciones
  - Procesamiento con IA
  - Notificaciones

#### Semana 2: Panel de Admin
- [ ] **Día 1-3**: Interfaz de aprobación
  - `/admin/leads/pendientes`
  - Ver resumen anónimo
  - Editar precio
  - Aprobar/rechazar

- [ ] **Día 4-5**: APIs de admin
  - `/api/admin/leads/aprobar`
  - `/api/admin/leads/rechazar`
  - Notificaciones

#### Semana 3: Marketplace
- [ ] **Día 1-3**: Interfaz de marketplace
  - `/dashboard/leads/marketplace`
  - Listado de leads publicados
  - Filtros (especialidad, provincia, precio)
  - Vista de detalle

- [ ] **Día 4-5**: Sistema de compra
  - `/api/leads/comprar`
  - Validaciones
  - Registro de compra
  - Revelación de datos

#### Semana 4: Gestión de Comprados
- [ ] **Día 1-2**: Interfaz de comprados
  - `/dashboard/leads/comprados`
  - Ver datos completos del cliente
  - Registrar interacciones

- [ ] **Día 3-5**: Testing completo
  - Probar flujo end-to-end
  - Ajustes y mejoras
  - Documentación

---

## 🗂️ ESTRUCTURA DE ARCHIVOS A CREAR

### Nuevos Servicios
```
lib/
├── algoliaService.ts      ⚠️ CREAR
├── leadAIService.ts       ⚠️ CREAR
├── leadService.ts         ⚠️ CREAR
├── syncQueue.ts           ⚠️ CREAR
└── paymentService.ts      ⚠️ CREAR (futuro)
```

### Nuevas Migraciones
```
supabase/migrations/
├── create_sync_queue.sql              ⚠️ CREAR
├── create_leads_marketplace.sql       ⚠️ CREAR
├── create_leads_compras.sql           ⚠️ CREAR
└── create_leads_interacciones.sql     ⚠️ CREAR
```

### Nuevas APIs
```
app/api/
├── leads/
│   ├── capturar/route.ts              ⚠️ CREAR
│   ├── marketplace/route.ts           ⚠️ CREAR
│   └── comprar/route.ts               ⚠️ CREAR
├── admin/
│   ├── leads/
│   │   ├── aprobar/route.ts           ⚠️ CREAR
│   │   └── rechazar/route.ts          ⚠️ CREAR
│   └── sync-stats/route.ts            ⚠️ CREAR
└── despachos/
    └── [id]/sync/route.ts             ⚠️ CREAR
```

### Nuevas Páginas
```
app/
├── admin/
│   ├── leads/
│   │   └── pendientes/page.tsx        ⚠️ CREAR
│   └── sincronizacion/page.tsx        ⚠️ CREAR
└── dashboard/
    └── leads/
        ├── marketplace/page.tsx       ⚠️ CREAR
        └── comprados/page.tsx         ⚠️ CREAR
```

---

## 🔧 VARIABLES DE ENTORNO NECESARIAS

### Actuales (ya configuradas)
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=✅
NEXT_PUBLIC_SUPABASE_ANON_KEY=✅
SUPABASE_SERVICE_ROLE_KEY=✅

# WordPress
WORDPRESS_API_URL=✅
WORDPRESS_USERNAME=✅
WORDPRESS_APPLICATION_PASSWORD=✅

# Email
RESEND_API_KEY=✅
```

### Nuevas (a configurar)
```env
# Algolia
NEXT_PUBLIC_ALGOLIA_APP_ID=⚠️ FALTA
NEXT_PUBLIC_ALGOLIA_SEARCH_KEY=⚠️ FALTA
ALGOLIA_ADMIN_KEY=⚠️ FALTA

# OpenAI
OPENAI_API_KEY=⚠️ FALTA

# Pagos (futuro)
STRIPE_SECRET_KEY=⚠️ FUTURO
STRIPE_WEBHOOK_SECRET=⚠️ FUTURO
```

---

## 📊 ESQUEMA DE BASE DE DATOS

### Tablas Existentes ✅
- `users`
- `despachos`
- `sedes`
- `user_despachos`
- `despacho_ownership_requests`
- `notificaciones`

### Tablas a Crear ⚠️
- `sync_queue` - Cola de sincronización
- `leads_marketplace` - Leads para vender
- `leads_compras` - Registro de compras
- `leads_interacciones` - Seguimiento de leads

---

## 🎯 PRÓXIMOS PASOS INMEDIATOS

### Esta Semana
1. **Configurar credenciales de Algolia** en `.env.local`
2. **Crear `lib/algoliaService.ts`** con métodos básicos
3. **Integrar sincronización** en endpoints de despachos
4. **Probar sincronización** con despacho de prueba

### Próxima Semana
1. **Crear tablas de leads** en Supabase
2. **Configurar OpenAI API Key**
3. **Implementar `lib/leadAIService.ts`**
4. **Crear endpoint de captura** `/api/leads/capturar`

---

## 📝 NOTAS IMPORTANTES

### Fuente Única de Verdad
- **despachos.lexhoy.com (Supabase)** es la fuente principal
- WordPress y Algolia se sincronizan DESDE Next.js
- Cualquier cambio se hace en Next.js y se propaga

### Sistema de Leads
- Los formularios de lexhoy.com envían a `/api/leads/capturar`
- IA procesa y anonimiza automáticamente
- Super admin revisa antes de publicar
- Despachos solo ven datos tras comprar

### Sincronización
- Bidireccional con WordPress ✅
- Unidireccional a Algolia ⚠️ (pendiente)
- Cola de reintentos para fallos
- Logs de auditoría

---

## 🚨 RIESGOS Y CONSIDERACIONES

### Técnicos
- **Algolia**: Límites de API, costos por operación
- **OpenAI**: Costos por token, latencia en respuestas
- **Sincronización**: Posibles conflictos de datos

### Negocio
- **Privacidad**: Asegurar anonimización correcta
- **Precios**: Validar precios sugeridos por IA
- **Pagos**: Integrar sistema de pagos seguro

### Operacionales
- **Monitoreo**: Dashboard de sincronización
- **Alertas**: Notificar fallos críticos
- **Backups**: Estrategia de respaldo de datos

---

**Última actualización**: 10 de noviembre de 2025
