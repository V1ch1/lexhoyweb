# Documentación de la Base de Datos

> Generado el: 2025-10-30T10:19:23.964Z

## Tabla: `despacho_ownership_requests`

### 🔑 Claves Primarias

- id

### 🔗 Relaciones

- **user_id** → users.id

### 📊 Índices

- **despacho_ownership_requests_user_id_despacho_id_key** (user_id, despacho_id) 🔒 Único

### ⚠️ Restricciones

- **despacho_ownership_requests_user_id_despacho_id_key**: UNIQUE (user_id, despacho_id)

### Columnas

| Nombre | Tipo | ¿Nulo? | Valor por defecto |
|--------|------|--------|-------------------|
| id | uuid | No | uuid_generate_v4() |
| user_id | uuid | No | Ninguno |
| despacho_id | uuid | No | Ninguno |
| status | text | No | 'pending'::text |
| message | text | Sí | Ninguno |
| created_at | timestamptz | Sí | now() |
| updated_at | timestamptz | Sí | now() |

---

## Tabla: `despacho_propiedad_historial`

> Historial de cambios de propiedad

### 🔑 Claves Primarias

- id

### 🔗 Relaciones

- **realizado_por** → users.id
- **user_id** → users.id
- **usuario_anterior** → users.id

### 📊 Índices

- **idx_historial_despacho** (despacho_id) 
- **idx_historial_usuario** (user_id) 
- **idx_historial_fecha** (created_at) 
- **idx_historial_accion** (accion) 

### ⚠️ Restricciones

- **despacho_propiedad_historial_accion_check**: CHECK ((accion = ANY (ARRAY['asignado'::text, 'transferido'::text, 'revocado'::text, 'colaborador_añadido'::text, 'colaborador_removido'::text])))

### Columnas

| Nombre | Tipo | ¿Nulo? | Valor por defecto |
|--------|------|--------|-------------------|
| id | uuid | No | gen_random_uuid() |
| despacho_id | uuid | No | Ninguno |
| user_id | uuid | Sí | Ninguno |
| accion | text | No | Ninguno |
| realizado_por | uuid | Sí | Ninguno |
| usuario_anterior | uuid | Sí | Ninguno |
| notas | text | Sí | Ninguno |
| metadata | jsonb | Sí | '{}'::jsonb |
| created_at | timestamptz | Sí | now() |

---

## Tabla: `despachos`

### 🔑 Claves Primarias

- id

### 📊 Índices

- **idx_despachos_slug** (slug) 
- **idx_despachos_wordpress_id** (wordpress_id) 
- **despachos_slug_key** (slug) 🔒 Único
- **despachos_wordpress_id_key** (wordpress_id) 🔒 Único

### ⚠️ Restricciones

- **despachos_slug_key**: UNIQUE (slug)
- **despachos_wordpress_id_key**: UNIQUE (wordpress_id)

### Columnas

| Nombre | Tipo | ¿Nulo? | Valor por defecto |
|--------|------|--------|-------------------|
| id | uuid | No | gen_random_uuid() |
| slug | text | No | Ninguno |
| nombre | text | No | Ninguno |
| created_at | timestamptz | Sí | now() |
| updated_at | timestamptz | Sí | now() |
| wordpress_id | int4 | Sí | Ninguno |
| featured_media_url | text | Sí | Ninguno |
| status | text | Sí | 'active'::text |

---

## Tabla: `lead_interactions`

### 🔑 Claves Primarias

- id

### 🔗 Relaciones

- **lead_id** → leads.id

### 📊 Índices

- **idx_lead_interactions_lead_id** (lead_id) 

### ⚠️ Restricciones

- **lead_interactions_resultado_check**: CHECK (((resultado)::text = ANY ((ARRAY['exitoso'::character varying, 'sin_respuesta'::character varying, 'reagendar'::character varying, 'no_interesado'::character varying, 'convertido'::character varying])::text[])))
- **lead_interactions_tipo_check**: CHECK (((tipo)::text = ANY ((ARRAY['llamada'::character varying, 'email'::character varying, 'reunion'::character varying, 'propuesta'::character varying, 'contrato'::character varying, 'nota'::character varying])::text[])))

### Columnas

| Nombre | Tipo | ¿Nulo? | Valor por defecto |
|--------|------|--------|-------------------|
| id | uuid | No | uuid_generate_v4() |
| lead_id | uuid | No | Ninguno |
| despacho_id | uuid | No | Ninguno |
| tipo | varchar | No | Ninguno |
| descripcion | text | Sí | Ninguno |
| fecha | timestamptz | Sí | now() |
| resultado | varchar | Sí | Ninguno |
| created_at | timestamptz | Sí | now() |

