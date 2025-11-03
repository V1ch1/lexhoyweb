# 📡 Documentación de API

Documentación completa de todos los endpoints de la API de LexHoy Portal.

---

## 📋 Tabla de Contenidos

- [Autenticación](#autenticación)
- [Despachos](#despachos)
- [Solicitudes](#solicitudes)
- [Usuarios](#usuarios)
- [Administración](#administración)
- [Notificaciones](#notificaciones)
- [Webhooks](#webhooks)

---

## 🔐 Autenticación

Todos los endpoints protegidos requieren un token JWT en el header:

```http
Authorization: Bearer <token>
```

### Obtener Token

El token se obtiene a través de Supabase Auth:

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

const token = data.session?.access_token;
```

---

## 🏢 Despachos

### GET /api/despachos/check

Verifica si un despacho existe en la base de datos.

**Query Parameters:**
- `slug` (string, required): Slug del despacho

**Response:**
```json
{
  "exists": true,
  "despacho": {
    "id": "uuid",
    "nombre": "Despacho Ejemplo",
    "slug": "despacho-ejemplo"
  }
}
```

---

### POST /api/crear-despacho

Crea un nuevo despacho.

**Headers:**
```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "nombre": "Despacho Ejemplo",
  "email": "contacto@despacho.com",
  "telefono": "+34 123 456 789",
  "direccion": "Calle Ejemplo 123",
  "ciudad": "Madrid",
  "provincia": "Madrid",
  "codigo_postal": "28001"
}
```

**Response:**
```json
{
  "success": true,
  "despacho": {
    "id": "uuid",
    "nombre": "Despacho Ejemplo",
    "slug": "despacho-ejemplo"
  }
}
```

---

### GET /api/despachos/wordpress/buscar

Busca despachos en WordPress.

**Query Parameters:**
- `search` (string, required): Término de búsqueda

**Response:**
```json
{
  "despachos": [
    {
      "id": 123,
      "title": "Despacho Ejemplo",
      "slug": "despacho-ejemplo",
      "acf": {
        "email": "contacto@despacho.com",
        "telefono": "+34 123 456 789"
      }
    }
  ]
}
```

---

### POST /api/despachos/wordpress/importar

Importa un despacho desde WordPress.

**Headers:**
```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "wordpressId": 123
}
```

**Response:**
```json
{
  "success": true,
  "despacho": {
    "id": "uuid",
    "nombre": "Despacho Ejemplo",
    "wordpress_id": 123
  }
}
```

---

## 📝 Solicitudes

### POST /api/solicitar-despacho

Crea una solicitud para unirse a un despacho.

**Headers:**
```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "despachoId": "uuid",
  "mensaje": "Me gustaría unirme al despacho"
}
```

**Response:**
```json
{
  "success": true,
  "solicitud": {
    "id": "uuid",
    "user_id": "uuid",
    "despacho_id": "uuid",
    "estado": "pendiente"
  }
}
```

---

### POST /api/aprobar-solicitud

Aprueba una solicitud de despacho (solo super_admin).

**Headers:**
```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "solicitudId": "uuid",
  "notas": "Solicitud aprobada"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Solicitud aprobada correctamente"
}
```

**Errors:**
```json
{
  "error": "ID de solicitud inválido",
  "field": "solicitudId"
}
```

---

### POST /api/rechazar-solicitud

Rechaza una solicitud de despacho (solo super_admin).

**Headers:**
```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "solicitudId": "uuid",
  "notas": "Motivo del rechazo"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Solicitud rechazada correctamente"
}
```

---

### GET /api/solicitudes-despacho-pendientes

Obtiene todas las solicitudes pendientes (solo super_admin).

**Headers:**
```http
Authorization: Bearer <token>
```

**Response:**
```json
{
  "solicitudes": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "despacho_id": "uuid",
      "estado": "pendiente",
      "mensaje": "...",
      "created_at": "2025-11-03T10:00:00Z",
      "user": {
        "email": "user@example.com",
        "nombre": "Usuario"
      },
      "despacho": {
        "nombre": "Despacho Ejemplo"
      }
    }
  ]
}
```

---

### GET /api/mis-solicitudes

Obtiene las solicitudes del usuario actual.

**Headers:**
```http
Authorization: Bearer <token>
```

**Response:**
```json
{
  "solicitudes": [
    {
      "id": "uuid",
      "despacho_id": "uuid",
      "estado": "pendiente",
      "mensaje": "...",
      "created_at": "2025-11-03T10:00:00Z",
      "despacho": {
        "nombre": "Despacho Ejemplo"
      }
    }
  ]
}
```

---

### POST /api/cancelar-solicitud-despacho

Cancela una solicitud pendiente.

**Headers:**
```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "solicitudId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Solicitud cancelada correctamente"
}
```

---

## 👥 Usuarios

### GET /api/users/[userId]/despachos

Obtiene los despachos de un usuario.

**Headers:**
```http
Authorization: Bearer <token>
```

**Response:**
```json
{
  "despachos": [
    {
      "id": "uuid",
      "nombre": "Despacho Ejemplo",
      "rol": "despacho_admin"
    }
  ]
}
```

---

### GET /api/users/[userId]/solicitudes-despacho

Obtiene las solicitudes de un usuario.

**Headers:**
```http
Authorization: Bearer <token>
```

**Response:**
```json
{
  "solicitudes": [
    {
      "id": "uuid",
      "despacho_id": "uuid",
      "estado": "pendiente"
    }
  ]
}
```

---

## 👨‍💼 Administración

### GET /api/admin/stats

Obtiene estadísticas del sistema (solo super_admin).

**Headers:**
```http
Authorization: Bearer <token>
```

**Response:**
```json
{
  "users": 150,
  "despachos": 45,
  "solicitudes_pendientes": 12,
  "leads": 230
}
```

---

### POST /api/admin/activate-user

Activa un usuario (solo super_admin).

**Headers:**
```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "userId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Usuario activado correctamente"
}
```

---

### POST /api/admin/set-owner

Asigna un propietario a un despacho (solo super_admin).

**Headers:**
```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "userId": "uuid",
  "despachoId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Propietario asignado correctamente"
}
```

---

## 🔔 Notificaciones

### GET /api/notifications

Obtiene las notificaciones del usuario.

**Headers:**
```http
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit` (number, optional): Número de notificaciones (default: 50)
- `offset` (number, optional): Offset para paginación (default: 0)

**Response:**
```json
{
  "notifications": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "tipo": "solicitud_aprobada",
      "titulo": "Solicitud aprobada",
      "mensaje": "Tu solicitud ha sido aprobada",
      "leida": false,
      "created_at": "2025-11-03T10:00:00Z"
    }
  ]
}
```

---

### PUT /api/notifications/[id]

Marca una notificación como leída.

**Headers:**
```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "leida": true
}
```

**Response:**
```json
{
  "success": true
}
```

---

## 📧 Email

### POST /api/send-email

Envía un email usando Resend.

**Headers:**
```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "to": "user@example.com",
  "subject": "Asunto del email",
  "html": "<p>Contenido HTML</p>"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "msg_123456"
}
```

---

## 🔗 Webhooks

### POST /api/webhook

Recibe webhooks de servicios externos.

**Headers:**
```http
Content-Type: application/json
X-Webhook-Secret: <secret>
```

**Body:**
```json
{
  "event": "despacho.updated",
  "data": {
    "id": 123,
    "nombre": "Despacho Ejemplo"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Webhook procesado"
}
```

---

### POST /api/sync-despacho

Sincroniza un despacho con WordPress.

**Headers:**
```http
Content-Type: application/json
X-Webhook-Secret: <secret>
```

**Body:**
```json
{
  "wordpressId": 123
}
```

**Response:**
```json
{
  "success": true,
  "despacho": {
    "id": "uuid",
    "wordpress_id": 123
  }
}
```

---

## ⚠️ Códigos de Error

| Código | Descripción |
|--------|-------------|
| 400 | Bad Request - Datos inválidos |
| 401 | Unauthorized - No autenticado |
| 403 | Forbidden - Sin permisos |
| 404 | Not Found - Recurso no encontrado |
| 409 | Conflict - Conflicto (ej: ya existe) |
| 500 | Internal Server Error - Error del servidor |

### Formato de Error

```json
{
  "error": "Mensaje de error",
  "field": "campo_con_error",
  "details": "Detalles adicionales"
}
```

---

## 🔒 Seguridad

### Validación

Todos los endpoints validan:
- ✅ UUIDs con `validateUUID()`
- ✅ Emails con `validateEmail()`
- ✅ Entrada sanitizada con `sanitizeString()`

### Rate Limiting

- **Endpoints públicos**: 100 req/min
- **Endpoints autenticados**: 1000 req/min
- **Endpoints admin**: Sin límite

---

## 📚 Ejemplos de Uso

### JavaScript/TypeScript

```typescript
// Crear solicitud
const response = await fetch('/api/solicitar-despacho', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    despachoId: 'uuid',
    mensaje: 'Mensaje'
  })
});

const data = await response.json();
```

### cURL

```bash
curl -X POST https://lexhoy.com/api/solicitar-despacho \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"despachoId":"uuid","mensaje":"Mensaje"}'
```

---

**Última actualización**: 3 de noviembre de 2025  
**Versión**: 1.0.0
