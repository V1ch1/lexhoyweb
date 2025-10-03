# 📋 Flujo Completo de Gestión de Despachos

## 🎯 Visión General

Este documento describe el flujo completo de gestión de despachos en LexHoy, **priorizando el proceso de asignación de despachos a usuarios**, desde la búsqueda/creación hasta la aprobación por el super admin.

---

## 🎯 FLUJO PRINCIPAL: Asignación de Despachos a Usuarios

### Paso 1: Usuario Busca su Despacho

El usuario accede a `/dashboard/solicitar-despacho` y busca su despacho por nombre, localidad o provincia.

**El sistema verifica 3 escenarios posibles:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                  ESCENARIO A: Despacho en Next.js                    │
└─────────────────────────────────────────────────────────────────────┘

1. Buscar en tabla "despachos" de Supabase
   │
   ├─→ SI ENCUENTRA:
   │   ├─→ Mostrar información del despacho
   │   ├─→ Mostrar sedes asociadas
   │   ├─→ Verificar si ya tiene propietario
   │   │   ├─→ SI tiene: Mostrar "Despacho ya asignado"
   │   │   └─→ NO tiene: Mostrar botón "Solicitar Propiedad"
   │   │
   │   └─→ Usuario hace clic en "Solicitar Propiedad"
   │       └─→ IR A: PASO 2 (Solicitud de Propiedad)
   │
   └─→ NO ENCUENTRA:
       └─→ IR A: ESCENARIO B (Buscar en WordPress)
```

```
┌─────────────────────────────────────────────────────────────────────┐
│              ESCENARIO B: Despacho en WordPress (Importar)           │
└─────────────────────────────────────────────────────────────────────┘

1. Buscar en WordPress vía API REST
   │
   ├─→ Endpoint: GET /wp-json/wp/v2/despachos?search={nombre}
   │
   ├─→ SI ENCUENTRA:
   │   ├─→ Mostrar información del despacho de WordPress
   │   ├─→ Botón "Importar y Solicitar Propiedad"
   │   │
   │   └─→ Usuario hace clic en "Importar y Solicitar"
   │       │
   │       ├─→ IMPORTAR A NEXT.JS:
   │       │   ├─→ Crear registro en tabla "despachos"
   │       │   ├─→ Guardar object_id (ID de WordPress)
   │       │   ├─→ Copiar: nombre, descripcion, slug, areas_practica
   │       │   ├─→ Marcar sincronizado_wp = true
   │       │   ├─→ Guardar ultima_sincronizacion = NOW()
   │       │   │
   │       │   └─→ IMPORTAR SEDES:
   │       │       ├─→ Leer meta._despacho_sedes de WordPress
   │       │       ├─→ Para cada sede:
   │       │       │   ├─→ Crear registro en tabla "sedes"
   │       │       │   ├─→ Asignar despacho_id
   │       │       │   ├─→ Guardar wp_sede_id
   │       │       │   └─→ Marcar sincronizado_wp = true
   │       │       │
   │       │       └─→ Actualizar num_sedes en despacho
   │       │
   │       └─→ IR A: PASO 2 (Solicitud de Propiedad)
   │
   └─→ NO ENCUENTRA:
       └─→ IR A: ESCENARIO C (Crear Nuevo)
```

```
┌─────────────────────────────────────────────────────────────────────┐
│              ESCENARIO C: Despacho NO Existe (Crear Nuevo)           │
└─────────────────────────────────────────────────────────────────────┘

1. Mostrar mensaje "No encontramos tu despacho"
   │
   └─→ Botón "Crear Nuevo Despacho"
       │
       └─→ Usuario hace clic en "Crear Nuevo"
           │
           ├─→ MOSTRAR FORMULARIO:
           │   ├─→ Nombre del despacho (requerido)
           │   ├─→ Descripción (requerido)
           │   ├─→ Áreas de práctica (múltiple selección)
           │   ├─→ Localidad (requerido)
           │   ├─→ Provincia (requerido)
           │   ├─→ Dirección
           │   ├─→ Teléfono
           │   ├─→ Email
           │   └─→ Sitio web
           │
           └─→ Usuario completa y envía formulario
               │
               ├─→ CREAR EN NEXT.JS:
               │   ├─→ Crear registro en tabla "despachos"
               │   ├─→ Generar slug único
               │   ├─→ Marcar sincronizado_wp = false (aún no enviado)
               │   ├─→ Crear sede principal en tabla "sedes"
               │   │
               │   └─→ ENVIAR A WORDPRESS:
               │       ├─→ POST /wp-json/wp/v2/despachos
               │       ├─→ Payload:
               │       │   {
               │       │     title: nombre,
               │       │     content: descripcion,
               │       │     slug: slug_generado,
               │       │     status: "draft",
               │       │     meta: {
               │       │       _despacho_sedes: [sede_principal]
               │       │     }
               │       │   }
               │       │
               │       ├─→ SI ÉXITO:
               │       │   ├─→ Guardar object_id retornado
               │       │   ├─→ Marcar sincronizado_wp = true
               │       │   └─→ Actualizar ultima_sincronizacion
               │       │
               │       └─→ SI ERROR:
               │           ├─→ Mantener sincronizado_wp = false
               │           ├─→ Registrar error en logs
               │           └─→ Permitir continuar (se sincronizará después)
               │
               └─→ IR A: PASO 2 (Solicitud de Propiedad)
