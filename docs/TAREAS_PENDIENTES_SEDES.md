# 📋 TAREAS PENDIENTES: Gestión de Sedes

> **Fecha**: 2025-11-04  
> **Estado**: En progreso

---

## ✅ COMPLETADO

### 1. Formulario Crear Sede (Página Dedicada)
- ✅ Página: `/dashboard/despachos/[id]/sedes/crear/page.tsx`
- ✅ Todos los campos implementados
- ✅ Campos obligatorios marcados: nombre, localidad, provincia, teléfono, email
- ✅ Checkbox "Sede principal"
- ✅ Sección de foto de perfil con preview
- ✅ Botones duplicados (inicio y final)
- ✅ Validación frontend y backend
- ✅ Endpoint API: `POST /api/despachos/[id]/sedes`
- ✅ Servicio: `lib/sedeService.ts`

### 2. Documentación
- ✅ `DATABASE_SCHEMA.md` actualizado con schema completo
- ✅ `SCHEMA_SEDES_REAL.md` creado con datos verificados
- ✅ Errores 400 corregidos (campos inexistentes, tipos incorrectos)

---

## 🟣 PENDIENTE - CRÍTICO (Hacer Primero)

### 0. Limpiar Sedes Principales Duplicadas
**Problema**: Hay múltiples sedes marcadas como principales en el mismo despacho

**Solución**:
- [ ] Ejecutar SQL para limpiar sedes duplicadas
- [ ] Verificar que solo haya una sede principal por despacho
- [ ] Probar selector de sede principal

**SQL a ejecutar**:
```sql
-- Ver sedes duplicadas
SELECT despacho_id, COUNT(*) as principales
FROM sedes 
WHERE es_principal = true
GROUP BY despacho_id
HAVING COUNT(*) > 1;

-- Limpiar por despacho (reemplazar UUID)
UPDATE sedes SET es_principal = false WHERE despacho_id = 'UUID';
UPDATE sedes SET es_principal = true WHERE id = (SELECT id FROM sedes WHERE despacho_id = 'UUID' ORDER BY id ASC LIMIT 1);
```

---

## 🔴 PENDIENTE - ALTA PRIORIDAD

### 1. ✅ Corregir Funcionalidad "Eliminar" en Mis Despachos (COMPLETADO)
**Problema**: En `/dashboard/settings` al eliminar un despacho:
- ❌ Se elimina de la pantalla temporalmente
- ❌ Pero sigue apareciendo en `/dashboard` y `/dashboard/despachos`
- ❌ Al volver a `/dashboard/settings`, sigue en la lista

**Solución Implementada**:
- ✅ "Eliminar" ahora **desasigna** al usuario del despacho correctamente
- ✅ El despacho vuelve a estar disponible para otros usuarios
- ✅ El despacho NO se elimina de la BD (solo super_admin puede eliminarlo)
- ✅ Desaparece de todas las vistas del usuario

**Archivos modificados**:
- ✅ `app/dashboard/settings/page.tsx` - Actualizado handleDeleteDespacho
- ✅ `app/api/user/despachos/[id]/route.ts` - Endpoint DELETE creado
- ✅ `components/settings/MisDespachosTab.tsx` - Modal mejorado
- ✅ `app/dashboard/despachos/page.tsx` - Filtrado por user_despachos

**Validaciones implementadas**:
- ✅ Modal con mensaje claro: "¿Desasignarte de este despacho?"
- ✅ Advertencia sobre propietario único
- ✅ Actualización automática de todas las vistas

---

### 2. Separar "Eliminar Despacho" (Solo Super Admin)
**Problema**: No existe funcionalidad para eliminar permanentemente un despacho

**Comportamiento Esperado**:
- ✅ Solo usuarios con rol `super_admin` pueden ver el botón
- ✅ Eliminar PERMANENTEMENTE el despacho de la BD
- ✅ Eliminar en cascada: sedes, leads, relaciones user_despachos
- ✅ Triple confirmación con escribir nombre del despacho

**Archivos a crear**:
- [ ] Endpoint: `DELETE /api/admin/despachos/[id]` - Eliminar permanente
- [ ] Validar rol super_admin en el endpoint
- [ ] Modal de confirmación triple
- [ ] Eliminar en cascada todas las relaciones

