# 📊 Estructura de Base de Datos - LexHoy

> **Última actualización**: 2025-10-03
> **Este es el documento oficial de la estructura de la base de datos**

---

## 📋 Tabla: `despachos`

**Descripción**: Almacena información de los despachos jurídicos

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | NO | uuid_generate_v4() | ID único del despacho |
| `object_id` | varchar(100) | NO | - | ID para sincronización (WordPress/Algolia) |
| `nombre` | varchar(255) | NO | - | Nombre del despacho |
| `descripcion` | text | YES | - | Descripción del despacho |
| `num_sedes` | integer | YES | 1 | Número de sedes |
| `areas_practica` | text[] | YES | '{}' | Áreas de práctica legal |
| `ultima_actualizacion` | timestamptz | YES | now() | Última actualización |
| `slug` | varchar(255) | NO | - | Slug único para URLs |
| `fecha_creacion` | timestamptz | YES | now() | Fecha de creación |
| `fecha_actualizacion` | timestamptz | YES | now() | Fecha de actualización |
| `verificado` | boolean | YES | false | Si está verificado |
| `activo` | boolean | YES | true | Si está activo |
| `created_at` | timestamptz | YES | now() | Timestamp de creación |
| `updated_at` | timestamptz | YES | now() | Timestamp de actualización |
| `estado_registro` | varchar(20) | YES | 'borrador' | Estado del registro |
| `fecha_solicitud` | timestamptz | YES | - | Fecha de solicitud |
| `fecha_aprobacion` | timestamptz | YES | - | Fecha de aprobación |
| `aprobado_por` | uuid | YES | - | ID del admin que aprobó |
| `notas_aprobacion` | text | YES | - | Notas de aprobación |
| `sincronizado_algolia` | boolean | YES | false | ✅ Sincronizado con Algolia |
| `sincronizado_wordpress` | boolean | YES | false | Sincronizado con WordPress |
| `fecha_sync_algolia` | timestamptz | YES | - | Fecha sync Algolia |
| `fecha_sync_wordpress` | timestamptz | YES | - | Fecha sync WordPress |
| `owner_email` | text | YES | - | Email del propietario |
| `direccion` | text | YES | - | Dirección |
| `telefono` | text | YES | - | Teléfono |
| `email` | text | YES | - | Email |
| `web` | text | YES | - | Sitio web |
| `wp_post_id` | integer | YES | - | ID del post en WordPress |
| **`sincronizado_wp`** | **boolean** | **YES** | **false** | **✅ Sincronizado con WP** |
| **`ultima_sincronizacion`** | **timestamp** | **YES** | **-** | **✅ Última sincronización** |

---

## 📋 Tabla: `sedes`

**Descripción**: Almacena las sedes/oficinas de cada despacho

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | integer | NO | nextval('sedes_id_seq') | ID único de la sede |
| `despacho_id` | uuid | NO | - | FK a despachos |
| `nombre` | varchar(255) | NO | - | Nombre de la sede |
| `descripcion` | text | YES | - | Descripción |
| `web` | varchar(255) | YES | - | Sitio web |
| `ano_fundacion` | varchar(4) | YES | - | Año de fundación |
| `tamano_despacho` | varchar(50) | YES | - | Tamaño del despacho |
| `persona_contacto` | varchar(255) | YES | - | Persona de contacto |
| `email_contacto` | varchar(255) | YES | - | Email de contacto |
| `telefono` | varchar(20) | YES | - | Teléfono |
| `numero_colegiado` | varchar(50) | YES | - | Número de colegiado |
| `colegio` | varchar(255) | YES | - | Colegio de abogados |
| `experiencia` | text | YES | - | Experiencia |
| `calle` | varchar(255) | YES | - | Calle |
| `numero` | varchar(10) | YES | - | Número |
| `piso` | varchar(10) | YES | - | Piso |
| `localidad` | varchar(100) | YES | - | Localidad |
| `provincia` | varchar(100) | YES | - | Provincia |
| `codigo_postal` | varchar(10) | YES | - | Código postal |
| `pais` | varchar(50) | YES | 'España' | País |
| `especialidades` | text | YES | - | Especialidades |
| `servicios_especificos` | text | YES | - | Servicios específicos |
| `areas_practica` | text[] | YES | '{}' | Áreas de práctica |
| `estado_verificacion` | varchar(20) | YES | 'pendiente' | Estado de verificación |
| `estado_registro` | varchar(20) | YES | 'activo' | Estado de registro |
| `is_verified` | boolean | YES | false | Si está verificado |
| `es_principal` | boolean | YES | false | Si es sede principal |
| `activa` | boolean | YES | true | Si está activa |
| `foto_perfil` | varchar(500) | YES | - | URL foto de perfil |
| `horarios` | jsonb | YES | '{}' | Horarios de atención |
| `redes_sociales` | jsonb | YES | '{}' | Redes sociales |
| `observaciones` | text | YES | - | Observaciones |
| `created_at` | timestamptz | YES | now() | Timestamp de creación |
| `updated_at` | timestamptz | YES | now() | Timestamp de actualización |
| **`sincronizado_wp`** | **boolean** | **YES** | **false** | **✅ Sincronizado con WP** |

