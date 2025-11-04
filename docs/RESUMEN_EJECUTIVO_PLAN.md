# 📊 RESUMEN EJECUTIVO - Plan de Gestión de Despachos y Sedes

> **Documento**: Resumen ejecutivo del plan de tareas  
> **Fecha**: 2025-11-04  
> **Documento completo**: Ver `PLAN_TAREAS_DESPACHOS_SEDES.md`

---

## 🎯 OBJETIVO PRINCIPAL

Implementar un sistema completo de gestión de despachos y sedes con sincronización bidireccional entre WordPress y Supabase, permitiendo a los usuarios:
1. Crear nuevos despachos cuando no los encuentran
2. Gestionar múltiples sedes de sus despachos
3. Mantener datos sincronizados automáticamente con WordPress

---

## 🏗️ ARQUITECTURA CLAVE

```
┌──────────────────────────────────────────────────────┐
│                FUENTE DE LA VERDAD                    │
│                    WordPress (CPT)                    │
└──────────────────────────────────────────────────────┘
                    ↕ (bidireccional)
┌──────────────────────────────────────────────────────┐
│              Supabase (Next.js Panel)                 │
│         - Gestión de usuarios y permisos              │
│         - Panel de administración                     │
│         - CRUD de despachos y sedes                   │
└──────────────────────────────────────────────────────┘
                    ↑ (solo lectura)
┌──────────────────────────────────────────────────────┐
│                 Algolia (Búsqueda)                    │
│         - Búsqueda rápida                             │
│         - Filtros y autocompletado                    │
│         - NUNCA para edición                          │
└──────────────────────────────────────────────────────┘
```

**Principio fundamental**: WordPress es la fuente de la verdad. Algolia solo para búsqueda.

---

## 📋 TAREAS PRIORITARIAS (Sprint 1-2)

### 1. Popup de Invitación a Crear Despacho
**Cuando**: Usuario busca despacho y no lo encuentra  
**Acción**: Mostrar modal invitando a crear el despacho  
**Archivo**: `app/dashboard/despachos/page.tsx`

### 2. Botón "Dar de Alta Mi Despacho" en Dashboard
**Ubicación**: Dashboard principal  
**Visibilidad**: Solo si usuario no tiene despachos  
**Redirección**: `/dashboard/despachos/crear`  
**Archivo**: `app/dashboard/page.tsx`

### 3. Formulario de Creación de Despacho
**Ruta**: `/dashboard/despachos/crear`  
**Campos**:
- Información básica (nombre, descripción, áreas de práctica)
- Sede principal (localidad, provincia, dirección, contacto)
- Datos adicionales (año fundación, tamaño, persona contacto)

**Flujo**:
```
Usuario completa formulario
    ↓
POST /api/crear-despacho (✅ ya existe)
    ↓
Crear en Supabase (despacho + sede principal)
    ↓
Enviar a WordPress (obtener wordpress_id)
    ↓
Marcar como sincronizado
    ↓
Redirigir a solicitud de propiedad
```

---

## 📋 TAREAS IMPORTANTES (Sprint 3-4)

### 4. Listado de Sedes del Despacho
**Ruta**: `/dashboard/despachos/[id]/sedes`  
**Funcionalidades**:
- Ver todas las sedes del despacho
- Indicar sede principal
- Botones: Ver, Editar, Eliminar
- Botón "Agregar Nueva Sede"

### 5. Crear Nueva Sede
**Ruta**: `/dashboard/despachos/[id]/sedes/crear`  
**Campos**: Mismos que sede principal  
**Endpoint**: `POST /api/despachos/[id]/sedes` (crear)

### 6. Editar Sede
**Ruta**: `/dashboard/despachos/[id]/sedes/[sedeId]/editar`  
**Endpoint**: `PUT /api/despachos/[id]/sedes/[sedeId]` (crear)

### 7. Eliminar Sede
**Restricción**: No eliminar sede principal si es la única  
**Endpoint**: `DELETE /api/despachos/[id]/sedes/[sedeId]` (crear)

---

## 🔄 SINCRONIZACIÓN BIDIRECCIONAL (Sprint 5-6)