---

## Tabla: `leads`

### 🔑 Claves Primarias

- id

### 📊 Índices

- **idx_leads_despacho_id** (despacho_id) 
- **idx_leads_estado** (estado) 
- **idx_leads_especialidad** (especialidad) 
- **idx_leads_fecha_creacion** (fecha_creacion) 

### ⚠️ Restricciones

- **leads_estado_check**: CHECK (((estado)::text = ANY ((ARRAY['nuevo'::character varying, 'contactado'::character varying, 'cerrado'::character varying])::text[])))
- **leads_urgencia_check**: CHECK (((urgencia)::text = ANY ((ARRAY['baja'::character varying, 'media'::character varying, 'alta'::character varying, 'urgente'::character varying])::text[])))
- **leads_valoracion_check**: CHECK (((valoracion >= 1) AND (valoracion <= 5)))

### Columnas

| Nombre | Tipo | ¿Nulo? | Valor por defecto |
|--------|------|--------|-------------------|
| id | uuid | No | uuid_generate_v4() |
| despacho_id | uuid | No | Ninguno |
| sede_id | int4 | Sí | Ninguno |
| cliente_nombre | varchar | No | Ninguno |
| cliente_email | varchar | No | Ninguno |
| cliente_telefono | varchar | Sí | Ninguno |
| consulta | text | No | Ninguno |
| especialidad | varchar | No | Ninguno |
| urgencia | varchar | Sí | 'media'::character varying |
| presupuesto_estimado | numeric | Sí | Ninguno |
| provincia | varchar | Sí | Ninguno |
| ciudad | varchar | Sí | Ninguno |
| codigo_postal | varchar | Sí | Ninguno |
| estado | varchar | Sí | 'nuevo'::character varying |
| fecha_creacion | timestamptz | Sí | now() |
| fecha_asignacion | timestamptz | Sí | Ninguno |
| fecha_cierre | timestamptz | Sí | Ninguno |
| fuente | varchar | Sí | 'web'::character varying |
| utm_source | varchar | Sí | Ninguno |
| utm_medium | varchar | Sí | Ninguno |
| utm_campaign | varchar | Sí | Ninguno |
| notas | text | Sí | Ninguno |
| valoracion | int4 | Sí | Ninguno |
| feedback | text | Sí | Ninguno |
| created_at | timestamptz | Sí | now() |
| updated_at | timestamptz | Sí | now() |

---

## Tabla: `notificaciones`

### 🔑 Claves Primarias

- id

### 📊 Índices

- **idx_notificaciones_user_id** (user_id) 
- **idx_notificaciones_leida** (leida) 
- **idx_notificaciones_created_at** (created_at) 
- **idx_notificaciones_user_leida** (user_id, leida) 

### ⚠️ Restricciones

- **notificaciones_tipo_check**: CHECK ((tipo = ANY (ARRAY['solicitud_recibida'::text, 'solicitud_aprobada'::text, 'solicitud_rechazada'::text, 'solicitud_despacho'::text, 'despacho_asignado'::text, 'despacho_desasignado'::text, 'usuario_nuevo'::text, 'mensaje_sistema'::text])))

### Columnas

| Nombre | Tipo | ¿Nulo? | Valor por defecto |
|--------|------|--------|-------------------|
| id | uuid | No | gen_random_uuid() |
| user_id | text | No | Ninguno |
| tipo | text | No | Ninguno |
| titulo | text | No | Ninguno |
| mensaje | text | No | Ninguno |
| leida | bool | Sí | false |
| url | text | Sí | Ninguno |
| metadata | jsonb | Sí | '{}'::jsonb |
| created_at | timestamp | Sí | now() |
| updated_at | timestamp | Sí | now() |

---

## Tabla: `sedes`

### 🔑 Claves Primarias

- id

### 🔗 Relaciones

- **despacho_id** → despachos.id
- **user_id** → auth.users(id)

### 📊 Índices

- **sedes_wp_sede_id_key** (wp_sede_id) 🔒 Único
- **idx_sedes_despacho_id** (despacho_id) 
- **idx_sedes_es_principal** (es_principal) 
- **idx_sedes_activa** (activa) 
- **idx_sedes_unica_principal** (despacho_id) 🔒 Único
- **idx_sedes_wp_sede_id** (wp_sede_id) 