---

## 📋 Tabla: `users`

**Descripción**: Almacena los usuarios del sistema

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | NO | uuid_generate_v4() | ID único del usuario |
| `email` | varchar(255) | NO | - | Email (único) |
| `nombre` | varchar(100) | NO | - | Nombre |
| `apellidos` | varchar(100) | NO | - | Apellidos |
| `telefono` | varchar(20) | YES | - | Teléfono |
| `fecha_registro` | timestamptz | YES | now() | Fecha de registro |
| `ultimo_acceso` | timestamptz | YES | - | Último acceso |
| `activo` | boolean | YES | true | Si está activo |
| `email_verificado` | boolean | YES | false | Si email está verificado |
| `plan` | varchar(20) | YES | 'basico' | Plan del usuario |
| `despacho_id` | uuid | YES | - | FK a despachos (legacy) |
| `created_at` | timestamptz | YES | now() | Timestamp de creación |
| `updated_at` | timestamptz | YES | now() | Timestamp de actualización |
| `rol` | varchar(20) | YES | 'usuario' | Rol (super_admin, despacho_admin, usuario) |
| `estado` | varchar(20) | YES | 'pendiente' | Estado (pendiente, aprobado, rechazado) |
| `fecha_aprobacion` | timestamptz | YES | - | Fecha de aprobación |
| `aprobado_por` | uuid | YES | - | ID del admin que aprobó |
| `notas_admin` | text | YES | - | Notas del administrador |

---

## 📋 Tabla: `user_despachos`

**Descripción**: Relación muchos a muchos entre usuarios y despachos

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | NO | uuid_generate_v4() | ID único |
| `user_id` | uuid | NO | - | FK a users |
| `despacho_id` | uuid | NO | - | FK a despachos |
| `fecha_asignacion` | timestamptz | YES | now() | Fecha de asignación |
| `asignado_por` | uuid | YES | - | ID del admin que asignó |
| `activo` | boolean | YES | true | Si está activo |
| `permisos` | jsonb | YES | {...} | Permisos (leer, escribir, eliminar) |
| `created_at` | timestamptz | YES | now() | Timestamp de creación |
| `updated_at` | timestamptz | YES | now() | Timestamp de actualización |

---

## 📋 Tabla: `solicitudes_despacho`

**Descripción**: Solicitudes de propiedad de despachos

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | ID único |
| `user_id` | uuid | NO | - | FK a users |
| `user_email` | text | YES | - | Email del usuario |
| `user_name` | text | YES | - | Nombre del usuario |
| `despacho_id` | text | NO | - | ID del despacho (text!) |
| `despacho_nombre` | text | YES | - | Nombre del despacho |
| `despacho_localidad` | text | YES | - | Localidad |
| `despacho_provincia` | text | YES | - | Provincia |
| `estado` | text | YES | 'pendiente' | Estado (pendiente, aprobado, rechazado) |
| `fecha_solicitud` | timestamp | YES | now() | Fecha de solicitud |
| `fecha_respuesta` | timestamptz | YES | - | Fecha de respuesta |
| `respondido_por` | text | YES | - | ID del admin que respondió |
| `notas_respuesta` | text | YES | - | Notas de respuesta |

---

## 🔑 Relaciones Clave

```
users (1) ──── (N) user_despachos (N) ──── (1) despachos
                                                    │
                                                    │
                                                   (1)
                                                    │
                                                   (N)
                                                  sedes

users (1) ──── (N) solicitudes_despacho (N) ──── (1) despachos
```

---

## ✅ Columnas Importantes para Sincronización

### En `despachos`:
- ✅ `sincronizado_wp` (boolean) - Marca si está sincronizado con WordPress
- ✅ `ultima_sincronizacion` (timestamp) - Última vez que se sincronizó
- ✅ `object_id` (varchar) - ID para WordPress/Algolia
- ✅ `wp_post_id` (integer) - ID del post en WordPress

### En `sedes`:
- ✅ `sincronizado_wp` (boolean) - Marca si está sincronizado con WordPress

---

## 🚨 Notas Importantes

1. **`despacho_id` en `solicitudes_despacho` es TEXT**, no UUID
2. **`users.despacho_id`** es legacy, usar `user_despachos` para relaciones
3. **Las columnas de sincronización YA EXISTEN** en la BD

---

---

## 📋 Tabla: `notificaciones`

**Descripción**: Sistema de notificaciones para usuarios

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | ID único |
| `user_id` | text | NO | - | ID del usuario |
| `tipo` | text | NO | - | Tipo de notificación |
| `titulo` | text | NO | - | Título |
| `mensaje` | text | NO | - | Mensaje |
| `leida` | boolean | YES | false | Si fue leída |
| `url` | text | YES | - | URL relacionada |
| `metadata` | jsonb | YES | '{}' | Metadata adicional |
| `created_at` | timestamp | YES | now() | Timestamp de creación |
| `updated_at` | timestamp | YES | now() | Timestamp de actualización |

---