### WordPress → Supabase (Webhook)
**Estado**: ✅ Parcialmente completado  
**Endpoint**: `/api/sync-despacho`  
**Pendiente**:
- Configurar webhook automático en WordPress
- Agregar autenticación (secret key)
- Sistema de reintentos

### Supabase → WordPress (API REST)
**Estado**: ⏳ Pendiente  
**Necesario**:
- Actualizar despacho en WordPress
- Sincronizar sedes (crear, editar, eliminar)
- Mantener array `meta._despacho_sedes` actualizado

### Resolución de Conflictos
**Estrategia**: WordPress siempre gana  
**Implementación**:
- Comparar timestamps antes de sincronizar
- Si WordPress es más reciente, sobrescribir Supabase
- Notificar usuario si se sobrescribieron cambios

---

## 📁 ARCHIVOS A CREAR

### Páginas (Frontend)
```
app/dashboard/
  ├── despachos/
  │   ├── crear/
  │   │   └── page.tsx                    ⏳ CREAR
  │   └── [id]/
  │       └── sedes/
  │           ├── page.tsx                ⏳ CREAR
  │           ├── crear/
  │           │   └── page.tsx            ⏳ CREAR
  │           └── [sedeId]/
  │               └── editar/
  │                   └── page.tsx        ⏳ CREAR
```

### Endpoints (Backend)
```
app/api/
  └── despachos/
      └── [id]/
          └── sedes/
              ├── route.ts                ⏳ CREAR (GET, POST)
              └── [sedeId]/
                  └── route.ts            ⏳ CREAR (GET, PUT, DELETE)
```

### Servicios (Lógica de Negocio)
```
lib/
  ├── syncService.ts                      ✏️ MODIFICAR
  ├── sedeService.ts                      ⏳ CREAR
  ├── queueService.ts                     ⏳ CREAR
  └── validation/
      ├── despachoSchema.ts               ⏳ CREAR
      └── sedeSchema.ts                   ⏳ CREAR
```

### Componentes (UI)
```
components/
  ├── modals/
  │   ├── NoDespachoFoundModal.tsx        ⏳ CREAR
  │   └── ConfirmDeleteSedeModal.tsx      ⏳ CREAR
  ├── forms/
  │   ├── CrearDespachoForm.tsx           ⏳ CREAR
  │   └── CrearSedeForm.tsx               ⏳ CREAR
  └── sedes/
      └── SedeCard.tsx                    ⏳ CREAR
```

---

## 🗄️ NUEVAS TABLAS EN SUPABASE

### `sync_logs` (Logs de Sincronización)
```sql
CREATE TABLE sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo TEXT NOT NULL,              -- 'despacho' | 'sede'
  accion TEXT NOT NULL,            -- 'create' | 'update' | 'delete'
  origen TEXT NOT NULL,            -- 'wordpress' | 'supabase'
  destino TEXT NOT NULL,           -- 'wordpress' | 'supabase'
  entidad_id TEXT NOT NULL,
  estado TEXT NOT NULL,            -- 'success' | 'error' | 'pending'
  error_mensaje TEXT,
  datos_enviados JSONB,
  datos_recibidos JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### `sync_queue` (Cola de Sincronización)
```sql
CREATE TABLE sync_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo TEXT NOT NULL,
  accion TEXT NOT NULL,
  entidad_id TEXT NOT NULL,
  datos JSONB NOT NULL,
  intentos INTEGER DEFAULT 0,
  max_intentos INTEGER DEFAULT 3,
  proximo_intento TIMESTAMP,
  estado TEXT DEFAULT 'pending',   -- 'pending' | 'processing' | 'completed' | 'failed'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## ⚙️ SERVICIOS A IMPLEMENTAR

### `lib/syncService.ts` (Modificar)
```typescript
class SyncService {
  // Despachos
  static async enviarDespachoAWordPress(despachoId: string)
  static async actualizarDespachoEnWordPress(despachoId: string)
  static async importarDespachoDesdeWordPress(wordpressId: number)
  
  // Sedes
  static async sincronizarSedeAWordPress(sedeId: number)
  static async eliminarSedeEnWordPress(sedeId: number)
  static async sincronizarSedesDespacho(despachoId: string)
  
  // Utilidades
  static async verificarEstadoSincronizacion(despachoId: string)
  static async resolverConflictos(despachoId: string)
}
```

