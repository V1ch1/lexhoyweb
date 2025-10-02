# 🔒 Corrección Completa de Permisos de Despachos

## 📋 Problemas Identificados y Solucionados

### ❌ Problema 1: Propietarios no veían sus despachos en "Mis Despachos"
**Causa**: `getUserDespachos()` solo buscaba en `user_despachos`, no en `owner_email`

**Solución**: Modificado `lib/userService.ts` → `getUserDespachos()`
- Ahora busca en **dos lugares**:
  1. Tabla `user_despachos` (asignaciones manuales)
  2. Tabla `despachos` donde `owner_email` = email del usuario
- Combina ambos resultados eliminando duplicados
- Los despachos propios tienen permisos completos automáticamente

### ❌ Problema 2: Usuarios sin permisos veían botón "Editar"
**Causa**: No había validación de permisos en el botón "Editar"

**Solución**: Modificado `app/dashboard/despachos/page.tsx`
- Botón "Editar" solo visible si:
  - Es `super_admin` **O**
  - Es el propietario del despacho (`owner_email` = su email)
- Otros usuarios ven: "Sin permisos"

### ❌ Problema 3: Usuarios sin permisos veían botón "Añadir propietario"
**Causa**: No había validación de rol

**Solución**: Ya corregido anteriormente
- Solo `super_admin` ve botón "Añadir propietario"
- Otros usuarios ven: "Sin propietario"

---

## 🎯 Matriz de Permisos Final

| Acción | Usuario Normal | Despacho Admin | Super Admin | Propietario |
|--------|----------------|----------------|-------------|-------------|
| **Ver listado de despachos** | ✅ | ✅ | ✅ | ✅ |
| **Solicitar despacho** | ✅ | ✅ | ✅ | ✅ |
| **Ver "Mis Despachos"** | ✅ (solo suyos) | ✅ (solo suyos) | ✅ (todos) | ✅ (suyos) |
| **Editar despacho propio** | ❌ | ❌ | ✅ | ✅ |
| **Editar cualquier despacho** | ❌ | ❌ | ✅ | ❌ |
| **Asignar propietario** | ❌ | ❌ | ✅ | ❌ |
| **Desasignar propietario** | ❌ | ❌ | ✅ | ❌ |
| **Eliminar su propiedad** | ✅ | ✅ | ✅ | ✅ |

---

## 🔄 Flujo Actualizado

### Caso 1: Usuario es Propietario (owner_email)

```
1. Usuario "blancocasal@gmail.com" es propietario de "Vento Abogados"
   ↓
2. Va a /dashboard/settings → "Mis Despachos"
   ↓
3. ✅ Ve "Vento Abogados" en la lista
   ↓
4. Puede eliminar su propiedad
   ↓
5. Va a /dashboard/despachos
   ↓
6. ✅ Ve botón "Editar" en "Vento Abogados"
   ↓
7. Puede editar los datos del despacho
```

### Caso 2: Usuario tiene Asignación Manual (user_despachos)

```
1. Super admin asigna "Despacho X" a usuario
   ↓
2. Usuario va a /dashboard/settings → "Mis Despachos"
   ↓
3. ✅ Ve "Despacho X" en la lista
   ↓
4. Puede eliminar su asignación
   ↓
5. Va a /dashboard/despachos
   ↓
6. ❌ NO ve botón "Editar" (no es propietario)
   ↓
7. Ve "Sin permisos"
```

### Caso 3: Usuario sin Despachos

```
1. Usuario nuevo sin despachos
   ↓
2. Va a /dashboard/settings → "Mis Despachos"
   ↓
3. Ve mensaje: "No tienes despachos asignados"
   ↓
4. Puede solicitar despacho
   ↓
5. Va a /dashboard/despachos
   ↓
6. ❌ NO ve botón "Editar" en ningún despacho
   ↓
7. Ve "Sin permisos" en todos
```

---

## 📁 Archivos Modificados

### 1. `lib/userService.ts`

**Método**: `getUserDespachos()`