### ⚠️ Restricciones

- **sedes_wp_sede_id_key**: UNIQUE (wp_sede_id)

### Columnas

| Nombre | Tipo | ¿Nulo? | Valor por defecto |
|--------|------|--------|-------------------|
| id | uuid | No | gen_random_uuid() |
| despacho_id | uuid | No | Ninguno |
| wp_sede_id | text | Sí | Ninguno |
| nombre | text | No | Ninguno |
| descripcion | text | Sí | Ninguno |
| web | text | Sí | Ninguno |
| telefono | text | Sí | Ninguno |
| numero_colegiado | text | Sí | Ninguno |
| colegio | text | Sí | Ninguno |
| experiencia | text | Sí | Ninguno |
| es_principal | bool | Sí | false |
| activa | bool | Sí | true |
| foto_perfil | text | Sí | Ninguno |
| horarios | jsonb | Sí | '{}'::jsonb |
| redes_sociales | jsonb | Sí | '{}'::jsonb |
| observaciones | text | Sí | Ninguno |
| created_at | timestamptz | Sí | now() |
| updated_at | timestamptz | Sí | now() |
| ano_fundacion | int4 | Sí | Ninguno |
| persona_contacto | text | Sí | Ninguno |
| email_contacto | text | Sí | Ninguno |
| estado_verificacion | text | Sí | 'pendiente'::text |
| estado_registro | text | Sí | 'activo'::text |
| is_verified | bool | Sí | false |
| direccion | jsonb | Sí | '{}'::jsonb |
| localidad | text | Sí | Ninguno |
| provincia | text | Sí | Ninguno |
| codigo_postal | text | Sí | Ninguno |
| tamano_despacho | text | Sí | Ninguno |
| calle | text | Sí | Ninguno |
| numero | text | Sí | Ninguno |
| piso | text | Sí | Ninguno |
| pais | text | Sí | Ninguno |
| especialidades | text | Sí | Ninguno |
| servicios_especificos | text | Sí | Ninguno |
| areas_practica | _text | Sí | '{}'::text[] |

---

## Tabla: `sedes_areas_practica`

### 🔑 Claves Primarias

- id

### 🔗 Relaciones

- **sede_id** → sedes.id

### 📊 Índices

- **idx_sedes_areas_practica_sede_id** (sede_id) 
- **idx_sedes_areas_practica_area_nombre** (area_nombre) 
- **unique_sede_area** (sede_id, area_nombre) 🔒 Único
- **idx_sedes_areas_practica_sede** (sede_id) 
- **idx_sedes_areas_practica_area** (area_nombre) 

### ⚠️ Restricciones

- **unique_sede_area**: UNIQUE (sede_id, area_nombre)

### Columnas

| Nombre | Tipo | ¿Nulo? | Valor por defecto |
|--------|------|--------|-------------------|
| id | int4 | No | nextval('sedes_areas_practica_id_seq'::regclass) |
| sede_id | uuid | No | Ninguno |
| area_nombre | text | No | Ninguno |
| created_at | timestamptz | Sí | now() |

---

## Tabla: `solicitudes_despacho`

### 🔑 Claves Primarias

- id

### Columnas

| Nombre | Tipo | ¿Nulo? | Valor por defecto |
|--------|------|--------|-------------------|
| id | uuid | No | gen_random_uuid() |
| user_id | uuid | No | Ninguno |
| user_email | text | Sí | Ninguno |
| user_name | text | Sí | Ninguno |
| despacho_id | text | No | Ninguno |
| despacho_nombre | text | Sí | Ninguno |
| despacho_localidad | text | Sí | Ninguno |
| despacho_provincia | text | Sí | Ninguno |
| estado | text | Sí | 'pendiente'::text |
| fecha_solicitud | timestamp | Sí | now() |
| fecha_respuesta | timestamptz | Sí | Ninguno |
| respondido_por | text | Sí | Ninguno |
| notas_respuesta | text | Sí | Ninguno |

---

## Tabla: `sync_logs`

### 🔑 Claves Primarias

- id

### 📊 Índices

- **idx_sync_logs_tipo_fecha** (tipo, fecha_sync) 

### ⚠️ Restricciones

