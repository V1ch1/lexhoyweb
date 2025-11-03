# 📋 TAREAS PENDIENTES - LexHoy Portal

**Fecha de creación**: 3 de noviembre de 2025  
**Estado**: En progreso

---

## 🎯 Resumen de Progreso

- [ ] **Gestión de Sedes** (0/3 tareas) - 0%
- [ ] **Alta Manual de Despachos** (0/4 tareas) - 0%
- [ ] **Sincronización WordPress ↔ Next.js** (0/5 tareas) - 0%

**Total**: 0/12 tareas completadas (0%)

---

## 📦 FASE 1: Gestión de Sedes

### ✅ Estado Actual
- ✅ Edición de sedes existentes funciona
- ✅ Los cambios se guardan en Supabase
- ❌ No se pueden añadir nuevas sedes
- ❌ No se pueden eliminar sedes

### 🎯 Tareas

#### [ ] Tarea 1.1: Implementar "Añadir Nueva Sede"
**Prioridad**: 🔴 Alta  
**Tiempo estimado**: 45 minutos

**Descripción:**
Permitir al usuario añadir nuevas sedes a un despacho existente.

**Archivos a modificar:**
- `app/dashboard/despachos/[slug]/page.tsx`
- `app/api/sedes/crear/route.ts` (crear)

**Funcionalidad:**
- Botón "Añadir Nueva Sede" en la página del despacho
- Modal/formulario con todos los campos de una sede:
  - Nombre de la sede
  - Dirección completa (calle, número, piso, CP, localidad, provincia, país)
  - Contacto (teléfono, email, persona de contacto)
  - Información profesional (número colegiado, colegio, experiencia)
  - Áreas de práctica (multiselect)
  - Horarios
  - Redes sociales
  - Foto de perfil (500x500px)
  - Marcar como sede principal (solo si no hay otra)
- Validación de campos obligatorios
- Guardar en tabla `sedes` con `despacho_id` correcto

**Verificación:**
```bash
# Crear nueva sede y verificar en Supabase
SELECT * FROM sedes WHERE despacho_id = 'uuid-del-despacho' ORDER BY created_at DESC;
```

---

#### [ ] Tarea 1.2: Implementar "Eliminar Sede"
**Prioridad**: 🟡 Media  
**Tiempo estimado**: 30 minutos

**Descripción:**
Permitir eliminar sedes (excepto la principal si es la única).

**Archivos a modificar:**
- `app/dashboard/despachos/[slug]/page.tsx`
- `app/api/sedes/[id]/route.ts` (crear endpoint DELETE)

**Funcionalidad:**
- Botón "Eliminar" en cada sede
- Confirmación antes de eliminar
- No permitir eliminar si:
  - Es la única sede del despacho
  - Es la sede principal y hay otras sedes (primero cambiar principal)
- Soft delete (marcar como `activa: false`) o hard delete según preferencia

**Verificación:**
```bash
# Verificar que la sede se eliminó o marcó como inactiva
SELECT * FROM sedes WHERE id = 'uuid-de-la-sede';
```

---

#### [ ] Tarea 1.3: Gestión de Sede Principal
**Prioridad**: 🟡 Media  
**Tiempo estimado**: 20 minutos

**Descripción:**
Permitir cambiar qué sede es la principal.

**Archivos a modificar:**
- `app/dashboard/despachos/[slug]/page.tsx`

**Funcionalidad:**
- Botón "Marcar como Principal" en sedes no principales
- Al cambiar, actualizar `es_principal = true` en la nueva y `false` en la anterior
- Solo puede haber una sede principal por despacho

**Verificación:**
```sql
-- Verificar que solo hay una sede principal
SELECT COUNT(*) FROM sedes 
WHERE despacho_id = 'uuid' AND es_principal = true;
-- Debe devolver 1
```

---

## 🏢 FASE 2: Alta Manual de Despachos

### ✅ Estado Actual
- ✅ Importación desde WordPress funciona
- ❌ No existe formulario de alta manual
- ❌ No se puede crear despacho desde cero

### 🎯 Tareas

#### [ ] Tarea 2.1: Crear Página "Nuevo Despacho"
**Prioridad**: 🔴 Alta  
**Tiempo estimado**: 1 hora

**Descripción:**
Crear página para dar de alta un despacho manualmente.

**Archivos a crear:**
- `app/dashboard/despachos/nuevo/page.tsx`

**Funcionalidad:**
- Formulario completo con:
  - **Información básica:**
    - Nombre del despacho (obligatorio)
    - Descripción
    - Web
    - Email general
  - **Primera sede (obligatoria):**
    - Todos los campos de una sede
    - Se marcará automáticamente como principal
  - **Áreas de práctica** (multiselect)
  - **Servicios adicionales**
- Validación de campos obligatorios
- Preview de cómo quedará el despacho

**Navegación:**
- Botón "Crear Nuevo Despacho" en `/dashboard/despachos`
- Breadcrumb: Dashboard > Despachos > Nuevo

