# 🎯 CONTEXTO DEL PROYECTO - LEXHOY

> **IMPORTANTE**: Lee este archivo SIEMPRE antes de empezar cualquier tarea.
> Este es el contexto permanente del proyecto para evitar repeticiones.

---

## 📌 ESTADO ACTUAL (Última actualización: 2025-10-03)

### ✅ LO QUE YA ESTÁ FUNCIONANDO

1. **Sistema de Usuarios**
   - Registro y autenticación con Supabase
   - Roles: super_admin, despacho_admin, usuario
   - Aprobación de usuarios por super_admin

2. **Solicitudes de Despacho**
   - Búsqueda de despachos en Next.js y WordPress
   - Importación desde WordPress a Next.js
   - Solicitud de propiedad de despachos
   - Aprobación/rechazo por super_admin (endpoints funcionando)
   - Notificaciones en campana (🔔)
   - Emails con Resend

3. **Gestión de Despachos**
   - Listado de "Mis Despachos" para usuarios
   - Edición básica de información
   - Asignación manual por super_admin

4. **Servicios Implementados**
   - `lib/userService.ts` - Gestión de usuarios
   - `lib/despachoService.ts` - Búsqueda e importación básica
   - `lib/notificationService.ts` - Notificaciones
   - `lib/emailService.ts` - Envío de emails

5. **Endpoints API Funcionando**
   - `/api/aprobar-solicitud` ✅
   - `/api/rechazar-solicitud` ✅
   - `/api/sync-despacho` ⚠️ (solo debug, no implementado)

---

## 🔴 LO QUE FALTA POR HACER (PRIORIZADO)

### FLUJO PRINCIPAL: Asignación de Despachos a Usuarios

**El flujo completo que necesitamos (ver FLUJO_COMPLETO_DESPACHOS.md):**

```
PASO 1: Usuario busca despacho → 3 ESCENARIOS:

ESCENARIO A: Despacho existe en Next.js
  ├─→ Mostrar información
  └─→ Botón "Solicitar Propiedad" → PASO 2

ESCENARIO B: Despacho existe en WordPress (no en Next.js)
  ├─→ Buscar en WordPress vía API
  ├─→ Importar a Next.js (con sedes)
  └─→ Botón "Solicitar Propiedad" → PASO 2

ESCENARIO C: Despacho NO existe
  ├─→ Formulario "Crear Nuevo Despacho"
  ├─→ Crear en Next.js
  ├─→ Enviar a WordPress vía API
  ├─→ Guardar object_id
  └─→ Botón "Solicitar Propiedad" → PASO 2

PASO 2: Solicitud de Propiedad
  ├─→ Crear solicitud en BD
  ├─→ Notificar a super_admin (campana + email)
  └─→ Usuario espera aprobación

PASO 3: Super Admin Aprueba/Rechaza
  ├─→ APROBAR:
  │   ├─→ Crear relación user_despachos
  │   ├─→ Notificar usuario (campana + email)
  │   └─→ Usuario ve despacho en "Mis Despachos"
  │
  └─→ RECHAZAR:
      ├─→ Actualizar solicitud con motivo
      └─→ Notificar usuario con motivo

PASO 4: Gestión del Despacho
  ├─→ Usuario edita información
  ├─→ Gestiona sedes
  └─→ Cambios se sincronizan con WordPress
```

**Tareas pendientes:**

1. **Implementar `/api/sync-despacho` completo**
   - Recibir webhooks de WordPress
   - Crear/actualizar despachos en Next.js
   - Sincronizar sedes
   - Archivo: `app/api/sync-despacho/route.ts`

2. **Crear `lib/syncService.ts`**
   - Métodos de sincronización bidireccional
   - Manejo de errores y reintentos
   - Logs de sincronización

3. **Implementar creación de despachos**
   - Formulario de creación
   - Endpoint `/api/crear-despacho`
   - Envío a WordPress
   - Guardar object_id retornado

4. **Gestión de sedes**
   - CRUD completo de sedes
   - Sincronización con WordPress

---

## 🗂️ ESTRUCTURA DE DATOS CLAVE

### Tabla: despachos
```sql
- id (UUID)
- object_id (TEXT) -- ID de WordPress
- nombre (TEXT)
- descripcion (TEXT)
- slug (TEXT)
- areas_practica (TEXT[])
- activo (BOOLEAN)
- verificado (BOOLEAN)
- sincronizado_wp (BOOLEAN)
- ultima_sincronizacion (TIMESTAMP)
```