- **sync_logs_accion_check**: CHECK (((accion)::text = ANY ((ARRAY['create'::character varying, 'update'::character varying, 'delete'::character varying])::text[])))
- **sync_logs_entidad_check**: CHECK (((entidad)::text = ANY ((ARRAY['despacho'::character varying, 'sede'::character varying, 'user'::character varying])::text[])))
- **sync_logs_tipo_check**: CHECK (((tipo)::text = ANY ((ARRAY['algolia'::character varying, 'wordpress'::character varying])::text[])))

### Columnas

| Nombre | Tipo | ¿Nulo? | Valor por defecto |
|--------|------|--------|-------------------|
| id | uuid | No | uuid_generate_v4() |
| tipo | varchar | No | Ninguno |
| accion | varchar | No | Ninguno |
| entidad | varchar | No | Ninguno |
| entidad_id | uuid | No | Ninguno |
| datos_enviados | jsonb | Sí | Ninguno |
| respuesta_api | jsonb | Sí | Ninguno |
| exitoso | bool | Sí | false |
| error_mensaje | text | Sí | Ninguno |
| fecha_sync | timestamptz | Sí | now() |
| reintentos | int4 | Sí | 0 |
| created_at | timestamptz | Sí | now() |

---

## Tabla: `user_despachos`

> Tabla de asignación de despachos a usuarios con RLS habilitado

### 🔑 Claves Primarias

- id

### 🔗 Relaciones

- **asignado_por** → users.id

### 📊 Índices

- **user_despachos_user_id_despacho_id_key** (user_id, despacho_id) 🔒 Único
- **idx_user_despachos_user_id** (user_id) 
- **idx_user_despachos_despacho_id** (despacho_id) 
- **idx_user_despachos_activo** (activo) 
- **unique_user_despacho** (user_id, despacho_id) 🔒 Único

### ⚠️ Restricciones

- **unique_user_despacho**: UNIQUE (user_id, despacho_id)
- **user_despachos_user_id_despacho_id_key**: UNIQUE (user_id, despacho_id)

### Columnas

| Nombre | Tipo | ¿Nulo? | Valor por defecto |
|--------|------|--------|-------------------|
| id | uuid | No | uuid_generate_v4() |
| user_id | uuid | No | Ninguno |
| despacho_id | uuid | No | Ninguno |
| fecha_asignacion | timestamptz | Sí | now() |
| asignado_por | uuid | Sí | Ninguno |
| activo | bool | Sí | true |
| permisos | jsonb | Sí | '{"leer": true, "eliminar": false, "escribir": true}'::jsonb |
| created_at | timestamptz | Sí | now() |
| updated_at | timestamptz | Sí | now() |

---

## Tabla: `users`

### 🔑 Claves Primarias

- id

### 🔗 Relaciones

- **aprobado_por** → users.id

### 📊 Índices

- **users_email_key** (email) 🔒 Único
- **idx_users_rol** (rol) 
- **idx_users_estado** (estado) 

### ⚠️ Restricciones

- **users_email_key**: UNIQUE (email)
- **users_estado_check**: CHECK (((estado)::text = ANY ((ARRAY['pendiente'::character varying, 'activo'::character varying, 'inactivo'::character varying, 'suspendido'::character varying])::text[])))
- **users_plan_check**: CHECK (((plan)::text = ANY ((ARRAY['basico'::character varying, 'profesional'::character varying, 'enterprise'::character varying])::text[])))
- **users_rol_check**: CHECK (((rol)::text = ANY ((ARRAY['super_admin'::character varying, 'despacho_admin'::character varying, 'usuario'::character varying])::text[])))

### Columnas

| Nombre | Tipo | ¿Nulo? | Valor por defecto |
|--------|------|--------|-------------------|
| id | uuid | No | uuid_generate_v4() |
| email | varchar | No | Ninguno |
| nombre | varchar | No | Ninguno |
| apellidos | varchar | No | Ninguno |
| telefono | varchar | Sí | Ninguno |
| fecha_registro | timestamptz | Sí | now() |
| ultimo_acceso | timestamptz | Sí | Ninguno |
| activo | bool | Sí | true |
| email_verificado | bool | Sí | false |
| plan | varchar | Sí | 'basico'::character varying |
| despacho_id | uuid | Sí | Ninguno |
| created_at | timestamptz | Sí | now() |
| updated_at | timestamptz | Sí | now() |
| rol | varchar | Sí | 'usuario'::character varying |
| estado | varchar | Sí | 'pendiente'::character varying |
| fecha_aprobacion | timestamptz | Sí | Ninguno |
| aprobado_por | uuid | Sí | Ninguno |
| notas_admin | text | Sí | Ninguno |

---