## 📋 Tabla: `leads`

**Descripción**: Leads/consultas de clientes potenciales

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | NO | uuid_generate_v4() | ID único |
| `despacho_id` | uuid | NO | - | FK a despachos |
| `sede_id` | integer | YES | - | FK a sedes |
| `cliente_nombre` | varchar(255) | NO | - | Nombre del cliente |
| `cliente_email` | varchar(255) | NO | - | Email del cliente |
| `cliente_telefono` | varchar(20) | YES | - | Teléfono |
| `consulta` | text | NO | - | Consulta del cliente |
| `especialidad` | varchar(100) | NO | - | Especialidad requerida |
| `urgencia` | varchar(20) | YES | 'media' | Urgencia (baja, media, alta) |
| `presupuesto_estimado` | numeric | YES | - | Presupuesto estimado |
| `provincia` | varchar(100) | YES | - | Provincia |
| `ciudad` | varchar(100) | YES | - | Ciudad |
| `codigo_postal` | varchar(10) | YES | - | Código postal |
| `estado` | varchar(20) | YES | 'nuevo' | Estado del lead |
| `fecha_creacion` | timestamptz | YES | now() | Fecha de creación |
| `fecha_asignacion` | timestamptz | YES | - | Fecha de asignación |
| `fecha_cierre` | timestamptz | YES | - | Fecha de cierre |
| `fuente` | varchar(100) | YES | 'web' | Fuente del lead |
| `utm_source` | varchar(100) | YES | - | UTM source |
| `utm_medium` | varchar(100) | YES | - | UTM medium |
| `utm_campaign` | varchar(100) | YES | - | UTM campaign |
| `notas` | text | YES | - | Notas internas |
| `valoracion` | integer | YES | - | Valoración del cliente |
| `feedback` | text | YES | - | Feedback del cliente |
| `created_at` | timestamptz | YES | now() | Timestamp de creación |
| `updated_at` | timestamptz | YES | now() | Timestamp de actualización |

---

## 📋 Tabla: `lead_interactions`

**Descripción**: Interacciones con los leads

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | NO | uuid_generate_v4() | ID único |
| `lead_id` | uuid | NO | - | FK a leads |
| `despacho_id` | uuid | NO | - | FK a despachos |
| `tipo` | varchar(20) | NO | - | Tipo de interacción |
| `descripcion` | text | YES | - | Descripción |
| `fecha` | timestamptz | YES | now() | Fecha de la interacción |
| `resultado` | varchar(20) | YES | - | Resultado |
| `created_at` | timestamptz | YES | now() | Timestamp de creación |

---

## 📋 Tabla: `sync_logs`

**Descripción**: Logs de sincronización con servicios externos

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | NO | uuid_generate_v4() | ID único |
| `tipo` | varchar(20) | NO | - | Tipo (algolia, wordpress) |
| `accion` | varchar(20) | NO | - | Acción (create, update, delete) |
| `entidad` | varchar(20) | NO | - | Entidad (despacho, sede) |
| `entidad_id` | uuid | NO | - | ID de la entidad |
| `datos_enviados` | jsonb | YES | - | Datos enviados |
| `respuesta_api` | jsonb | YES | - | Respuesta de la API |
| `exitoso` | boolean | YES | false | Si fue exitoso |
| `error_mensaje` | text | YES | - | Mensaje de error |
| `fecha_sync` | timestamptz | YES | now() | Fecha de sincronización |
| `reintentos` | integer | YES | 0 | Número de reintentos |
| `created_at` | timestamptz | YES | now() | Timestamp de creación |

---

## 🔑 Relaciones Completas

```
users (1) ──── (N) user_despachos (N) ──── (1) despachos
                                                    │
                                                    ├──── (N) sedes
                                                    │
                                                    └──── (N) leads ──── (N) lead_interactions

users (1) ──── (N) solicitudes_despacho (N) ──── (1) despachos

users (1) ──── (N) notificaciones

despachos/sedes ──── (N) sync_logs
```

---

## 📊 Resumen de Tablas

| Tabla | Registros Típicos | Propósito |
|-------|-------------------|-----------|
| `despachos` | Cientos | Despachos jurídicos |
| `sedes` | Miles | Oficinas de despachos |
| `users` | Miles | Usuarios del sistema |
| `user_despachos` | Miles | Relación usuarios-despachos |
| `solicitudes_despacho` | Cientos | Solicitudes de propiedad |
| `leads` | Miles | Consultas de clientes |
| `lead_interactions` | Miles | Seguimiento de leads |
| `notificaciones` | Miles | Notificaciones a usuarios |
| `sync_logs` | Miles | Logs de sincronización |

---

## ✅ Estado de la Documentación

- ✅ **9 tablas documentadas completamente**
- ✅ **Todas las columnas con tipos y defaults**
- ✅ **Relaciones mapeadas**
- ✅ **Columnas de sincronización identificadas**

---

## 📝 Próximos Pasos

- [x] Documentar todas las tablas
- [ ] Borrar archivos SQL antiguos
- [ ] Probar importación de despachos
- [ ] Verificar flujo completo