---

#### [ ] Tarea 2.2: API para Crear Despacho Manual
**Prioridad**: 🔴 Alta  
**Tiempo estimado**: 45 minutos

**Descripción:**
Endpoint para crear despacho y su primera sede.

**Archivos a modificar/crear:**
- `app/api/despachos/crear-manual/route.ts` (crear)

**Funcionalidad:**
- Recibir datos del despacho + primera sede
- Validar con `lib/validation.ts`
- Crear transacción:
  1. Insertar en `despachos`
  2. Insertar primera sede en `sedes` con `es_principal = true`
  3. Crear relación en `user_despachos` con el usuario actual
- Generar slug único para el despacho
- Devolver ID del despacho creado

**Validaciones:**
- Nombre del despacho no vacío
- Email válido
- Al menos una área de práctica
- Dirección completa de la primera sede

---

#### [ ] Tarea 2.3: Verificación de Despacho Duplicado
**Prioridad**: 🟡 Media  
**Tiempo estimado**: 30 minutos

**Descripción:**
Antes de crear, verificar si ya existe un despacho similar.

**Archivos a modificar:**
- `app/api/despachos/verificar-duplicado/route.ts` (crear)
- `app/dashboard/despachos/nuevo/page.tsx`

**Funcionalidad:**
- Al escribir el nombre, buscar despachos similares
- Mostrar sugerencias si encuentra coincidencias
- Permitir continuar si el usuario confirma que es diferente
- Búsqueda por:
  - Nombre similar (fuzzy search)
  - Misma dirección
  - Mismo teléfono/email

---

#### [ ] Tarea 2.4: Flujo de Aprobación para Nuevos Despachos
**Prioridad**: 🟢 Baja  
**Tiempo estimado**: 30 minutos

**Descripción:**
Los despachos creados manualmente requieren aprobación de super_admin.

**Archivos a modificar:**
- `app/api/despachos/crear-manual/route.ts`
- `app/admin/despachos/pendientes/page.tsx` (crear)

**Funcionalidad:**
- Despachos nuevos se crean con `estado: 'pendiente'`
- Notificar a super_admins
- Panel de admin para aprobar/rechazar
- Al aprobar, cambiar estado a `activo`

---

## 🔄 FASE 3: Sincronización WordPress ↔ Next.js

### ✅ Estado Actual
- ✅ Importación WordPress → Supabase funciona
- ❌ Cambios en Next.js no se sincronizan a WordPress
- ❌ Cambios en WordPress no se sincronizan automáticamente a Next.js

### 🎯 Tareas

#### [ ] Tarea 3.1: Sincronización Next.js → WordPress
**Prioridad**: 🔴 Alta  
**Tiempo estimado**: 2 horas

**Descripción:**
Cuando se edita un despacho en Next.js, actualizar en WordPress.

**Archivos a modificar:**
- `app/api/sync-despacho/route.ts` (ya existe, mejorar)
- `lib/wordpress-sync.ts` (crear servicio)

**Funcionalidad:**
- Al guardar cambios en un despacho con `wordpress_id`:
  1. Actualizar datos en Supabase
  2. Llamar a WordPress REST API para actualizar
  3. Mapear campos de Supabase a ACF de WordPress
- Campos a sincronizar:
  - Nombre, descripción, web, email
  - Áreas de práctica
  - Datos de contacto de sede principal
  - Foto de perfil
- Manejo de errores:
  - Si falla WordPress, guardar en cola de sincronización
  - Reintentar automáticamente

**Autenticación WordPress:**
```typescript
const auth = Buffer.from(
  `${process.env.WORDPRESS_USERNAME}:${process.env.WORDPRESS_APPLICATION_PASSWORD}`
).toString('base64');
```

---

#### [ ] Tarea 3.2: Webhook WordPress → Next.js
**Prioridad**: 🔴 Alta  
**Tiempo estimado**: 1.5 horas

**Descripción:**
Recibir notificaciones cuando se actualiza un despacho en WordPress.

**Archivos a modificar:**
- `app/api/webhook/wordpress/route.ts` (mejorar existente)

**Funcionalidad:**
- Endpoint público con autenticación por secret
- Recibir webhook de WordPress cuando:
  - Se crea un despacho
  - Se actualiza un despacho
  - Se elimina un despacho
- Actualizar Supabase con los cambios
- Validar que el webhook viene de WordPress (verificar secret)

**Configuración en WordPress:**
Instalar plugin de webhooks o usar código personalizado:
```php
// En functions.php de WordPress
add_action('save_post_despachos', 'notify_nextjs_on_update', 10, 3);
```

---

#### [ ] Tarea 3.3: Cola de Sincronización
**Prioridad**: 🟡 Media  
**Tiempo estimado**: 1 hora

**Descripción:**
Sistema de cola para sincronizaciones fallidas.

**Archivos a crear:**
- `lib/sync-queue.ts`
- Tabla en Supabase: `sync_queue`