```

---

### Paso 2: Solicitud de Propiedad

Una vez que el despacho existe en Next.js (ya sea porque estaba, se importó o se creó), el usuario solicita la propiedad.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SOLICITUD DE PROPIEDAD                            │
└─────────────────────────────────────────────────────────────────────┘

1. Usuario hace clic en "Solicitar Propiedad"
   │
   ├─→ VALIDACIONES:
   │   ├─→ Verificar que el usuario está autenticado
   │   ├─→ Verificar que el despacho no tiene propietario
   │   ├─→ Verificar que no existe solicitud pendiente del mismo usuario
   │   │
   │   └─→ SI PASA VALIDACIONES:
   │       │
   │       ├─→ CREAR SOLICITUD:
   │       │   ├─→ INSERT en tabla "solicitudes_despacho"
   │       │   ├─→ Datos:
   │       │   │   {
   │       │   │     user_id: ID del usuario,
   │       │   │     user_email: email del usuario,
   │       │   │     user_name: nombre completo,
   │       │   │     despacho_id: ID del despacho,
   │       │   │     despacho_nombre: nombre del despacho,
   │       │   │     despacho_localidad: localidad,
   │       │   │     despacho_provincia: provincia,
   │       │   │     estado: "pendiente",
   │       │   │     fecha_solicitud: NOW(),
   │       │   │     mensaje: mensaje opcional del usuario
   │       │   │   }
   │       │   │
   │       │   └─→ Retornar ID de solicitud
   │       │
   │       ├─→ NOTIFICAR A SUPER ADMIN:
   │       │   ├─→ Crear notificación en tabla "notificaciones"
   │       │   │   {
   │       │   │     user_id: ID del super_admin,
   │       │   │     tipo: "solicitud_despacho",
   │       │   │     titulo: "Nueva solicitud de despacho",
   │       │   │     mensaje: "{usuario} solicita {despacho}",
   │       │   │     link: "/admin/users?tab=solicitudes",
   │       │   │     leida: false
   │       │   │   }
   │       │   │
   │       │   └─→ Enviar email al super_admin
   │       │       ├─→ Asunto: "Nueva solicitud de despacho"
   │       │       ├─→ Template: solicitud-despacho-admin.html
   │       │       └─→ Incluir: datos usuario, datos despacho, link
   │       │
   │       ├─→ NOTIFICAR AL USUARIO:
   │       │   └─→ Mostrar mensaje: "Solicitud enviada correctamente"
   │       │
   │       └─→ REDIRIGIR:
   │           └─→ /dashboard con mensaje de éxito
```

---

### Paso 3: Aprobación o Rechazo por Super Admin

El super admin recibe la notificación y revisa la solicitud.

```
┌─────────────────────────────────────────────────────────────────────┐
│                  REVISIÓN POR SUPER ADMIN                            │
└─────────────────────────────────────────────────────────────────────┘

1. Super admin accede a /admin/users?tab=solicitudes
   │
   ├─→ Ver listado de solicitudes pendientes
   ├─→ Filtrar por estado (pendiente, aprobado, rechazado)
   ├─→ Ver detalles de cada solicitud:
   │   ├─→ Datos del usuario solicitante
   │   ├─→ Datos del despacho
   │   ├─→ Fecha de solicitud
   │   └─→ Mensaje del usuario (si existe)
   │
   └─→ Para cada solicitud, puede:
       ├─→ APROBAR
       └─→ RECHAZAR
```