**Cambios**:
```typescript
// ANTES: Solo buscaba en user_despachos
async getUserDespachos(userId: string) {
  const { data } = await supabase
    .from("user_despachos")
    .select("*")
    .eq("user_id", userId);
  return data || [];
}

// DESPUÉS: Busca en user_despachos Y en owner_email
async getUserDespachos(userId: string) {
  // 1. Obtener email del usuario
  const { data: userData } = await supabase
    .from("users")
    .select("email")
    .eq("id", userId)
    .single();

  // 2. Despachos asignados manualmente
  const { data: assignedDespachos } = await supabase
    .from("user_despachos")
    .select("*")
    .eq("user_id", userId)
    .eq("activo", true);

  // 3. Despachos donde es propietario
  const { data: ownedDespachos } = await supabase
    .from("despachos")
    .select("id, nombre, object_id, slug")
    .eq("owner_email", userData.email);

  // 4. Combinar y eliminar duplicados
  return [...assignedDespachos, ...ownedDespachosFormatted];
}
```

### 2. `app/dashboard/despachos/page.tsx`

**Sección**: Columna "Acciones"

**Cambios**:
```tsx
{/* ANTES: Todos veían botón Editar */}
<button onClick={() => router.push(`/dashboard/despachos/${d.object_id}/editar`)}>
  Editar
</button>

{/* DESPUÉS: Solo super_admin o propietario */}
{user?.role === "super_admin" || d.owner_email === user?.email ? (
  <button onClick={() => router.push(`/dashboard/despachos/${d.object_id}/editar`)}>
    Editar
  </button>
) : (
  <span className="text-gray-400 text-xs italic">Sin permisos</span>
)}
```

---

## 🧪 Cómo Probar

### Prueba 1: Propietario ve su despacho

1. **Setup**: Asegúrate que "Vento Abogados" tiene `owner_email = blancocasal@gmail.com`
2. Login con `blancocasal@gmail.com`
3. Ir a `/dashboard/settings` → Tab "Mis Despachos"
4. ✅ **Verificar**: "Vento Abogados" aparece en la lista
5. Ir a `/dashboard/despachos`
6. ✅ **Verificar**: Botón "Editar" visible en "Vento Abogados"
7. ✅ **Verificar**: "Sin permisos" en otros despachos

### Prueba 2: Usuario sin despachos

1. Login con usuario que NO tiene despachos
2. Ir a `/dashboard/settings` → Tab "Mis Despachos"
3. ✅ **Verificar**: Mensaje "No tienes despachos asignados"
4. Ir a `/dashboard/despachos`
5. ✅ **Verificar**: "Sin permisos" en todos los despachos

### Prueba 3: Super Admin

1. Login como super admin
2. Ir a `/dashboard/despachos`
3. ✅ **Verificar**: Botón "Editar" visible en TODOS los despachos
4. ✅ **Verificar**: Botón "Añadir propietario" visible en despachos sin dueño

### Prueba 4: Asignación manual

1. Login como super admin
2. Asignar "Despacho X" a usuario mediante `/admin/users/[id]`
3. Login con ese usuario
4. Ir a `/dashboard/settings` → "Mis Despachos"
5. ✅ **Verificar**: "Despacho X" aparece
6. Ir a `/dashboard/despachos`
7. ✅ **Verificar**: "Sin permisos" en "Despacho X" (no es propietario)

---

## 🗄️ Estructura de Datos

### Tabla `despachos`
```sql
CREATE TABLE despachos (
  id SERIAL PRIMARY KEY,
  object_id TEXT,
  nombre TEXT,
  owner_email TEXT,  -- ← Email del propietario
  ...
);
```

### Tabla `user_despachos`
```sql
CREATE TABLE user_despachos (
  id UUID PRIMARY KEY,
  user_id TEXT,      -- ← ID del usuario
  despacho_id INTEGER, -- ← ID del despacho
  activo BOOLEAN,
  permisos JSONB,
  ...
);
```

### Relación

