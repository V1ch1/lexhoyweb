# 🔧 Corrección: Eliminar Propiedad de Despacho

## ❌ Problemas Identificados

1. **No se actualizaba la UI** - Requería F5 para ver cambios
2. **No se eliminaba owner_email** - Solo desactivaba user_despachos
3. **Despacho seguía apareciendo como propiedad** - En listado y BD
4. **Flujo incompleto** - No manejaba ambos tipos de asignación

---

## ✅ Soluciones Implementadas

### 1. Crear columna `owner_email` en tabla `despachos`

**Archivo**: `lib/schema/add_owner_email.sql`

**SQL a ejecutar en Supabase**:
```sql
-- Añadir columna owner_email
ALTER TABLE despachos
ADD COLUMN IF NOT EXISTS owner_email TEXT;

-- Crear índice
CREATE INDEX IF NOT EXISTS idx_despachos_owner_email 
ON despachos(owner_email);
```

---

### 2. Actualizar método `unassignDespachoFromUser()`

**Archivo**: `lib/userService.ts`

**Cambios**:
- ✅ Ahora desactiva `user_despachos` (asignación manual)
- ✅ Ahora elimina `owner_email` (propiedad)
- ✅ Maneja ambos casos automáticamente
- ✅ Logs detallados para debugging

**Lógica nueva**:
```typescript
async unassignDespachoFromUser(userId, despachoId) {
  // 1. Obtener email del usuario
  const userData = await getUserEmail(userId);
  
  // 2. Desactivar asignación manual (si existe)
  await supabase
    .from("user_despachos")
    .update({ activo: false })
    .eq("user_id", userId)
    .eq("despacho_id", despachoId);
  
  // 3. Eliminar owner_email (si es propietario)
  await supabase
    .from("despachos")
    .update({ owner_email: null })
    .eq("id", despachoId)
    .eq("owner_email", userData.email);
}
```

---

### 3. Mejorar actualización de UI

**Archivos modificados**:
- `app/dashboard/settings/page.tsx` - Ya recarga correctamente
- `app/admin/users/[id]/page.tsx` - Ahora recarga lista completa

**Cambio en admin**:
```typescript
// ANTES: Solo actualizaba estado local
setUserDespachos(prev => 
  prev.map(d => d.despachoId === despachoId ? {...d, activo: false} : d)
);

// DESPUÉS: Recarga desde BD
const updatedDespachos = await userService.getUserDespachos(user.id);
setUserDespachos(updatedDespachos.filter(d => d.activo));
```

---

## 🔄 Flujo Completo Corregido

### Caso 1: Usuario elimina su propiedad

```
1. Usuario es propietario de "Vento Abogados"
   (despachos.owner_email = blancocasal@gmail.com)
   ↓
2. Va a /dashboard/settings → "Mis Despachos"
   ↓
3. Click en "Eliminar Propiedad"
   ↓
4. Confirma la acción
   ↓
5. Sistema ejecuta:
   - Busca email del usuario
   - Intenta desactivar user_despachos (si existe)
   - Elimina owner_email del despacho
   ↓
6. Recarga lista de despachos
   ↓
7. ✅ "Vento Abogados" desaparece de la lista
   ↓
8. En /dashboard/despachos:
   ✅ Propietario: (vacío)
   ✅ Botón "Añadir propietario" visible (solo super_admin)
   ✅ Botón "Editar" NO visible para ese usuario
```

### Caso 2: Super Admin desasigna despacho

```
1. Super admin va a /admin/users/[id]
   ↓
2. Ve "Despachos Asignados" del usuario
   ↓
3. Click en "Desasignar" en un despacho
   ↓
4. Confirma la acción
   ↓
5. Sistema ejecuta:
   - Desactiva user_despachos
   - Elimina owner_email (si aplica)
   ↓
6. Recarga lista de despachos
   ↓
7. ✅ Despacho desaparece de la lista
   ↓
8. Usuario afectado:
   ✅ Ya no ve el despacho en "Mis Despachos"
   ✅ Ya no puede editar ese despacho
```

---

## 🗄️ Cambios en Base de Datos

### Tabla `despachos`

```sql
-- ANTES
CREATE TABLE despachos (
  id SERIAL PRIMARY KEY,
  nombre TEXT,
  object_id TEXT,
  ...
  -- ❌ No tenía owner_email
);

-- DESPUÉS
CREATE TABLE despachos (
  id SERIAL PRIMARY KEY,
  nombre TEXT,
  object_id TEXT,
  ...
  owner_email TEXT,  -- ✅ NUEVO
  ...
);
```

### Cuando se elimina propiedad

```sql
-- Asignación manual (user_despachos)
UPDATE user_despachos
SET activo = false
WHERE user_id = 'abc-123'
  AND despacho_id = 456;

-- Propiedad (owner_email)
UPDATE despachos
SET owner_email = NULL
WHERE id = 456
  AND owner_email = 'blancocasal@gmail.com';
```

---

## 🧪 Cómo Probar

### Prueba 1: Usuario elimina su propiedad

1. **Setup**: Asignar propiedad
   ```sql
   UPDATE despachos
   SET owner_email = 'blancocasal@gmail.com'
   WHERE nombre ILIKE '%vento%';
   ```

2. **Login** con `blancocasal@gmail.com`

3. **Ir a** `/dashboard/settings` → "Mis Despachos"

4. **Verificar**: "Vento Abogados" aparece

5. **Click** en "Eliminar Propiedad"