**Ubicación del botón**:
- [ ] En `/dashboard/despachos/[slug]` - Botón rojo "Eliminar Despacho Permanentemente"
- [ ] Solo visible para super_admin

---

### 3. Corregir Sincronización de Vistas de Despachos
**Problema**: Inconsistencia entre las 3 vistas de despachos:
- `/dashboard` - Muestra despachos asignados
- `/dashboard/settings` - Lista de "Mis Despachos"
- `/dashboard/despachos` - Lista para editar

**Solución**:
- [ ] Usar la misma query en las 3 vistas
- [ ] Filtrar por `user_despachos` donde `user_id = current_user`
- [ ] Actualizar en tiempo real al desasignar/asignar
- [ ] Agregar loading states

**Query correcta**:
```sql
SELECT d.* 
FROM despachos d
INNER JOIN user_despachos ud ON d.id = ud.despacho_id
WHERE ud.user_id = 'current_user_id'
ORDER BY d.nombre;
```

---

### 4. Navegación a Formulario Crear Sede
**Problema**: No hay forma clara de llegar a `/dashboard/despachos/[id]/sedes/crear`

**Solución**:
- [ ] Agregar botón "+ Nueva Sede" en la página del despacho
- [ ] Agregar enlace en el menú de navegación
- [ ] Crear breadcrumbs para mejor UX

**Ubicaciones donde agregar**:
- `app/dashboard/despachos/[slug]/page.tsx` - Botón en sección de sedes
- `app/dashboard/despachos/[id]/sedes/page.tsx` - Listado de sedes (pendiente crear)

---

### 2. Upload de Foto de Perfil a Supabase Storage
**Estado**: UI creada, falta funcionalidad

**Pendiente**:
- [ ] Crear bucket `sedes-fotos` en Supabase Storage
- [ ] Implementar función de upload en el formulario
- [ ] Subir archivo a Storage
- [ ] Obtener URL pública
- [ ] Guardar URL en campo `foto_perfil`

**Código a implementar**:
```typescript
const handleFotoUpload = async (file: File) => {
  const fileName = `${despachoId}/${Date.now()}_${file.name}`;
  const { data, error } = await supabase.storage
    .from('sedes-fotos')
    .upload(fileName, file);
  
  if (error) throw error;
  
  const { data: { publicUrl } } = supabase.storage
    .from('sedes-fotos')
    .getPublicUrl(fileName);
  
  return publicUrl;
};
```

---

### 3. Página de Listado de Sedes
**Archivo**: `app/dashboard/despachos/[id]/sedes/page.tsx`

**Funcionalidades**:
- [ ] Listar todas las sedes del despacho
- [ ] Indicar cuál es la sede principal (badge)
- [ ] Mostrar información resumida de cada sede
- [ ] Botones de acción: Ver, Editar, Eliminar
- [ ] Botón destacado "+ Agregar Nueva Sede"
- [ ] Contador: "X sedes registradas"
- [ ] Validación de permisos (propietario o super_admin)

---

### 4. Editar Sede Existente
**Archivo**: `app/dashboard/despachos/[id]/sedes/[sedeId]/editar/page.tsx`

**Funcionalidades**:
- [ ] Formulario pre-rellenado con datos actuales
- [ ] Mismos campos que crear sede
- [ ] Endpoint: `PUT /api/despachos/[id]/sedes/[sedeId]`
- [ ] Validación de permisos
- [ ] Sincronización con WordPress

---

### 5. Eliminar Sede
**Funcionalidades**:
- [ ] Endpoint: `DELETE /api/despachos/[id]/sedes/[sedeId]`
- [ ] Validación: NO eliminar si es la única sede
- [ ] Modal de confirmación doble:
  - Modal 1: "¿Estás seguro?"
  - Modal 2: Escribe "ELIMINAR" para confirmar
- [ ] Decrementar contador `num_sedes`
- [ ] Sincronización con WordPress

---

### 6. Eliminar Despacho Completo
**Funcionalidades**:
- [ ] Endpoint: `DELETE /api/despachos/[id]`
- [ ] Triple confirmación:
  - Modal 1: Advertencia con lista de lo que se eliminará
  - Modal 2: "¿Estás completamente seguro?"
  - Modal 3: Escribe el nombre del despacho para confirmar