```
┌─────────────────────────────────────────────────────────────────────┐
│                    OPCIÓN A: APROBAR SOLICITUD                       │
└─────────────────────────────────────────────────────────────────────┘

1. Super admin hace clic en "Aprobar"
   │
   ├─→ Endpoint: POST /api/aprobar-solicitud
   │   {
   │     solicitudId: ID de la solicitud,
   │     notas: "Notas del admin (opcional)"
   │   }
   │
   ├─→ PROCESO EN EL BACKEND:
   │   │
   │   ├─→ VERIFICAR PERMISOS:
   │   │   └─→ Solo super_admin puede aprobar
   │   │
   │   ├─→ OBTENER DATOS DE LA SOLICITUD:
   │   │   ├─→ user_id
   │   │   └─→ despacho_id
   │   │
   │   ├─→ CREAR RELACIÓN USER_DESPACHOS:
   │   │   ├─→ INSERT en tabla "user_despachos"
   │   │   ├─→ Datos:
   │   │   │   {
   │   │   │     user_id: ID del usuario,
   │   │   │     despacho_id: ID del despacho,
   │   │   │     rol_despacho: "propietario",
   │   │   │     fecha_asignacion: NOW(),
   │   │   │     activo: true
   │   │   │   }
   │   │   │
   │   │   └─→ CONSTRAINT: UNIQUE(user_id, despacho_id)
   │   │       (evita duplicados)
   │   │
   │   ├─→ ACTUALIZAR SOLICITUD:
   │   │   ├─→ UPDATE tabla "solicitudes_despacho"
   │   │   ├─→ SET:
   │   │   │   {
   │   │   │     estado: "aprobado",
   │   │   │     fecha_respuesta: NOW(),
   │   │   │     respondido_por: ID del super_admin,
   │   │   │     notas_respuesta: notas del admin
   │   │   │   }
   │   │   │
   │   │   └─→ WHERE id = solicitudId
   │   │
   │   ├─→ NOTIFICAR AL USUARIO:
   │   │   ├─→ Crear notificación en tabla "notificaciones"
   │   │   │   {
   │   │   │     user_id: ID del usuario,
   │   │   │     tipo: "solicitud_aprobada",
   │   │   │     titulo: "Solicitud aprobada",
   │   │   │     mensaje: "Tu solicitud para {despacho} ha sido aprobada",
   │   │   │     link: "/dashboard/despachos",
   │   │   │     leida: false
   │   │   │   }
   │   │   │
   │   │   └─→ Enviar email al usuario
   │   │       ├─→ Asunto: "Solicitud de despacho aprobada"
   │   │       ├─→ Template: solicitud-aprobada.html
   │   │       └─→ Incluir: datos despacho, link a "Mis Despachos"
   │   │
   │   └─→ RETORNAR ÉXITO:
   │       └─→ { success: true, message: "Solicitud aprobada" }
   │
   └─→ RESULTADO:
       ├─→ Usuario ve el despacho en /dashboard/despachos
       ├─→ Puede editar información del despacho
       └─→ Puede gestionar sedes
```

```
┌─────────────────────────────────────────────────────────────────────┐
│                   OPCIÓN B: RECHAZAR SOLICITUD                       │
└─────────────────────────────────────────────────────────────────────┘

1. Super admin hace clic en "Rechazar"
   │
   ├─→ Mostrar modal para ingresar motivo del rechazo (REQUERIDO)
   │
   └─→ Super admin ingresa motivo y confirma
       │
       ├─→ Endpoint: POST /api/rechazar-solicitud
       │   {
       │     solicitudId: ID de la solicitud,
       │     notas: "Motivo del rechazo (REQUERIDO)"
       │   }
       │
       ├─→ PROCESO EN EL BACKEND:
       │   │
       │   ├─→ VERIFICAR PERMISOS:
       │   │   └─→ Solo super_admin puede rechazar
       │   │
       │   ├─→ VALIDAR MOTIVO:
       │   │   └─→ notas no puede estar vacío
       │   │
       │   ├─→ ACTUALIZAR SOLICITUD:
       │   │   ├─→ UPDATE tabla "solicitudes_despacho"
       │   │   ├─→ SET:
       │   │   │   {
       │   │   │     estado: "rechazado",
       │   │   │     fecha_respuesta: NOW(),
       │   │   │     respondido_por: ID del super_admin,
       │   │   │     notas_respuesta: motivo del rechazo
       │   │   │   }
       │   │   │
       │   │   └─→ WHERE id = solicitudId
       │   │
       │   ├─→ NOTIFICAR AL USUARIO:
       │   │   ├─→ Crear notificación en tabla "notificaciones"
       │   │   │   {
       │   │   │     user_id: ID del usuario,
       │   │   │     tipo: "solicitud_rechazada",
       │   │   │     titulo: "Solicitud rechazada",
       │   │   │     mensaje: "Tu solicitud para {despacho} ha sido rechazada",
       │   │   │     link: "/dashboard/solicitar-despacho",
       │   │   │     leida: false
       │   │   │   }
       │   │   │
       │   │   └─→ Enviar email al usuario
       │   │       ├─→ Asunto: "Solicitud de despacho rechazada"
       │   │       ├─→ Template: solicitud-rechazada.html
       │   │       └─→ Incluir: motivo del rechazo, link para nueva solicitud
       │   │
       │   └─→ RETORNAR ÉXITO:
       │       └─→ { success: true, message: "Solicitud rechazada" }
       │
       └─→ RESULTADO:
           ├─→ Usuario recibe notificación con motivo
           └─→ Puede solicitar otro despacho
```

