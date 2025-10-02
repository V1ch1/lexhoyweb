# Flujo de Asignación de Despachos - Sistema Completo

## 📋 Descripción General

Este documento describe el flujo completo para que un usuario solicite la propiedad de un despacho y el super admin lo apruebe o deniegue.

## 🔄 Flujo Completo

### 1. **Usuario Normal - Solicitar Despacho**

**Ubicación**: `/dashboard/solicitar-despacho`

**Pasos**:
1. Usuario se registra y hace login
2. Busca el despacho por nombre en el buscador
3. Selecciona el despacho de los resultados
4. Hace clic en "Solicitar"
5. Se crea una solicitud en la tabla `solicitudes_despacho`

**Datos guardados**:
```sql
solicitudes_despacho {
  id: UUID
  user_id: string (ID del usuario)
  user_email: string
  user_name: string
  despacho_id: string (object_id de WordPress)
  despacho_nombre: string
  despacho_localidad: string
  despacho_provincia: string
  estado: 'pendiente'
  fecha_solicitud: timestamp
}
```

**Archivo**: `app/dashboard/solicitar-despacho/page.tsx`
**API**: `app/api/solicitar-despacho/route.ts`

---

### 2. **Super Admin - Ver Solicitudes Pendientes**

**Ubicación**: `/admin/users` (tab "Solicitudes") o `/admin/solicitudes-despachos`

**Pasos**:
1. Super admin entra al dashboard
2. Ve las solicitudes pendientes en su muro
3. Puede ver:
   - Nombre del usuario
   - Email del usuario
   - Despacho solicitado
   - Localidad y provincia
   - Fecha de solicitud

**Archivo**: `app/admin/users/page.tsx` o `app/admin/solicitudes-despachos/page.tsx`

---

### 3. **Super Admin - Aprobar Solicitud**

**Pasos**:
1. Super admin hace clic en "Aprobar"
2. El sistema ejecuta `approveSolicitudDespacho`:
   - ✅ Obtiene la solicitud de la base de datos
   - ✅ Sincroniza el despacho desde WordPress a Supabase (si no existe)
   - ✅ Busca el ID numérico del despacho en Supabase usando el `object_id`
   - ✅ Asigna el despacho al usuario en la tabla `user_despachos`
   - ✅ Actualiza el estado de la solicitud a "aprobado"

**Código corregido** (en `lib/userService.ts`):
```typescript
async approveSolicitudDespacho(solicitudId, approvedBy, notas?) {
  // 1. Obtener solicitud
  const solicitud = await getSolicitud(solicitudId);
  
  // 2. Sincronizar despacho desde WordPress
  await syncDespacho(solicitud.despacho_id);
  
  // 3. Obtener ID numérico del despacho en Supabase
  const despacho = await supabase
    .from("despachos")
    .select("id")
    .eq("object_id", solicitud.despacho_id)
    .single();
  
  // 4. Asignar despacho al usuario
  await assignDespachoToUser(
    solicitud.user_id,
    despacho.id.toString(),
    approvedBy
  );
  
  // 5. Actualizar solicitud
  await updateSolicitud(solicitudId, "aprobado");
}
```

**Tablas afectadas**:
- `solicitudes_despacho`: estado → "aprobado"
- `user_despachos`: nueva fila con la asignación
- `despachos`: creado/actualizado desde WordPress

---

### 4. **Super Admin - Rechazar Solicitud**

**Pasos**:
1. Super admin hace clic en "Rechazar"
2. Escribe el motivo del rechazo
3. El sistema actualiza la solicitud:
   - estado → "rechazado"
   - notas_respuesta → motivo
   - fecha_respuesta → timestamp
   - respondido_por → ID del super admin

**Archivo**: `lib/userService.ts` → `rejectSolicitudDespacho()`

---

### 5. **Usuario - Ver Despachos Asignados**

**Ubicación**: `/dashboard/settings` (tab "Mis Despachos")

**Pasos**:
1. Usuario entra a configuración
2. Ve la lista de despachos asignados
3. Puede ver:
   - Nombre del despacho
   - Localidad y provincia
   - Fecha de asignación
   - Permisos (leer, escribir, eliminar)

**Datos mostrados desde**: `user_despachos` JOIN `despachos`

---

### 6. **Usuario - Eliminar Propiedad**

**Ubicación**: `/dashboard/settings` (tab "Mis Despachos")

**Pasos**:
1. Usuario hace clic en "Eliminar propiedad"
2. Confirma la acción
3. El sistema desactiva la asignación:
   - `user_despachos.activo` → false

**Método**: `userService.unassignDespachoFromUser(userId, despachoId)`

---

### 7. **Super Admin - Quitar Propiedad**

**Ubicación**: `/admin/users/[id]` (página de edición de usuario)

**Pasos**:
1. Super admin entra a la ficha del usuario
2. Ve los despachos asignados
3. Hace clic en "Desasignar despacho"
4. El sistema desactiva la asignación

**Método**: `userService.unassignDespachoFromUser(userId, despachoId)`

---

## 🗄️ Estructura de Tablas