6. **Confirmar** la acción

7. **Verificar**:
   - ✅ Despacho desaparece SIN recargar (F5)
   - ✅ Mensaje de éxito aparece
   - ✅ En consola: logs de eliminación

8. **Verificar en BD**:
   ```sql
   SELECT id, nombre, owner_email
   FROM despachos
   WHERE nombre ILIKE '%vento%';
   -- owner_email debe ser NULL
   ```

9. **Ir a** `/dashboard/despachos`

10. **Verificar**:
    - ✅ "Vento Abogados" NO tiene propietario
    - ✅ Botón "Editar" NO visible para ti
    - ✅ "Sin permisos" en columna Acciones

---

### Prueba 2: Super Admin desasigna

1. **Login** como super admin

2. **Ir a** `/admin/users/[id]` (usuario con despacho)

3. **Verificar**: Lista de "Despachos Asignados"

4. **Click** en "Desasignar"

5. **Confirmar**

6. **Verificar**:
   - ✅ Despacho desaparece SIN recargar
   - ✅ Mensaje de éxito
   - ✅ Logs en consola

7. **Login** con el usuario afectado

8. **Ir a** `/dashboard/settings` → "Mis Despachos"

9. **Verificar**:
   - ✅ Despacho NO aparece

---

### Prueba 3: Verificar en BD

```sql
-- Ver despachos sin propietario
SELECT id, nombre, owner_email
FROM despachos
WHERE owner_email IS NULL;

-- Ver asignaciones desactivadas
SELECT 
  ud.id,
  ud.user_id,
  ud.despacho_id,
  ud.activo,
  d.nombre,
  u.email
FROM user_despachos ud
JOIN despachos d ON d.id = ud.despacho_id
JOIN users u ON u.id = ud.user_id
WHERE ud.activo = false;
```

---

## 📊 Logs de Debugging

### En la consola del navegador (F12)

```
🔍 Cargando despachos para usuario: abc-123 blancocasal@gmail.com
📦 Despachos obtenidos: [...]
📊 Total despachos: 1
✅ Despachos activos: 1
```

### En la consola del servidor (terminal)

```
🗑️ Eliminando propiedad/asignación: { userId: 'abc-123', despachoId: '456' }
⚠️ No se encontró asignación manual: [error]
✅ Propiedad (owner_email) eliminada
✅ Propiedad/asignación eliminada correctamente
```

---

## ✅ Checklist de Verificación

### Base de Datos
- [ ] Columna `owner_email` existe en tabla `despachos`
- [ ] Índice `idx_despachos_owner_email` creado
- [ ] Despacho tiene `owner_email` configurado

### Código
- [ ] `userService.unassignDespachoFromUser()` actualizado
- [ ] Maneja `user_despachos` (activo = false)
- [ ] Maneja `owner_email` (= NULL)
- [ ] Admin recarga lista después de desasignar

### UI
- [ ] Botón "Eliminar Propiedad" funciona
- [ ] No requiere F5 para ver cambios
- [ ] Mensaje de éxito aparece
- [ ] Despacho desaparece de la lista
- [ ] Botón "Editar" desaparece en listado

### Permisos
- [ ] Usuario sin propiedad NO puede editar
- [ ] Super admin SÍ puede editar cualquiera
- [ ] Propietario SÍ puede editar su despacho
- [ ] Despacho sin propietario muestra "Añadir" (solo super_admin)

---

## 🚀 Pasos para Aplicar

### 1. Ejecutar SQL en Supabase

```sql
ALTER TABLE despachos
ADD COLUMN IF NOT EXISTS owner_email TEXT;

CREATE INDEX IF NOT EXISTS idx_despachos_owner_email 
ON despachos(owner_email);
```

### 2. Reiniciar servidor

```bash
# En la terminal
Ctrl + C
npm run dev
```

### 3. Probar flujo completo

1. Asignar propiedad a un usuario
2. Login con ese usuario
3. Eliminar propiedad
4. Verificar que desaparece
5. Verificar en BD que `owner_email` es NULL

---

## 📝 Archivos Modificados

1. ✅ `lib/schema/add_owner_email.sql` - SQL para crear columna
2. ✅ `lib/userService.ts` - Método `unassignDespachoFromUser()` mejorado
3. ✅ `app/admin/users/[id]/page.tsx` - Recarga lista después de desasignar
4. ✅ `app/dashboard/settings/page.tsx` - Ya tenía recarga correcta

---

## 🎯 Resultado Final

| Acción | Antes | Después |
|--------|-------|---------|
| **Eliminar propiedad** | ❌ Requería F5 | ✅ Actualiza automáticamente |
| **owner_email en BD** | ❌ No se eliminaba | ✅ Se pone a NULL |
| **user_despachos** | ✅ Se desactivaba | ✅ Se desactiva |
| **UI en /despachos** | ❌ Seguía mostrando propietario | ✅ Muestra "Sin propietario" |
| **Permisos de edición** | ❌ Seguía pudiendo editar | ✅ Ya no puede editar |
| **Logs de debugging** | ❌ No había | ✅ Logs detallados |

---

**¡Flujo completo de eliminar propiedad corregido!** ✅

Ahora:
- ✅ Se elimina `owner_email` de la BD
- ✅ Se desactiva `user_despachos` (si existe)
- ✅ UI se actualiza sin F5
- ✅ Despacho queda libre
- ✅ Usuario pierde permisos de edición
- ✅ Super admin puede reasignar
