# Sistema de Notificaciones - Documentación Completa

## 📋 Descripción General

Sistema completo de notificaciones que incluye:
- 🔔 Notificaciones en tiempo real en la campana del navbar
- 📧 Emails automáticos usando Resend
- 📊 Panel de notificaciones para cada usuario

## 🗄️ Estructura de Base de Datos

### Tabla `notificaciones`

```sql
CREATE TABLE notificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id),
  tipo TEXT NOT NULL CHECK (tipo IN (
    'solicitud_recibida',
    'solicitud_aprobada',
    'solicitud_rechazada',
    'despacho_asignado',
    'despacho_desasignado',
    'usuario_nuevo',
    'mensaje_sistema'
  )),
  titulo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  leida BOOLEAN DEFAULT false,
  url TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para mejor rendimiento
CREATE INDEX idx_notificaciones_user_id ON notificaciones(user_id);
CREATE INDEX idx_notificaciones_leida ON notificaciones(leida);
CREATE INDEX idx_notificaciones_created_at ON notificaciones(created_at DESC);
```

## 📧 Configuración de Resend

### 1. Instalación

```bash
npm install resend
```

### 2. Variables de Entorno

Añadir a `.env.local`:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=notificaciones@lexhoy.com
```

### 3. Obtener API Key

1. Ir a https://resend.com
2. Crear cuenta (gratis hasta 10,000 emails/mes)
3. Verificar dominio o usar dominio de prueba
4. Copiar API Key

## 🔔 Tipos de Notificaciones

### 1. **Solicitud Recibida** (Para Super Admin)
- **Cuándo**: Usuario solicita un despacho
- **Destinatario**: Todos los super admins
- **Email**: ✅ Sí
- **Campana**: ✅ Sí

### 2. **Solicitud Aprobada** (Para Usuario)
- **Cuándo**: Super admin aprueba solicitud
- **Destinatario**: Usuario que solicitó
- **Email**: ✅ Sí
- **Campana**: ✅ Sí

### 3. **Solicitud Rechazada** (Para Usuario)
- **Cuándo**: Super admin rechaza solicitud
- **Destinatario**: Usuario que solicitó
- **Email**: ✅ Sí
- **Campana**: ✅ Sí

### 4. **Despacho Asignado** (Para Usuario)
- **Cuándo**: Super admin asigna despacho manualmente
- **Destinatario**: Usuario asignado
- **Email**: ✅ Sí
- **Campana**: ✅ Sí

### 5. **Despacho Desasignado** (Para Usuario)
- **Cuándo**: Super admin o usuario elimina asignación
- **Destinatario**: Usuario afectado
- **Email**: ✅ Sí
- **Campana**: ✅ Sí

### 6. **Usuario Nuevo** (Para Super Admin)
- **Cuándo**: Nuevo usuario se registra
- **Destinatario**: Todos los super admins
- **Email**: ✅ Sí
- **Campana**: ✅ Sí

## 📁 Estructura de Archivos

```
lib/
├── notificationService.ts      # Servicio de notificaciones
├── emailService.ts             # Servicio de emails con Resend
└── emailTemplates.tsx          # Templates de emails

components/
├── NotificationBell.tsx        # Campana de notificaciones
└── NotificationPanel.tsx       # Panel de notificaciones

app/
├── api/
│   ├── notifications/
│   │   ├── route.ts           # GET notificaciones
│   │   └── [id]/
│   │       └── route.ts       # PATCH marcar como leída
│   └── send-email/
│       └── route.ts           # POST enviar email
```

## 🎨 UI de Notificaciones

### Campana en Navbar

```tsx
<NotificationBell 
  userId={user.id}
  unreadCount={5}
/>
```

**Características**:
- Badge con número de no leídas
- Dropdown con últimas 5 notificaciones
- Link "Ver todas" al panel completo
- Auto-refresh cada 30 segundos

### Panel de Notificaciones

**Ruta**: `/dashboard/notificaciones`

**Características**:
- Lista completa de notificaciones
- Filtros: Todas / No leídas / Leídas
- Marcar como leída/no leída
- Eliminar notificaciones
- Paginación

## 📧 Templates de Emails

### 1. Solicitud Recibida (Super Admin)

**Asunto**: Nueva solicitud de despacho - {nombre_usuario}

**Contenido**:
```
Hola Administrador,

{nombre_usuario} ha solicitado acceso al despacho:

📍 Despacho: {nombre_despacho}
📧 Email: {email_usuario}
📅 Fecha: {fecha}

Puedes revisar y aprobar esta solicitud desde el panel de administración.