**Funcionalidad:**
- Guardar sincronizaciones fallidas en cola
- Reintentar automáticamente (exponential backoff)
- Panel de admin para ver sincronizaciones pendientes
- Botón para forzar reintento manual

**Tabla `sync_queue`:**
```sql
CREATE TABLE sync_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo TEXT NOT NULL, -- 'nextjs_to_wp' o 'wp_to_nextjs'
  despacho_id UUID REFERENCES despachos(id),
  wordpress_id INTEGER,
  datos JSONB,
  intentos INTEGER DEFAULT 0,
  ultimo_error TEXT,
  estado TEXT DEFAULT 'pendiente', -- 'pendiente', 'procesando', 'completado', 'fallido'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

#### [ ] Tarea 3.4: Resolución de Conflictos
**Prioridad**: 🟢 Baja  
**Tiempo estimado**: 1 hora

**Descripción:**
Manejar conflictos cuando hay cambios simultáneos en ambos sistemas.

**Archivos a crear:**
- `lib/conflict-resolution.ts`

**Funcionalidad:**
- Detectar conflictos (comparar `updated_at`)
- Estrategias:
  - **Last Write Wins**: El último cambio gana
  - **Manual**: Notificar a admin para resolver
  - **Merge**: Intentar combinar cambios
- Panel de admin para ver y resolver conflictos

---

#### [ ] Tarea 3.5: Logs de Sincronización
**Prioridad**: 🟢 Baja  
**Tiempo estimado**: 30 minutos

**Descripción:**
Registrar todas las sincronizaciones para auditoría.

**Archivos a crear:**
- Tabla en Supabase: `sync_logs`

**Funcionalidad:**
- Registrar cada sincronización:
  - Timestamp
  - Tipo (Next.js → WP o WP → Next.js)
  - Despacho afectado
  - Campos modificados
  - Resultado (éxito/error)
- Panel de admin para ver historial
- Filtros por fecha, despacho, tipo

**Tabla `sync_logs`:**
```sql
CREATE TABLE sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo TEXT NOT NULL,
  despacho_id UUID REFERENCES despachos(id),
  wordpress_id INTEGER,
  accion TEXT NOT NULL, -- 'create', 'update', 'delete'
  campos_modificados JSONB,
  resultado TEXT NOT NULL, -- 'exito', 'error'
  error_mensaje TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 📊 Priorización

### Sprint 1 (Esta semana)
1. ✅ Tarea 1.1: Añadir Nueva Sede
2. ✅ Tarea 2.1: Crear Página "Nuevo Despacho"
3. ✅ Tarea 2.2: API para Crear Despacho Manual

### Sprint 2 (Próxima semana)
4. ✅ Tarea 1.2: Eliminar Sede
5. ✅ Tarea 1.3: Gestión de Sede Principal
6. ✅ Tarea 2.3: Verificación de Duplicados

### Sprint 3 (Sincronización)
7. ✅ Tarea 3.1: Sincronización Next.js → WordPress
8. ✅ Tarea 3.2: Webhook WordPress → Next.js
9. ✅ Tarea 3.3: Cola de Sincronización

### Backlog (Mejoras futuras)
10. Tarea 2.4: Flujo de Aprobación
11. Tarea 3.4: Resolución de Conflictos
12. Tarea 3.5: Logs de Sincronización

---

## 🔍 Verificaciones Necesarias

### Antes de empezar cada tarea:
- [ ] Leer documentación de la tabla/API involucrada
- [ ] Verificar estructura actual en Supabase
- [ ] Probar funcionalidad existente relacionada

### Después de completar cada tarea:
- [ ] Probar en desarrollo
- [ ] Verificar cambios en Supabase
- [ ] Build exitoso (`pnpm build`)
- [ ] Commit con mensaje descriptivo
- [ ] Actualizar este documento

---

## 📝 Notas Importantes

### Estructura de Sedes
Cada sede tiene los siguientes campos (ver tabla `sedes` en Supabase):
- Información básica: nombre, descripción, web
- Dirección: calle, número, piso, CP, localidad, provincia, país
- Contacto: teléfono, email, persona_contacto
- Profesional: numero_colegiado, colegio, experiencia, ano_fundacion, tamano_despacho
- Especialidades: areas_practica (array), especialidades, servicios_especificos
- Otros: horarios (JSON), redes_sociales (JSON), foto_perfil, observaciones
- Control: es_principal, activa, estado_verificacion, estado_registro

### Ejemplo: Vento Abogados
Revisar en Supabase:
```sql
SELECT * FROM despachos WHERE nombre LIKE '%Vento%';
SELECT * FROM sedes WHERE despacho_id = 'uuid-de-vento';
```

### WordPress API
- **Endpoint**: `https://lexhoy.com/wp-json/wp/v2/despachos`
- **Autenticación**: Application Password
- **Campos ACF**: Mapear correctamente los campos personalizados

---

**Última actualización**: 3 de noviembre de 2025  
**Próxima revisión**: Después de completar Sprint 1