---

### Paso 4: Gestión del Despacho Asignado

Una vez aprobada la solicitud, el usuario puede gestionar su despacho.

```
┌─────────────────────────────────────────────────────────────────────┐
│                  GESTIÓN DEL DESPACHO ASIGNADO                       │
└─────────────────────────────────────────────────────────────────────┘

1. Usuario accede a /dashboard/despachos
   │
   ├─→ Ver listado de sus despachos asignados
   │   ├─→ Query: SELECT * FROM user_despachos WHERE user_id = {userId}
   │   └─→ JOIN con tabla "despachos" para obtener información completa
   │
   ├─→ Para cada despacho puede:
   │   ├─→ Ver información completa
   │   ├─→ Editar datos básicos
   │   ├─→ Gestionar sedes
   │   └─→ Ver estadísticas (futuro)
   │
   └─→ EDITAR DESPACHO:
       ├─→ Modificar: nombre, descripción, áreas de práctica
       ├─→ Marcar sincronizado_wp = false
       ├─→ Enviar cambios a WordPress (si tiene object_id)
       └─→ Marcar sincronizado_wp = true tras éxito
```

---

## 🔗 Sincronización Bidireccional WordPress ↔ Next.js

### WordPress → Next.js (Webhook)

```
┌──────────────────────────────────────────────────────────────┐
│         SINCRONIZACIÓN: WordPress → Next.js                   │
└──────────────────────────────────────────────────────────────┘

1. TRIGGER: Despacho creado/actualizado en WordPress
   │
   ├─→ WordPress dispara webhook a /api/sync-despacho
   │
   └─→ Payload incluye:
       ├─→ object_id (ID de WordPress)
       ├─→ nombre (título del despacho)
       ├─→ descripcion (contenido)
       ├─→ slug (URL amigable)
       ├─→ meta (metadatos personalizados)
       └─→ _despacho_sedes (array de sedes)

2. PROCESAMIENTO EN NEXT.JS
   │
   ├─→ Buscar despacho por object_id
   │
   ├─→ SI EXISTE:
   │   ├─→ Actualizar campos
   │   ├─→ Actualizar ultima_sincronizacion
   │   └─→ Marcar sincronizado_wp = true
   │
   └─→ SI NO EXISTE:
       ├─→ Crear nuevo registro en "despachos"
       ├─→ Asignar object_id
       ├─→ Marcar sincronizado_wp = true
       └─→ Crear sedes asociadas

3. SINCRONIZACIÓN DE SEDES
   │
   ├─→ Procesar array _despacho_sedes
   │
   └─→ Para cada sede:
       ├─→ Buscar por wp_sede_id
       ├─→ Si existe: actualizar
       └─→ Si no existe: crear nueva
           ├─→ Asignar despacho_id
           ├─→ Asignar wp_sede_id
           └─→ Marcar sincronizado_wp = true
```

### Next.js → WordPress (API REST)

```
┌──────────────────────────────────────────────────────────────┐
│         SINCRONIZACIÓN: Next.js → WordPress                   │
└──────────────────────────────────────────────────────────────┘

1. TRIGGER: Despacho creado/actualizado en Next.js
   │
   ├─→ Usuario crea/edita despacho en panel
   │
   └─→ Marcar sincronizado_wp = false

2. ENVÍO A WORDPRESS
   │
   ├─→ Preparar payload con estructura WordPress
   │   ├─→ title: nombre del despacho
   │   ├─→ content: descripcion
   │   ├─→ status: "publish" o "draft"
   │   ├─→ slug: slug del despacho
   │   └─→ meta: metadatos personalizados
   │
   ├─→ SI TIENE object_id (actualización):
   │   └─→ PUT /wp-json/wp/v2/despachos/{object_id}
   │
   └─→ SI NO TIENE object_id (creación):
       └─→ POST /wp-json/wp/v2/despachos
           └─→ Guardar object_id retornado

3. CONFIRMACIÓN
   │
   ├─→ Si éxito:
   │   ├─→ Actualizar object_id (si es nuevo)
   │   ├─→ Marcar sincronizado_wp = true
   │   └─→ Actualizar ultima_sincronizacion
   │
   └─→ Si error:
       ├─→ Mantener sincronizado_wp = false
       ├─→ Registrar error en logs
       └─→ Notificar a administrador
```

---

## 📊 Estructura de Datos

### Tabla: despachos

