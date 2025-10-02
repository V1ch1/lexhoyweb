# 🔄 Flujo Completo de Solicitudes de Despachos

## 📋 Tabla de Contenidos

1. [Resumen del Sistema](#resumen-del-sistema)
2. [Roles y Permisos](#roles-y-permisos)
3. [Flujo por Rol](#flujo-por-rol)
4. [Estados de Solicitudes](#estados-de-solicitudes)
5. [Notificaciones](#notificaciones)
6. [Casos de Uso](#casos-de-uso)

---

## 🎯 Resumen del Sistema

El sistema de solicitudes de despachos permite a los usuarios solicitar acceso a despachos existentes. Los super_admin revisan y aprueban/rechazan estas solicitudes.

### Componentes Principales

- **Solicitud**: Usuario pide acceso a un despacho
- **Aprobación**: Super admin asigna el despacho al usuario
- **Rechazo**: Super admin rechaza con motivo
- **Cancelación**: Usuario cancela su propia solicitud

---

## 👥 Roles y Permisos

### 1. Usuario Normal (`usuario`)

**Permisos**:
- ✅ Ver listado de despachos públicos
- ✅ Solicitar acceso a despachos
- ✅ Ver sus propias solicitudes
- ✅ Cancelar sus solicitudes pendientes
- ✅ Ver sus despachos asignados
- ❌ No puede aprobar/rechazar solicitudes
- ❌ No puede ver solicitudes de otros usuarios
- ❌ No puede asignar despachos manualmente

**Páginas accesibles**:
- `/dashboard/despachos` - Ver y solicitar despachos
- `/dashboard/settings?tab=mis-despachos` - Ver despachos asignados

### 2. Despacho Admin (`despacho_admin`)

**Permisos**:
- ✅ Todos los permisos de usuario normal
- ✅ Gestionar su propio despacho (si es propietario)
- ✅ Editar información de su despacho
- ❌ No puede aprobar solicitudes de otros
- ❌ No puede ver panel de administración

**Páginas accesibles**:
- Todas las de usuario normal
- `/dashboard/despachos/[id]/editar` - Solo su despacho

### 3. Super Admin (`super_admin`)

**Permisos**:
- ✅ Todos los permisos anteriores
- ✅ Ver todas las solicitudes pendientes
- ✅ Aprobar solicitudes
- ✅ Rechazar solicitudes con motivo
- ✅ Asignar despachos manualmente
- ✅ Desasignar despachos
- ✅ Gestionar usuarios
- ✅ Editar cualquier despacho
- ✅ Asignar propietarios a despachos

**Páginas accesibles**:
- Todas las anteriores
- `/admin/solicitudes-despachos` - Gestionar solicitudes
- `/admin/users` - Gestionar usuarios
- `/admin/users/[id]` - Asignar despachos manualmente

---

## 🔄 Flujo por Rol

### 🟢 Flujo: Usuario Solicita Despacho

```
1. Usuario ve listado de despachos
   ↓
2. Click en "Solicitar Despacho"
   ↓
3. Sistema verifica:
   - ¿Ya tiene solicitud pendiente? → Error
   - ¿Ya tiene el despacho asignado? → Error
   ↓
4. Sistema crea solicitud con estado "pendiente"
   ↓
5. Sistema sincroniza despacho desde WordPress
   ↓
6. Sistema envía notificaciones:
   - 📧 Email a todos los super_admin
   - 🔔 Notificación in-app a super_admin
   ↓
7. Usuario ve mensaje: "Solicitud enviada correctamente"
   ↓
8. Usuario puede ver su solicitud en /dashboard/settings
```

**Código relevante**:
- `app/api/solicitar-despacho/route.ts` (líneas 1-194)
- `lib/solicitudesService.ts` (líneas 7-35)

**Validaciones**:
- ✅ Usuario autenticado
- ✅ Despacho existe
- ✅ No hay solicitud duplicada
- ✅ Datos completos (userId, despachoId, email, nombre)

---

### 🔵 Flujo: Super Admin Aprueba Solicitud

```
1. Super admin recibe email de nueva solicitud
   ↓
2. Super admin va a /admin/solicitudes-despachos
   ↓
3. Ve lista de solicitudes pendientes con:
   - Nombre del usuario
   - Email del usuario
   - Despacho solicitado
   - Fecha de solicitud
   ↓
4. Click en "Aprobar"
   ↓
5. Sistema ejecuta:
   a. Sincroniza despacho desde WordPress
   b. Obtiene ID numérico del despacho en Supabase
   c. Crea registro en user_despachos:
      - user_id: ID del usuario
      - despacho_id: ID del despacho
      - activo: true
      - permisos: {leer: true, escribir: true, eliminar: true}
      - asignado_por: ID del super_admin
   d. Actualiza solicitud:
      - estado: "aprobado"
      - fecha_respuesta: NOW()
      - respondido_por: ID del super_admin
   ↓
6. Sistema envía notificaciones:
   - 📧 Email al usuario (solicitud aprobada)
   - 🔔 Notificación in-app al usuario
   ↓
7. Super admin ve mensaje: "Solicitud aprobada exitosamente"
   ↓
8. Usuario puede acceder al despacho en /dashboard/settings
```

**Código relevante**:
- `lib/userService.ts` → `approveSolicitudDespacho()` (líneas 1078-1214)
- `app/admin/solicitudes-despachos/page.tsx` (líneas 83-95)

**Validaciones**:
- ✅ Solo super_admin puede aprobar
- ✅ Solicitud existe y está pendiente
- ✅ Despacho existe en WordPress
- ✅ No hay asignación duplicada

---

### 🔴 Flujo: Super Admin Rechaza Solicitud

```
1. Super admin va a /admin/solicitudes-despachos
   ↓
2. Click en "Rechazar" en una solicitud
   ↓
3. Se abre modal pidiendo motivo del rechazo
   ↓
4. Super admin escribe motivo (obligatorio)
   ↓
5. Click en "Confirmar Rechazo"
   ↓
6. Sistema ejecuta:
   a. Actualiza solicitud:
      - estado: "rechazado"
      - fecha_respuesta: NOW()
      - respondido_por: ID del super_admin
      - notas_respuesta: motivo del rechazo
   ↓
7. Sistema envía notificaciones:
   - 📧 Email al usuario (solicitud rechazada + motivo)
   - 🔔 Notificación in-app al usuario
   ↓
8. Super admin ve mensaje: "Solicitud rechazada"
   ↓
9. Usuario recibe email con el motivo
```

**Código relevante**:
- `lib/userService.ts` → `rejectSolicitudDespacho()` (líneas 1216-1297)
- `app/admin/solicitudes-despachos/page.tsx` (líneas 97-115)

**Validaciones**:
- ✅ Solo super_admin puede rechazar
- ✅ Motivo es obligatorio
- ✅ Solicitud existe y está pendiente

---

### ⚪ Flujo: Usuario Cancela Solicitud

```
1. Usuario va a /dashboard/settings?tab=mis-despachos
   ↓
2. Ve sus solicitudes pendientes
   ↓
3. Click en "Cancelar Solicitud"
   ↓
4. Confirma la acción
   ↓
5. Sistema ejecuta:
   a. Actualiza solicitud:
      - estado: "cancelada"
      - fecha_respuesta: NOW()
      - respondido_por: ID del usuario
   ↓
6. Usuario ve mensaje: "Solicitud cancelada"
   ↓
7. Solicitud desaparece de la lista
```

**Código relevante**:
- `lib/userService.ts` → `cancelarSolicitudDespacho()` (líneas 34-50)
- `app/dashboard/settings/page.tsx` (búsqueda de "cancelar")

**Validaciones**:
- ✅ Usuario solo puede cancelar sus propias solicitudes
- ✅ Solicitud debe estar pendiente

---

### 🟣 Flujo: Super Admin Asigna Despacho Manualmente

```
1. Super admin va a /admin/users/[id]
   ↓
2. Ve perfil del usuario
   ↓
3. Sección "Despachos Asignados"
   ↓
4. Click en "Asignar Despacho"
   ↓
5. Selecciona despacho del dropdown
   ↓
6. Click en "Asignar"
   ↓
7. Sistema ejecuta:
   a. Crea registro en user_despachos
   b. NO crea solicitud (es asignación directa)
   ↓
8. Usuario puede ver el despacho inmediatamente
```

**Código relevante**:
- `lib/userService.ts` → `assignDespachoToUser()` (líneas 466-485)
- `app/admin/users/[id]/page.tsx` (asignación manual)

**Diferencias con aprobación de solicitud**:
- ❌ No hay solicitud previa
- ❌ No se envía email al usuario
- ✅ Asignación inmediata
- ✅ Solo super_admin puede hacerlo

---

## 📊 Estados de Solicitudes

### Estados Posibles

| Estado | Descripción | Puede cambiar a |
|--------|-------------|-----------------|
| **pendiente** | Solicitud creada, esperando revisión | aprobado, rechazado, cancelada |
| **aprobado** | Super admin aprobó la solicitud | - (final) |
| **rechazado** | Super admin rechazó la solicitud | - (final) |
| **cancelada** | Usuario canceló su solicitud | - (final) |

### Transiciones de Estado

```
                    ┌─────────────┐
                    │  PENDIENTE  │
                    └──────┬──────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │ APROBADO │    │RECHAZADO │    │CANCELADA │
    └──────────┘    └──────────┘    └──────────┘
    (super_admin)   (super_admin)    (usuario)
```

---

## 🔔 Notificaciones

### Tipos de Notificaciones

#### 1. Nueva Solicitud → Super Admin

**Canales**:
- 📧 **Email**: Todos los super_admin
- 🔔 **In-app**: Notificación en el dashboard

**Contenido del email**:
- Nombre del usuario
- Email del usuario
- Despacho solicitado
- Fecha de solicitud
- Botón: "Ver Solicitud"

**Template**: `templateSolicitudRecibida`

---

#### 2. Solicitud Aprobada → Usuario

**Canales**:
- 📧 **Email**: Usuario que solicitó
- 🔔 **In-app**: Notificación en el dashboard

**Contenido del email**:
- Confirmación de aprobación
- Nombre del despacho
- Botón: "Ir a Mis Despachos"

**Template**: `templateSolicitudAprobada`

---

#### 3. Solicitud Rechazada → Usuario

**Canales**:
- 📧 **Email**: Usuario que solicitó
- 🔔 **In-app**: Notificación en el dashboard

**Contenido del email**:
- Información del rechazo
- Motivo del rechazo
- Nombre del despacho

**Template**: `templateSolicitudRechazada`

---

## 🎬 Casos de Uso

### Caso 1: Usuario Nuevo Solicita Primer Despacho

**Escenario**: Juan se registra y quiere acceso a "Vento Abogados"

```
1. Juan hace login
2. Va a /dashboard/despachos
3. Busca "Vento Abogados"
4. Click en "Solicitar Despacho"
5. Confirma la solicitud
6. ✅ Solicitud creada
7. ✅ Email enviado a super_admin
8. Juan ve: "Solicitud enviada correctamente"
9. Juan espera aprobación

--- Tiempo después ---

10. Super admin (María) recibe email
11. María va a /admin/solicitudes-despachos
12. María ve la solicitud de Juan
13. María click en "Aprobar"
14. ✅ Despacho asignado a Juan
15. ✅ Email enviado a Juan
16. Juan recibe email de aprobación
17. Juan va a /dashboard/settings?tab=mis-despachos
18. ✅ Juan ve "Vento Abogados" en su lista
```

---

### Caso 2: Usuario Solicita Despacho Duplicado

**Escenario**: Pedro ya solicitó "Despacho X" y lo intenta de nuevo

```
1. Pedro va a /dashboard/despachos
2. Click en "Solicitar Despacho" en "Despacho X"
3. ❌ Sistema detecta solicitud existente
4. Pedro ve error: "Ya existe una solicitud pendiente para este despacho"
5. Pedro va a /dashboard/settings
6. Pedro ve su solicitud pendiente
7. Pedro puede cancelarla si quiere
```

---

### Caso 3: Super Admin Rechaza Solicitud

**Escenario**: Ana solicita un despacho pero no cumple requisitos

```
1. Ana solicita "Despacho Premium"
2. Super admin (Carlos) recibe notificación
3. Carlos revisa la solicitud
4. Carlos determina que Ana no cumple requisitos
5. Carlos click en "Rechazar"
6. Carlos escribe motivo: "El despacho Premium requiere 5 años de experiencia"
7. Carlos confirma rechazo
8. ✅ Solicitud rechazada
9. ✅ Email enviado a Ana con el motivo
10. Ana recibe email explicando el motivo
11. Ana puede solicitar otro despacho
```

---

### Caso 4: Super Admin Asigna Despacho Directamente

**Escenario**: Luis es socio del despacho, no necesita solicitud

```
1. Super admin (María) va a /admin/users
2. Busca a Luis
3. Click en el perfil de Luis
4. Sección "Despachos Asignados"
5. Click en "Asignar Despacho"
6. Selecciona "Vento Abogados"
7. Click en "Asignar"
8. ✅ Despacho asignado inmediatamente
9. Luis puede acceder sin solicitud previa
10. NO se envía email (asignación directa)
```

---

### Caso 5: Usuario Cancela Su Solicitud

**Escenario**: Carmen cambia de opinión

```
1. Carmen solicitó "Despacho A"
2. Carmen va a /dashboard/settings?tab=mis-despachos
3. Carmen ve su solicitud pendiente
4. Carmen click en "Cancelar Solicitud"
5. Carmen confirma la cancelación
6. ✅ Solicitud cancelada
7. Solicitud desaparece de la lista
8. Carmen puede solicitar otro despacho
```

---

## 🗄️ Estructura de Base de Datos

### Tabla: `solicitudes_despacho`

```sql
CREATE TABLE solicitudes_despacho (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,              -- ID del usuario que solicita
  user_email TEXT NOT NULL,           -- Email del usuario
  user_name TEXT NOT NULL,            -- Nombre del usuario
  despacho_id TEXT NOT NULL,          -- object_id del despacho (WordPress)
  despacho_nombre TEXT,               -- Nombre del despacho
  despacho_localidad TEXT,            -- Localidad del despacho
  despacho_provincia TEXT,            -- Provincia del despacho
  estado TEXT NOT NULL DEFAULT 'pendiente', -- pendiente, aprobado, rechazado, cancelada
  fecha_solicitud TIMESTAMP NOT NULL DEFAULT NOW(),
  fecha_respuesta TIMESTAMP,          -- Cuando se aprueba/rechaza
  respondido_por TEXT,                -- ID del super_admin que respondió
  notas_respuesta TEXT                -- Motivo de rechazo o notas
);
```

### Tabla: `user_despachos`

```sql
CREATE TABLE user_despachos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,              -- ID del usuario
  despacho_id INTEGER NOT NULL,       -- ID numérico del despacho en Supabase
  activo BOOLEAN DEFAULT true,        -- Si la asignación está activa
  permisos JSONB DEFAULT '{"leer": true, "escribir": true, "eliminar": true}',
  fecha_asignacion TIMESTAMP DEFAULT NOW(),
  asignado_por TEXT                   -- ID del super_admin que asignó
);
```

### Relación

```
solicitudes_despacho.user_id → users.id
solicitudes_despacho.despacho_id → despachos.object_id (WordPress)
user_despachos.user_id → users.id
user_despachos.despacho_id → despachos.id (Supabase)
```

---

## 📝 Archivos del Sistema

```
lexhoyweb/
├── lib/
│   ├── userService.ts               # Lógica de aprobación/rechazo/asignación
│   ├── solicitudesService.ts        # Crear y obtener solicitudes
│   ├── emailService.ts              # Envío de emails
│   └── notificationService.ts       # Notificaciones in-app
├── app/
│   ├── api/
│   │   ├── solicitar-despacho/
│   │   │   └── route.ts             # API para crear solicitud
│   │   └── send-email/
│   │       └── route.ts             # API para enviar emails
│   ├── dashboard/
│   │   ├── despachos/
│   │   │   └── page.tsx             # Listado y solicitar despachos
│   │   └── settings/
│   │       └── page.tsx             # Ver solicitudes y despachos asignados
│   └── admin/
│       ├── solicitudes-despachos/
│       │   └── page.tsx             # Gestionar solicitudes (super_admin)
│       └── users/
│           └── [id]/
│               └── page.tsx         # Asignar despachos manualmente
└── components/
    └── ModalConfirmarEliminar.tsx   # Modal de confirmación
```

---

## ✅ Checklist de Funcionalidades

### Usuario Normal
- [x] Ver listado de despachos
- [x] Solicitar acceso a despacho
- [x] Ver sus solicitudes pendientes
- [x] Cancelar solicitud pendiente
- [x] Ver despachos asignados
- [x] Eliminar su propiedad de despacho

### Super Admin
- [x] Ver todas las solicitudes pendientes
- [x] Aprobar solicitudes
- [x] Rechazar solicitudes con motivo
- [x] Asignar despachos manualmente
- [x] Desasignar despachos
- [x] Recibir email de nuevas solicitudes
- [x] Ver historial de solicitudes

### Sistema
- [x] Validar solicitudes duplicadas
- [x] Sincronizar despachos desde WordPress
- [x] Enviar emails automáticos
- [x] Crear notificaciones in-app
- [x] Logs detallados para debugging
- [x] Manejo de errores robusto

---

## 🐛 Debugging

### Ver solicitudes en BD

```sql
-- Ver todas las solicitudes
SELECT 
  id,
  user_name,
  user_email,
  despacho_nombre,
  estado,
  fecha_solicitud,
  fecha_respuesta
FROM solicitudes_despacho
ORDER BY fecha_solicitud DESC;

-- Ver solicitudes pendientes
SELECT * FROM solicitudes_despacho
WHERE estado = 'pendiente';

-- Ver solicitudes de un usuario
SELECT * FROM solicitudes_despacho
WHERE user_email = 'usuario@example.com';
```

### Ver asignaciones en BD

```sql
-- Ver despachos asignados a un usuario
SELECT 
  ud.id,
  ud.user_id,
  ud.despacho_id,
  d.nombre as despacho_nombre,
  ud.activo,
  ud.fecha_asignacion
FROM user_despachos ud
JOIN despachos d ON d.id = ud.despacho_id
WHERE ud.user_id = 'user-id-aqui'
  AND ud.activo = true;
```

---

**¡Sistema completo de solicitudes implementado y documentado!** 🎉

Todo está funcionando. Solo necesitas configurar Resend para los emails (ver `CONFIGURACION_RESEND.md`).