### Tabla: sedes
```sql
- id (SERIAL)
- despacho_id (UUID)
- wp_sede_id (TEXT) -- ID en WordPress
- nombre, localidad, provincia, etc.
- sincronizado_wp (BOOLEAN)
```

### Tabla: user_despachos
```sql
- user_id (UUID)
- despacho_id (UUID)
- rol_despacho (TEXT) -- propietario, colaborador
- fecha_asignacion (TIMESTAMP)
```

### Tabla: solicitudes_despacho
```sql
- user_id (UUID)
- despacho_id (UUID)
- estado (TEXT) -- pendiente, aprobado, rechazado
- fecha_solicitud, fecha_respuesta
- respondido_por (UUID)
- notas_respuesta (TEXT)
```

---

## 🔗 SINCRONIZACIÓN BIDIRECCIONAL

### WordPress → Next.js (Webhook)
1. WordPress dispara webhook a `/api/sync-despacho`
2. Buscar por `object_id`
3. Si existe: actualizar
4. Si no existe: crear nuevo
5. Sincronizar sedes
6. Marcar `sincronizado_wp = true`

### Next.js → WordPress (API REST)
1. Usuario crea/edita despacho
2. Marcar `sincronizado_wp = false`
3. Enviar a WordPress vía API REST
4. Guardar `object_id` retornado
5. Marcar `sincronizado_wp = true`

---

## 📁 ARCHIVOS IMPORTANTES

### Documentación
- `FLUJO_COMPLETO_DESPACHOS.md` - Flujo detallado completo
- `DESPACHOS_WORKFLOW.md` - Workflow y estructura de datos
- `CHANGELOG.md` - Historial de cambios
- `docs/RESUMEN.md` - Estado actual del sistema
- **`CONTEXTO_PROYECTO.md`** - ESTE ARCHIVO (contexto permanente)

### Servicios (lib/)
- `userService.ts` - Gestión de usuarios ✅
- `despachoService.ts` - Búsqueda e importación básica ✅
- `notificationService.ts` - Notificaciones ✅
- `emailService.ts` - Emails ✅
- `syncService.ts` - ⚠️ PENDIENTE DE CREAR

### Endpoints (app/api/)
- `aprobar-solicitud/route.ts` ✅
- `rechazar-solicitud/route.ts` ✅
- `sync-despacho/route.ts` ⚠️ Solo debug
- `crear-despacho/route.ts` ❌ No existe

### Páginas (app/)
- `dashboard/solicitar-despacho/page.tsx` ✅
- `dashboard/despachos/page.tsx` ✅
- `admin/users/page.tsx` ✅

---

## 🔑 VARIABLES DE ENTORNO

```env
# WordPress
WORDPRESS_API_URL=https://lexhoy.com/wp-json/wp/v2/despachos
WORDPRESS_USERNAME=admin
WORDPRESS_APPLICATION_PASSWORD=xxxx

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

## 🎯 PRÓXIMA TAREA A REALIZAR

**Cuando retomes el trabajo, empieza por:**

1. Crear `lib/syncService.ts` con métodos de sincronización
2. Implementar `/api/sync-despacho/route.ts` completo
3. Probar sincronización WordPress → Next.js

**Archivos a modificar:**
- `app/api/sync-despacho/route.ts` (reemplazar debug)
- `lib/syncService.ts` (crear nuevo)

---

## 💡 NOTAS IMPORTANTES

- **NO** borrar archivos de debug hasta confirmar que funciona
- **SIEMPRE** probar con datos de prueba primero
- **MARCAR** `sincronizado_wp` correctamente
- **REGISTRAR** logs de sincronización
- **NOTIFICAR** errores a super_admin

---

## 🚨 PROBLEMAS CONOCIDOS

1. Endpoint `/api/sync-despacho` solo hace debug, no sincroniza
2. No existe formulario de creación de despachos
3. No hay gestión de sedes implementada
4. Falta sistema de reintentos para sincronizaciones fallidas

---

## ✅ CHECKLIST ANTES DE EMPEZAR

- [ ] Leer este archivo completo
- [ ] Revisar `FLUJO_COMPLETO_DESPACHOS.md`
- [ ] Verificar que Supabase está conectado
- [ ] Verificar variables de entorno
- [ ] Identificar la tarea específica a realizar

---

**🎯 REGLA DE ORO**: Si no sabes por dónde empezar, lee la sección "PRÓXIMA TAREA A REALIZAR"