- [ ] Eliminación en cascada:
  - Todas las sedes
  - Todos los leads
  - Relaciones user_despachos
  - Historial completo
- [ ] Sincronización con WordPress
- [ ] Redirigir a `/dashboard`

---

### 7. Gestión de Sede Principal
**Funcionalidades**:
- [ ] Trigger en BD para asegurar solo UNA sede principal por despacho
- [ ] Al marcar una sede como principal, desmarcar las demás automáticamente
- [ ] Validar que siempre haya una sede principal
- [ ] Mostrar badge "Principal" en listados

**SQL necesario**:
```sql
CREATE OR REPLACE FUNCTION validar_sede_principal()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.es_principal = true THEN
    UPDATE sedes
    SET es_principal = false
    WHERE despacho_id = NEW.despacho_id
      AND id != NEW.id
      AND es_principal = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validar_sede_principal
BEFORE INSERT OR UPDATE ON sedes
FOR EACH ROW
EXECUTE FUNCTION validar_sede_principal();
```

---

## 🟡 PENDIENTE - MEDIA PRIORIDAD

### 8. Sincronización Bidireccional con WordPress
**Funcionalidades**:
- [ ] Sincronizar nueva sede a WordPress (actualizar `meta._despacho_sedes`)
- [ ] Sincronizar edición de sede
- [ ] Sincronizar eliminación de sede
- [ ] Cola de reintentos para operaciones fallidas
- [ ] Logs de sincronización

---

### 9. Validaciones Adicionales
**Funcionalidades**:
- [ ] Validar formato de teléfono
- [ ] Validar formato de código postal
- [ ] Validar año de fundación (rango válido)
- [ ] Validar tamaño de imagen (máx 2MB)
- [ ] Validar dimensiones de imagen (recomendado 500x500px)

---

### 10. Mejoras de UX
**Funcionalidades**:
- [ ] Autocompletar provincia según localidad
- [ ] Geocodificación de dirección
- [ ] Vista previa de la sede antes de guardar
- [ ] Guardar como borrador
- [ ] Historial de cambios

---

## 🟢 PENDIENTE - BAJA PRIORIDAD

### 11. Rediseño Global de UI
**Funcionalidades**:
- [ ] Sistema de fuentes coherente (PlayFair + Inter/Poppins)
- [ ] Paleta de colores refinada
- [ ] Componentes de botones estandarizados
- [ ] Inputs y forms refinados
- [ ] Cards y contenedores consistentes
- [ ] Guía de estilos documentada

Ver: `docs/CORRECCIONES_SEDES_UI.md` para detalles completos

---

### 12. Testing
**Funcionalidades**:
- [ ] Tests unitarios para `sedeService.ts`
- [ ] Tests de integración para endpoints API
- [ ] Tests E2E para flujo completo de crear/editar/eliminar sede
- [ ] Tests de validación de permisos

---

## 📊 RESUMEN DE PROGRESO

| Categoría | Completado | Pendiente | Total |
|-----------|------------|-----------|-------|
| Crítico | 0 | 1 | 1 |
| Alta Prioridad | 2 | 10 | 12 |
| Media Prioridad | 0 | 2 | 2 |
| Baja Prioridad | 0 | 2 | 2 |
| **TOTAL** | **2** | **15** | **17** |

**Progreso**: 12% completado

---

## 🎯 PRIORIDADES INMEDIATAS

### Esta Sesión:
1. ✅ Selector centralizado de sede principal
2. ✅ Trigger SQL para sede única
3. ⏳ Limpiar sedes duplicadas (SQL pendiente de ejecutar)

### Próxima Sesión:
1. 🔴 Corregir "Eliminar" en Mis Despachos (desasignar, no eliminar)
2. 🔴 Sincronizar vistas de despachos
3. 🔴 Separar "Eliminar Permanente" para super_admin

---

## 🎯 PRÓXIMOS PASOS RECOMENDADOS

1. **Navegación**: Agregar botón para acceder al formulario de crear sede
2. **Upload de foto**: Implementar funcionalidad completa
3. **Listado de sedes**: Crear página de listado
4. **Editar sede**: Implementar funcionalidad de edición
5. **Eliminar sede**: Implementar con validaciones

---

**Última actualización**: 2025-11-04  
**Responsable**: Cascade AI