```sql
CREATE TABLE despachos (
  -- Identificación
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  object_id TEXT UNIQUE,  -- ID en WordPress
  
  -- Información básica
  nombre TEXT NOT NULL,
  descripcion TEXT,
  slug TEXT UNIQUE,
  areas_practica TEXT[],
  
  -- Estado
  activo BOOLEAN DEFAULT true,
  verificado BOOLEAN DEFAULT false,
  num_sedes INTEGER DEFAULT 0,
  
  -- Sincronización
  sincronizado_wp BOOLEAN DEFAULT false,
  ultima_sincronizacion TIMESTAMP,
  
  -- Auditoría
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Tabla: sedes

```sql
CREATE TABLE sedes (
  -- Identificación
  id SERIAL PRIMARY KEY,
  despacho_id UUID REFERENCES despachos(id) ON DELETE CASCADE,
  wp_sede_id TEXT,  -- ID en WordPress
  
  -- Información básica
  nombre TEXT NOT NULL,
  descripcion TEXT,
  es_principal BOOLEAN DEFAULT false,
  
  -- Ubicación
  calle TEXT,
  numero TEXT,
  piso TEXT,
  localidad TEXT NOT NULL,
  provincia TEXT NOT NULL,
  codigo_postal TEXT,
  pais TEXT DEFAULT 'España',
  
  -- Contacto
  telefono TEXT,
  email TEXT,
  web TEXT,
  
  -- Configuración
  horarios JSONB,
  redes_sociales JSONB,
  
  -- Estado
  activa BOOLEAN DEFAULT true,
  estado_verificacion TEXT DEFAULT 'pendiente',
  sincronizado_wp BOOLEAN DEFAULT false,
  
  -- Auditoría
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Tabla: user_despachos

```sql
CREATE TABLE user_despachos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  despacho_id UUID REFERENCES despachos(id) ON DELETE CASCADE,
  rol_despacho TEXT DEFAULT 'propietario',  -- propietario, colaborador, etc.
  fecha_asignacion TIMESTAMP DEFAULT NOW(),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, despacho_id)
);
```

### Tabla: solicitudes_despacho

```sql
CREATE TABLE solicitudes_despacho (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Usuario solicitante
  user_id UUID REFERENCES users(id),
  user_email TEXT,
  user_name TEXT,
  
  -- Despacho solicitado
  despacho_id UUID REFERENCES despachos(id),
  despacho_nombre TEXT,
  despacho_localidad TEXT,
  despacho_provincia TEXT,
  
  -- Estado de la solicitud
  estado TEXT DEFAULT 'pendiente',  -- pendiente, aprobado, rechazado, cancelado
  
  -- Fechas
  fecha_solicitud TIMESTAMP DEFAULT NOW(),
  fecha_respuesta TIMESTAMP,
  
  -- Respuesta del admin
  respondido_por UUID REFERENCES users(id),
  notas_respuesta TEXT,
  
  -- Datos adicionales
  mensaje TEXT,
  datos_despacho JSONB,  -- Si el usuario crea un nuevo despacho
  
  -- Auditoría
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🛠️ Componentes del Sistema

### 1. Servicios (lib/)

#### despachoService.ts
```typescript
class DespachoService {
  // Búsqueda
  buscarDespacho(id: string)
  buscarEnWordPress(id: string)
  
  // Importación
  importarDeWordPress(despachoWP: any)
  
  // Creación
  crearDespacho(datos: DespachoInput)
  enviarAWordPress(despachoId: string)
  
  // Sincronización
  sincronizarDesdeWordPress(payload: WebhookPayload)
  sincronizarHaciaWordPress(despachoId: string)
}
```

#### syncService.ts (PENDIENTE)
```typescript
class SyncService {
  // Sincronización de despachos
  sincronizarDespacho(objectId: string)
  
  // Sincronización de sedes
  sincronizarSedes(despachoId: string, sedes: any[])
  
  // Verificación
  verificarEstadoSincronizacion(despachoId: string)
  
  // Logs
  registrarSincronizacion(despachoId: string, tipo: string, resultado: any)
}
```

### 2. Endpoints API (app/api/)

#### /api/sync-despacho (⏳ PENDIENTE WEBHOOK AUTOMÁTICO)
- ✅ Recibe datos de WordPress
- ✅ Sincroniza despachos y sedes
- ✅ Maneja errores y logs
- ⏳ Configurar webhook automático en WordPress

#### /api/importar-despacho (✅ COMPLETADO)
- ✅ Importa despachos desde WordPress por ID
- ✅ Importa sedes múltiples
- ✅ Elimina sedes antiguas
- ✅ Actualiza num_sedes

#### /api/aprobar-solicitud (✅ COMPLETADO)
- ✅ Aprueba solicitudes de despacho
- ✅ Crea relación user_despachos
- ✅ Envía notificaciones al usuario
- ✅ Envía email al usuario

#### /api/rechazar-solicitud (✅ COMPLETADO)
- ✅ Rechaza solicitudes de despacho
- ✅ Envía notificaciones con motivo
- ✅ Envía email al usuario

#### /api/notificar-solicitud (✅ COMPLETADO)
- ✅ Notifica al super_admin cuando hay nueva solicitud
- ✅ Crea notificación en campana
- ✅ Envía email al super_admin

#### /api/users/[userId]/despachos (✅ COMPLETADO)
- ✅ Obtiene despachos asignados al usuario
- ✅ Transforma datos para UI
- ✅ Incluye información completa

#### /api/crear-despacho (⏳ PENDIENTE)
- ⏳ Crea despacho desde cero en Next.js
- ⏳ Envía a WordPress
- ⏳ Retorna object_id

### 3. Páginas (app/)

#### /dashboard/despachos (✅ COMPLETADO)
- ✅ Búsqueda de despachos en WordPress
- ✅ Importación desde WordPress con botón
- ✅ Solicitud de propiedad con modal
- ✅ Indicador de despachos con propietario
- ✅ Estado "Pendiente" para solicitudes en proceso

#### /dashboard/settings?tab=mis-despachos (✅ COMPLETADO)
- ✅ Lista de despachos asignados al usuario
- ✅ Información completa visible
- ✅ Botón "Editar" funcional
- ✅ Botón "Eliminar" para quitar asignación
- ✅ Badge de estado (Verificado/Pendiente)

#### /dashboard/despachos/[id]/edit (✅ COMPLETADO)
- ✅ Redirección automática a página de edición
- ✅ Conversión de UUID a object_id de WordPress
- ✅ Manejo de errores

#### /dashboard/despachos/[id]/editar (✅ EXISTENTE)
- ✅ Formulario completo de edición
- ✅ Gestión de sedes
- ✅ Actualización en WordPress

#### /admin/users?tab=solicitudes (✅ COMPLETADO)
- ✅ Lista de solicitudes pendientes
- ✅ Información completa del usuario y despacho
- ✅ Botones Aprobar/Rechazar
- ✅ Actualización automática de lista
- ✅ Verificación de permisos (solo super_admin)

---

## ✅ Estado Actual del Sistema

### Completado ✅

1. **Sistema de Usuarios**
   - ✅ Registro y autenticación
   - ✅ Gestión de roles (super_admin, despacho_admin, usuario)
   - ✅ Aprobación de usuarios

2. **Solicitudes de Despacho**
   - ✅ Búsqueda de despachos en WordPress y Supabase
   - ✅ Importación desde WordPress con sedes múltiples
   - ✅ Solicitud de propiedad con modal profesional
   - ✅ Aprobación/rechazo por super_admin
   - ✅ Notificaciones en campana al super_admin
   - ✅ Emails automáticos al super_admin (nueva solicitud)
   - ✅ Emails automáticos al usuario (aprobación/rechazo)
   - ✅ Eliminación de sedes antiguas antes de importar (evita duplicados)
   - ✅ Actualización automática de num_sedes

3. **Gestión de Despachos**
   - ✅ Listado de despachos del usuario en "Mis Despachos"
   - ✅ Información completa visible (nombre, localidad, teléfono, email, web, sedes)
   - ✅ Botón "Editar" funcional con redirección correcta
   - ✅ Botón "Eliminar" para quitar asignación
   - ✅ Badge de estado (Verificado/Pendiente)
   - ✅ Edición de información básica
   - ✅ Asignación manual por super_admin

4. **Servicios Base**
   - ✅ despachoService.ts (búsqueda e importación)
   - ✅ userService.ts (gestión de usuarios y aprobaciones)
   - ✅ notificationService.ts (notificaciones con tipo solicitud_despacho)
   - ✅ emailService.ts (envío de emails con templates)
   - ✅ syncService.ts (importación de despachos y sedes desde WordPress)

5. **Políticas RLS**
   - ✅ solicitudes_despacho: usuarios pueden crear, super_admin puede leer/actualizar
   - ✅ user_despachos: RLS desactivado temporalmente
   - ⚠️ TODO: Activar RLS en user_despachos con políticas específicas

6. **UI/UX**
   - ✅ Texto de inputs en negro (legible)
   - ✅ Colores del dashboard y menús preservados
   - ✅ Templates de email profesionales
   - ✅ Modales de confirmación

### Pendiente ⏳

1. **Sincronización Completa**
   - ⏳ Webhook de WordPress configurado (recibir actualizaciones automáticas)
   - ⏳ Sincronización bidireccional Next.js → WordPress
   - ⏳ Manejo de errores y reintentos
   - ⏳ Cola de sincronización para reintentos

2. **Creación de Despachos desde Cero**
   - ⏳ Formulario de creación completo en UI
   - ⏳ Endpoint /api/crear-despacho
   - ⏳ Envío automático a WordPress
   - ⏳ Sincronización de object_id

3. **Gestión Avanzada de Sedes**
   - ⏳ CRUD completo de sedes desde UI
   - ⏳ Sincronización de cambios con WordPress
   - ⏳ Validación de datos de ubicación
   - ⏳ Gestión de horarios y redes sociales

4. **Funcionalidades de Super Admin**
   - ⏳ Botón para quitar propiedad desde /dashboard/despachos
   - ⏳ Historial de cambios de propiedad
   - ⏳ Estadísticas de solicitudes (aprobadas/rechazadas)

5. **Monitoreo y Logs**
   - ⏳ Dashboard de sincronización
   - ⏳ Historial de cambios
   - ⏳ Alertas de errores
   - ⏳ Logs de sincronización

6. **Optimizaciones**
   - ⏳ Cache de despachos del usuario
   - ⏳ Paginación en lista de solicitudes
   - ⏳ Búsqueda y filtros en "Mis Despachos"
   - ⏳ Límite de despachos por usuario

---

## 📝 Tareas Organizadas por Prioridad

### 🔴 PRIORIDAD ALTA (Funcionalidad Core)

#### Tarea 1: Implementar Sincronización WordPress → Next.js
**Archivo**: `app/api/sync-despacho/route.ts`
**Estado**: ✅ PARCIALMENTE COMPLETADO

- ✅ Crear syncService.ts con métodos de sincronización
- ✅ Implementar lógica de importación de despachos
- ✅ Implementar sincronización de sedes
- ✅ Manejar errores y validaciones
- ✅ Registrar logs de sincronización
- ✅ Probar con datos de WordPress
- ⏳ Configurar webhook automático en WordPress
- ⏳ Sincronización bidireccional (Next.js → WordPress)

**Dependencias**: Ninguna
**Bloqueante para**: Creación de despachos desde cero

---

#### Tarea 2: Implementar Creación de Despachos
**Archivos**: 
- `app/api/crear-despacho/route.ts` (nuevo)
- `app/dashboard/solicitar-despacho/page.tsx` (actualizar)

**Estimación**: 2-3 horas

- [ ] Crear formulario de creación de despacho
- [ ] Validar estructura de datos
- [ ] Crear endpoint /api/crear-despacho
- [ ] Enviar a WordPress vía API REST
- [ ] Guardar object_id retornado
- [ ] Marcar como sincronizado
- [ ] Permitir solicitud de propiedad inmediata

**Dependencias**: Tarea 1 (syncService.ts)
**Bloqueante para**: Flujo completo de usuario

---

### 🟡 PRIORIDAD MEDIA (Mejoras y Gestión)

#### Tarea 3: Gestión Completa de Sedes
**Archivos**:
- `app/dashboard/despachos/[id]/sedes/page.tsx` (nuevo)
- `lib/sedeService.ts` (nuevo)

**Estimación**: 3-4 horas

- [ ] Crear interfaz de gestión de sedes
- [ ] CRUD completo de sedes
- [ ] Validación de datos de ubicación
- [ ] Sincronización con WordPress
- [ ] Marcar sede principal
- [ ] Gestión de horarios

**Dependencias**: Tarea 1
**Bloqueante para**: Gestión completa de despachos

---

#### Tarea 4: Sincronización Next.js → WordPress
**Archivo**: `lib/syncService.ts` (ampliar)
**Estimación**: 2-3 horas

- [ ] Método para enviar despacho a WordPress
- [ ] Método para enviar sedes a WordPress
- [ ] Manejo de autenticación WordPress
- [ ] Actualizar object_id y wp_sede_id
- [ ] Marcar como sincronizado
- [ ] Manejo de errores

**Dependencias**: Tarea 1
**Bloqueante para**: Edición de despachos

---

### 🟢 PRIORIDAD BAJA (Monitoreo y Optimización)

#### Tarea 5: Dashboard de Sincronización
**Archivo**: `app/admin/sincronizacion/page.tsx` (nuevo)
**Estimación**: 2-3 horas

- [ ] Vista de estado de sincronización
- [ ] Listado de despachos no sincronizados
- [ ] Botón de sincronización manual
- [ ] Historial de sincronizaciones
- [ ] Logs de errores
- [ ] Estadísticas

**Dependencias**: Tareas 1, 4
**Bloqueante para**: Ninguna

---

#### Tarea 6: Sistema de Reintentos
**Archivo**: `lib/syncService.ts` (ampliar)
**Estimación**: 2 horas

- [ ] Cola de reintentos para sincronizaciones fallidas
- [ ] Exponential backoff
- [ ] Límite de reintentos
- [ ] Notificación a admin si falla definitivamente
- [ ] Logs detallados

**Dependencias**: Tareas 1, 4
**Bloqueante para**: Ninguna

---

## 🧪 Plan de Pruebas

### Pruebas de Sincronización WordPress → Next.js

1. **Importar despacho desde WordPress**
   - ✅ Búsqueda por ID funciona correctamente
   - ✅ Se importa con object_id correcto
   - ✅ Se marcan campos de sincronización
   - ✅ Metadata completa importada

2. **Sincronizar sedes**
   - ✅ Se crean sedes en Next.js
   - ✅ Se eliminan sedes antiguas antes de importar
   - ✅ Se asignan todas las sedes correctamente
   - ✅ Se actualiza num_sedes automáticamente
   - ✅ Se marca sede principal

3. **Webhook automático**
   - ⏳ Pendiente configurar en WordPress
   - ⏳ Endpoint listo para recibir webhooks

### Pruebas de Creación de Despachos

1. **Usuario crea despacho**
   - ⏳ Formulario de creación pendiente
   - ⏳ Envío a WordPress pendiente
   - ⏳ Sincronización de object_id pendiente

2. **Manejo de errores**
   - ⏳ Pendiente implementar

### Pruebas de Flujo Completo

1. **Usuario nuevo → Despacho → Propiedad**
   - ✅ Usuario se registra
   - ✅ Busca despacho en WordPress
   - ✅ Importa despacho con sedes
   - ✅ Solicita propiedad
   - ✅ Super_admin recibe notificación en campana
   - ✅ Super_admin recibe email
   - ✅ Admin aprueba desde /admin/users?tab=solicitudes
   - ✅ Usuario recibe notificación
   - ✅ Usuario recibe email
   - ✅ Aparece en "Mis Despachos" con toda la información
   - ✅ Puede editar información (redirige a /dashboard/despachos/{object_id}/editar)
   - ⏳ Cambios se sincronizan con WordPress (pendiente)

---

## 📚 Documentación Relacionada

- `DESPACHOS_WORKFLOW.md` - Flujo de trabajo detallado
- `CHANGELOG.md` - Historial de cambios
- `docs/RESUMEN.md` - Estado actual del sistema
- `docs/arquitectura/INTEGRACION_DESPACHOS.md` - Arquitectura de integración
- `docs/tutoriales/FLUJO_SOLICITUDES_DESPACHOS.md` - Tutorial de solicitudes

---

## 🎯 Próximos Pasos Inmediatos

1. **Implementar syncService.ts** (Tarea 1)
   - Crear archivo base
   - Implementar métodos de sincronización
   - Probar con datos de prueba

2. **Completar endpoint /api/sync-despacho** (Tarea 1)
   - Integrar syncService
   - Manejar webhooks de WordPress
   - Probar con Postman/curl

3. **Configurar webhook en WordPress**
   - Instalar plugin de webhooks
   - Configurar URL del endpoint
   - Probar creación/actualización

4. **Implementar creación de despachos** (Tarea 2)
   - Crear formulario
   - Crear endpoint API
   - Integrar con WordPress

---

## 📞 Notas Técnicas

### Autenticación con WordPress
```typescript
const auth = Buffer.from(
  `${process.env.WORDPRESS_USERNAME}:${process.env.WORDPRESS_APPLICATION_PASSWORD}`
).toString('base64');

headers: {
  'Authorization': `Basic ${auth}`,
  'Content-Type': 'application/json'
}
```

### Estructura de Webhook de WordPress
```json
{
  "id": 123,
  "title": { "rendered": "Nombre del Despacho" },
  "content": { "rendered": "<p>Descripción...</p>" },
  "slug": "nombre-despacho",
  "status": "publish",
  "meta": {
    "_despacho_sedes": [
      {
        "nombre": "Sede Principal",
        "localidad": "Madrid",
        "provincia": "Madrid",
        "telefono": "123456789"
      }
    ]
  }
}
```

### Variables de Entorno Necesarias
```env
# WordPress
WORDPRESS_API_URL=https://lexhoy.com/wp-json/wp/v2/despachos
WORDPRESS_USERNAME=admin
WORDPRESS_APPLICATION_PASSWORD=xxxx xxxx xxxx xxxx

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Email
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=notificaciones@lexhoy.com

# Base URL
NEXT_PUBLIC_BASE_URL=https://lexhoy.com
```

---

**Última actualización**: 2025-10-03
**Versión**: 1.0
**Autor**: Sistema LexHoy