[Ver Solicitud]

---
LexHoy - Sistema de Gestión
```

### 2. Solicitud Aprobada (Usuario)

**Asunto**: ✅ Tu solicitud ha sido aprobada

**Contenido**:
```
¡Buenas noticias {nombre_usuario}!

Tu solicitud para el despacho "{nombre_despacho}" ha sido aprobada.

Ya puedes acceder y gestionar tu despacho desde el panel de control.

[Ir a Mi Despacho]

---
LexHoy - Sistema de Gestión
```

### 3. Solicitud Rechazada (Usuario)

**Asunto**: Actualización sobre tu solicitud

**Contenido**:
```
Hola {nombre_usuario},

Lamentamos informarte que tu solicitud para el despacho "{nombre_despacho}" no ha sido aprobada.

Motivo: {motivo_rechazo}

Si tienes alguna pregunta, no dudes en contactarnos.

---
LexHoy - Sistema de Gestión
```

## 🔄 Flujo de Notificaciones

### Ejemplo: Usuario Solicita Despacho

```typescript
// 1. Usuario hace la solicitud
await createSolicitud(data);

// 2. Crear notificación para super admins
await notificationService.notifyAllSuperAdmins({
  tipo: 'solicitud_recibida',
  titulo: 'Nueva solicitud de despacho',
  mensaje: `${userName} ha solicitado acceso a ${despachoName}`,
  url: '/admin/solicitudes-despachos',
  metadata: { solicitudId, userId, despachoId }
});

// 3. Enviar email a super admins
await emailService.sendToSuperAdmins({
  subject: `Nueva solicitud de despacho - ${userName}`,
  template: 'solicitud-recibida',
  data: { userName, despachoName, userEmail, fecha }
});
```

### Ejemplo: Super Admin Aprueba Solicitud

```typescript
// 1. Aprobar solicitud
await approveSolicitud(solicitudId);

// 2. Crear notificación para usuario
await notificationService.create({
  userId: solicitud.user_id,
  tipo: 'solicitud_aprobada',
  titulo: '✅ Solicitud aprobada',
  mensaje: `Tu solicitud para ${despachoName} ha sido aprobada`,
  url: '/dashboard/settings?tab=mis-despachos'
});

// 3. Enviar email al usuario
await emailService.send({
  to: userEmail,
  subject: '✅ Tu solicitud ha sido aprobada',
  template: 'solicitud-aprobada',
  data: { userName, despachoName }
});
```

## 🚀 Implementación Paso a Paso

### Fase 1: Base de Datos ✅
- Crear tabla `notificaciones`
- Añadir índices

### Fase 2: Servicios Backend
- `notificationService.ts` - CRUD de notificaciones
- `emailService.ts` - Integración con Resend
- `emailTemplates.tsx` - Templates HTML

### Fase 3: API Routes
- `GET /api/notifications` - Listar notificaciones
- `PATCH /api/notifications/[id]` - Marcar como leída
- `DELETE /api/notifications/[id]` - Eliminar
- `POST /api/send-email` - Enviar email

### Fase 4: UI Components
- `NotificationBell.tsx` - Campana en navbar
- `NotificationPanel.tsx` - Panel completo
- Página `/dashboard/notificaciones`

### Fase 5: Integración
- Integrar en flujo de solicitudes
- Integrar en flujo de asignaciones
- Integrar en registro de usuarios

## 📊 Ventajas de Resend vs MailJS

| Característica | Resend | MailJS |
|---------------|--------|---------|
| Emails gratis/mes | 10,000 | 200 |
| Deliverability | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Configuración | Fácil | Media |
| Templates | React/HTML | HTML |
| Analytics | ✅ Sí | ❌ No |
| API moderna | ✅ Sí | ⚠️ Antigua |
| Verificación dominio | ✅ Fácil | ⚠️ Compleja |

## 🔒 Seguridad

- ✅ API Key en variables de entorno
- ✅ Validación de usuarios antes de enviar
- ✅ Rate limiting en endpoints
- ✅ Sanitización de contenido
- ✅ Solo usuarios autenticados pueden ver sus notificaciones

## 📈 Métricas

El sistema permitirá trackear:
- Notificaciones enviadas por tipo
- Tasa de apertura de emails
- Tiempo promedio de respuesta a solicitudes
- Notificaciones no leídas por usuario

## 🎯 Próximas Mejoras

1. **Notificaciones Push** (Web Push API)
2. **Preferencias de notificación** por usuario
3. **Digest diario** de notificaciones
4. **Webhooks** para integraciones externas
5. **Notificaciones en Slack/Discord** (opcional)