### `lib/sedeService.ts` (Crear)
```typescript
class SedeService {
  // CRUD
  static async crearSede(despachoId: string, sedeData: SedeInput)
  static async obtenerSede(sedeId: number)
  static async actualizarSede(sedeId: number, sedeData: Partial<SedeInput>)
  static async eliminarSede(sedeId: number)
  
  // Listado
  static async listarSedesDespacho(despachoId: string)
  static async obtenerSedePrincipal(despachoId: string)
  
  // Validación
  static async validarSede(sedeData: SedeInput)
}
```

### `lib/queueService.ts` (Crear)
```typescript
class QueueService {
  static async agregarACola(tipo: string, accion: string, datos: any)
  static async procesarCola()
  static async reintentarFallidos()
  static async limpiarCompletados()
}
```

---

## 📅 CRONOGRAMA ESTIMADO

| Sprint | Semanas | Tareas | Prioridad |
|--------|---------|--------|-----------|
| **Sprint 1** | 1-2 | Creación de despachos (Tareas 1-3) | 🔴 ALTA |
| **Sprint 2** | 3-4 | Gestión de sedes (Tareas 4-7) | 🔴 ALTA |
| **Sprint 3** | 5-6 | Sincronización bidireccional | 🔴 ALTA |
| **Sprint 4** | 7-8 | Mejoras y optimizaciones | 🟡 MEDIA |

**Tiempo total estimado**: 8 semanas (2 meses)

---

## 🚨 RIESGOS Y CONSIDERACIONES

### Riesgos Técnicos
- ⚠️ **Conflictos de sincronización**: Ediciones simultáneas en WordPress y Supabase
- ⚠️ **Pérdida de datos**: Si falla sincronización sin sistema de cola
- ⚠️ **Performance**: Muchas sedes por despacho pueden ralentizar
- ⚠️ **Complejidad**: Mantener 3 fuentes (WordPress, Supabase, Algolia)

### Mitigaciones
- ✅ Implementar cola de sincronización con reintentos
- ✅ Sistema de logs detallado
- ✅ WordPress siempre gana en conflictos
- ✅ Paginación en listados grandes
- ✅ Validación robusta de datos

### Consideraciones de Seguridad
- ✅ Autenticar todos los endpoints de edición
- ✅ Validar permisos (solo propietario puede editar)
- ✅ Sanitizar inputs (prevenir XSS)
- ✅ Rate limiting en endpoints públicos
- ✅ Secret key para webhooks de WordPress

---

## 📊 MÉTRICAS DE ÉXITO

### Funcionalidad
- [ ] Usuario puede crear despacho desde dashboard
- [ ] Usuario puede agregar múltiples sedes
- [ ] Cambios se sincronizan automáticamente con WordPress
- [ ] Búsqueda en Algolia funciona correctamente

### Performance
- [ ] Creación de despacho < 3 segundos
- [ ] Sincronización < 5 segundos
- [ ] Búsqueda en Algolia < 500ms
- [ ] 99% de sincronizaciones exitosas

### UX
- [ ] Feedback visual en todas las operaciones
- [ ] Mensajes de error claros
- [ ] Loading states apropiados
- [ ] Confirmaciones antes de eliminar

---

## 🎯 PRÓXIMOS PASOS INMEDIATOS

### Esta Semana
1. ✅ Revisar y aprobar este plan
2. ⏳ Crear rama de desarrollo `feature/despachos-sedes`
3. ⏳ Implementar TAREA 1.1: Popup de invitación
4. ⏳ Implementar TAREA 1.2: Botón en dashboard

### Próxima Semana
1. ⏳ Implementar TAREA 1.3: Formulario de creación
2. ⏳ Testing de flujo completo de creación
3. ⏳ Comenzar TAREA 2.1: Listado de sedes

---

## 📞 CONTACTO Y SOPORTE

**Documento completo**: `docs/PLAN_TAREAS_DESPACHOS_SEDES.md`  
**Contexto del proyecto**: `docs/CONTEXTO_PROYECTO.md`  
**Arquitectura**: `docs/arquitectura/INTEGRACION_DESPACHOS.md`

---

**Última actualización**: 2025-11-04  
**Estado del plan**: ✅ Aprobado para ejecución