```
Usuario "blancocasal@gmail.com"
├── Propietario de:
│   └── Vento Abogados (despachos.owner_email = blancocasal@gmail.com)
│       └── Permisos: TODOS (leer, escribir, eliminar)
│
└── Asignado a:
    └── Despacho X (user_despachos.user_id = id_usuario)
        └── Permisos: Según asignación (solo leer, por ejemplo)
```

---

## 🔍 Verificar en Base de Datos

### Ver despachos de un usuario

```sql
-- Despachos donde es propietario
SELECT id, nombre, owner_email
FROM despachos
WHERE owner_email = 'blancocasal@gmail.com';

-- Despachos asignados manualmente
SELECT 
  ud.id,
  ud.user_id,
  ud.despacho_id,
  d.nombre as despacho_nombre,
  ud.permisos,
  ud.activo
FROM user_despachos ud
JOIN despachos d ON d.id = ud.despacho_id
WHERE ud.user_id = 'id_del_usuario'
  AND ud.activo = true;
```

### Asignar propietario a un despacho

```sql
-- Opción 1: Actualizar owner_email
UPDATE despachos
SET owner_email = 'blancocasal@gmail.com'
WHERE nombre = 'Vento Abogados';

-- Opción 2: Crear asignación manual
INSERT INTO user_despachos (user_id, despacho_id, activo, permisos)
VALUES (
  'id_del_usuario',
  123, -- ID del despacho
  true,
  '{"leer": true, "escribir": true, "eliminar": false}'::jsonb
);
```

---

## ✅ Resumen de Cambios

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Propietarios ven sus despachos** | ❌ No | ✅ Sí |
| **Propietarios pueden editar** | ❌ No | ✅ Sí |
| **Usuarios sin permisos ven "Editar"** | ❌ Sí | ✅ No |
| **Solo super_admin asigna propietarios** | ❌ No | ✅ Sí |
| **Lógica de permisos clara** | ❌ No | ✅ Sí |

---

## 🎯 Reglas de Negocio Finales

### Editar Despacho
- ✅ **Super Admin**: Puede editar CUALQUIER despacho
- ✅ **Propietario** (`owner_email`): Puede editar SU despacho
- ❌ **Usuario con asignación manual**: NO puede editar (solo ver)
- ❌ **Usuario sin relación**: NO puede editar

### Asignar/Desasignar Propietario
- ✅ **Solo Super Admin** puede asignar propietarios
- ❌ **Nadie más** puede asignar propietarios

### Ver "Mis Despachos"
- ✅ Muestra despachos donde es `owner_email`
- ✅ Muestra despachos en `user_despachos` (activo = true)
- ✅ Combina ambos sin duplicados

### Eliminar Propiedad
- ✅ **Propietario**: Puede eliminar su `owner_email` (pone a NULL)
- ✅ **Usuario asignado**: Puede desactivar su `user_despachos` (activo = false)
- ✅ **Super Admin**: Puede desasignar a cualquiera

---

## 📝 Notas Importantes

1. **Diferencia entre Propietario y Asignado**:
   - **Propietario** (`owner_email`): Tiene control total del despacho
   - **Asignado** (`user_despachos`): Solo tiene permisos específicos

2. **Permisos de Propietario**:
   - Automáticamente tiene: `{leer: true, escribir: true, eliminar: true}`
   - No se almacena en `user_despachos`, se calcula dinámicamente

3. **Prioridad**:
   - Si un usuario es propietario Y tiene asignación manual, se elimina el duplicado
   - La propiedad (`owner_email`) tiene prioridad

4. **Compatibilidad**:
   - Los cambios son retrocompatibles
   - Despachos sin `owner_email` funcionan igual que antes
   - Asignaciones manuales existentes no se afectan

---

## 🚀 Próximos Pasos Opcionales

1. **Transferir propiedad**: Permitir al propietario transferir a otro usuario
2. **Co-propietarios**: Múltiples propietarios por despacho
3. **Historial**: Registrar cambios de propiedad
4. **Notificaciones**: Avisar cuando se asigna/desasigna propiedad

---

**¡Sistema de permisos completamente corregido!** ✅