### `solicitudes_despacho`
```sql
CREATE TABLE solicitudes_despacho (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  user_email TEXT,
  user_name TEXT,
  despacho_id TEXT NOT NULL,  -- object_id de WordPress
  despacho_nombre TEXT,
  despacho_localidad TEXT,
  despacho_provincia TEXT,
  estado TEXT CHECK (estado IN ('pendiente', 'aprobado', 'rechazado', 'cancelada')),
  fecha_solicitud TIMESTAMP DEFAULT NOW(),
  fecha_respuesta TIMESTAMP,
  respondido_por TEXT,
  notas_respuesta TEXT
);
```

### `user_despachos`
```sql
CREATE TABLE user_despachos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  despacho_id INTEGER NOT NULL,  -- ID numérico de Supabase
  asignado_por TEXT,
  permisos JSONB DEFAULT '{"leer": true, "escribir": true, "eliminar": false}',
  activo BOOLEAN DEFAULT true,
  fecha_asignacion TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (despacho_id) REFERENCES despachos(id)
);
```

### `despachos`
```sql
CREATE TABLE despachos (
  id SERIAL PRIMARY KEY,
  object_id TEXT UNIQUE NOT NULL,  -- ID de WordPress
  nombre TEXT NOT NULL,
  descripcion TEXT,
  num_sedes INTEGER DEFAULT 0,
  areas_practica TEXT[],
  slug TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔧 Corrección Aplicada

### Problema Original
El error 400 ocurría porque `assignDespachoToUser` intentaba insertar el `object_id` (string de WordPress) directamente en `user_despachos.despacho_id`, que espera un ID numérico de Supabase.

### Solución
1. Después de sincronizar el despacho desde WordPress
2. Buscar el despacho en Supabase por `object_id`
3. Obtener el `id` numérico
4. Usar ese ID para la asignación

### Código Antes (❌ Error)
```typescript
await this.assignDespachoToUser(
  solicitud.user_id,
  solicitud.despacho_id,  // ❌ Este es el object_id (string)
  approvedBy
);
```

### Código Después (✅ Correcto)
```typescript
// Obtener ID numérico
const { data: despacho } = await supabase
  .from("despachos")
  .select("id")
  .eq("object_id", solicitud.despacho_id)
  .single();

// Asignar con ID numérico
await this.assignDespachoToUser(
  solicitud.user_id,
  despacho.id.toString(),  // ✅ ID numérico de Supabase
  approvedBy
);
```

---

## 📝 Archivos Modificados

1. **`lib/userService.ts`**
   - ✅ Corregido `approveSolicitudDespacho()`
   - ✅ Añadidos logs de debugging

2. **`app/admin/users/page.tsx`**
   - ✅ Botones de aprobar/rechazar solicitudes

3. **`app/admin/solicitudes-despachos/page.tsx`**
   - ✅ Vista dedicada para solicitudes

4. **`app/dashboard/solicitar-despacho/page.tsx`**
   - ✅ Formulario de solicitud de despacho

5. **`app/api/solicitar-despacho/route.ts`**
   - ✅ Endpoint para crear solicitudes

6. **`app/api/sync-despacho/route.ts`**
   - ✅ Sincronización desde WordPress

---

## 🧪 Cómo Probar

### 1. Como Usuario Normal
```bash
1. Ir a /dashboard/solicitar-despacho
2. Buscar un despacho (ej: "MB Advocats")
3. Hacer clic en "Solicitar"
4. Verificar que aparece en "Mis solicitudes pendientes"
```

### 2. Como Super Admin
```bash
1. Ir a /admin/users (tab "Solicitudes")
2. Ver la solicitud pendiente
3. Hacer clic en "Aprobar"
4. Verificar en consola los logs:
   - 🔄 Aprobando solicitud
   - 📋 Solicitud obtenida
   - 🔄 Sincronizando despacho
   - ✅ Despacho sincronizado
   - 🔍 Buscando despacho en Supabase
   - ✅ Despacho encontrado
   - 🔗 Asignando despacho al usuario
   - ✅ Despacho asignado correctamente
   - ✅ Solicitud aprobada exitosamente
```

### 3. Verificar Asignación
```sql
-- Ver asignaciones activas
SELECT 
  ud.id,
  u.email as usuario,
  d.nombre as despacho,
  ud.activo,
  ud.fecha_asignacion
FROM user_despachos ud
JOIN users u ON u.id = ud.user_id
JOIN despachos d ON d.id = ud.despacho_id
WHERE ud.activo = true;
```

---

## ✅ Estado Actual

- ✅ Usuario puede solicitar despachos
- ✅ Super admin ve solicitudes pendientes
- ✅ Super admin puede aprobar solicitudes (CORREGIDO)
- ✅ Super admin puede rechazar solicitudes
- ✅ Asignación correcta en `user_despachos`
- ⏳ Usuario puede ver sus despachos asignados (pendiente)
- ⏳ Usuario puede eliminar su propiedad (pendiente)
- ⏳ Super admin puede quitar propiedad desde ficha de usuario (pendiente)

---

## 🚀 Próximos Pasos

1. Añadir tab "Mis Despachos" en `/dashboard/settings`
2. Mostrar despachos asignados al usuario
3. Botón para eliminar propiedad
4. Actualizar ficha de usuario en admin para mostrar despachos
5. Botón para super admin para quitar propiedad
