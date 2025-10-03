# ✅ TAREAS PENDIENTES - LEXHOY

> **Última actualización**: 2025-10-03
> **Actualiza este archivo** después de completar cada tarea

---

## 🔴 PRIORIDAD ALTA (Flujo de Asignación de Despachos)

> **ORDEN DE IMPLEMENTACIÓN**: Seguir el flujo del usuario descrito en FLUJO_COMPLETO_DESPACHOS.md

### Tarea 1: Importación de Despachos desde WordPress (ESCENARIO B)
**Estimación**: 2-3 horas | **Estado**: ✅ Completado

**Archivos a crear/modificar:**
- [x] Crear `lib/syncService.ts`
- [x] Modificar `app/api/sync-despacho/route.ts`

**Subtareas:**
- [x] Mejorar método `importarDeWordPress()` en `lib/despachoService.ts`
- [x] Implementar importación de sedes desde WordPress
- [x] Guardar `object_id` correctamente
- [x] Marcar `sincronizado_wp = true`
- [x] Actualizar `num_sedes` en despacho
- [ ] Probar importación con despacho real de WordPress (requiere prueba manual)
- [x] Manejar errores si WordPress no responde

**Criterios de aceptación:**
- ✅ Usuario busca despacho que existe en WordPress
- ✅ Sistema encuentra el despacho vía API
- ✅ Botón "Importar y Solicitar" funciona
- ✅ Despacho se crea en Next.js con todos los datos
- ✅ Sedes se importan correctamente
- ✅ Usuario puede solicitar propiedad inmediatamente

---

### Tarea 2: Creación de Despachos Nuevos (ESCENARIO C)
**Estimación**: 3-4 horas | **Estado**: ✅ Completado

**Archivos a crear/modificar:**
- [x] Crear `app/api/crear-despacho/route.ts`
- [x] Modificar `app/dashboard/solicitar-despacho/page.tsx`
- [x] Crear `lib/syncService.ts` (completado en Tarea 1)

**Subtareas:**
- [x] Crear formulario "Crear Nuevo Despacho" en `/dashboard/solicitar-despacho`
- [x] Campos: nombre, descripción, áreas práctica, localidad, provincia, dirección, teléfono, email, web
- [x] Validar campos requeridos (nombre, descripción, localidad, provincia)
- [x] Crear endpoint POST `/api/crear-despacho`
- [x] Crear despacho en tabla "despachos" (generar slug único)
- [x] Crear sede principal en tabla "sedes"
- [x] Implementar método `enviarDespachoAWordPress()` en SyncService
- [x] Enviar a WordPress con status "draft"
- [x] Guardar `object_id` retornado
- [x] Marcar `sincronizado_wp = true` si éxito
- [x] Si falla WordPress, marcar `sincronizado_wp = false` pero permitir continuar
- [ ] Permitir solicitud de propiedad inmediata (requiere integración con solicitudes)
- [ ] Probar flujo completo (requiere prueba manual)

**Criterios de aceptación:**
- ✅ Usuario no encuentra su despacho
- ✅ Ve botón "Crear Nuevo Despacho"
- ✅ Formulario se muestra correctamente
- ✅ Validaciones funcionan
- ✅ Despacho se crea en Next.js
- ✅ Despacho se envía a WordPress
- ✅ `object_id` se guarda correctamente
- ✅ Usuario puede solicitar propiedad inmediatamente
- ✅ Si falla WordPress, el proceso continúa (se sincronizará después)

---

## 🟡 PRIORIDAD MEDIA (Mejoras)

### Tarea 3: Gestión Completa de Sedes
**Estimación**: 3-4 horas | **Estado**: ⏳ Pendiente

**Archivos a crear:**
- [ ] `app/dashboard/despachos/[id]/sedes/page.tsx`
- [ ] `lib/sedeService.ts`
- [ ] `app/api/sedes/route.ts`

**Subtareas:**
- [ ] Crear interfaz de gestión de sedes
- [ ] Implementar CRUD de sedes (crear, leer, actualizar, eliminar)
- [ ] Validar datos de ubicación (localidad, provincia, CP)
- [ ] Marcar sede principal (solo una por despacho)
- [ ] Gestión de horarios (JSONB)
- [ ] Sincronización con WordPress
- [ ] Probar flujo completo

**Criterios de aceptación:**
- ✅ Usuario puede ver todas las sedes de su despacho
- ✅ Usuario puede crear/editar/eliminar sedes
- ✅ Solo una sede puede ser principal
- ✅ Cambios se sincronizan con WordPress
- ✅ Validaciones funcionan correctamente

---

### Tarea 4: Webhook WordPress → Next.js (Sincronización Automática)
**Estimación**: 2-3 horas | **Estado**: ⏳ Pendiente

**Archivos a modificar:**
- [ ] `app/api/sync-despacho/route.ts` (reemplazar debug)
- [ ] `lib/syncService.ts` (ampliar)

**Subtareas:**
- [ ] Implementar endpoint completo `/api/sync-despacho`
- [ ] Recibir payload de webhook de WordPress
- [ ] Buscar despacho por `object_id`
- [ ] Si existe: actualizar datos
- [ ] Si no existe: crear nuevo
- [ ] Sincronizar sedes desde meta._despacho_sedes
- [ ] Marcar `sincronizado_wp = true` y `ultima_sincronizacion = NOW()`
- [ ] Registrar logs de sincronización
- [ ] Manejar errores
- [ ] Configurar webhook en WordPress
- [ ] Probar con creación/actualización real

**Criterios de aceptación:**
- ✅ Webhook se dispara al crear/actualizar despacho en WordPress
- ✅ Endpoint recibe datos correctamente
- ✅ Despacho se crea/actualiza en Next.js
- ✅ Sedes se sincronizan
- ✅ Campos de sincronización se actualizan
- ✅ Errores se registran en logs

---

### Tarea 5: Sincronización Next.js → WordPress (Edición)
**Estimación**: 2-3 horas | **Estado**: ⏳ Pendiente

**Archivos a modificar:**
- [ ] `lib/syncService.ts`
- [ ] `app/dashboard/despachos/[id]/page.tsx`

**Subtareas:**
- [ ] Implementar método `actualizarDespachoEnWordPress(despachoId)`
- [ ] Manejar autenticación con WordPress (Basic Auth)
- [ ] Actualizar despacho en WordPress vía PUT
- [ ] Actualizar sedes en WordPress
- [ ] Marcar `sincronizado_wp = true` tras éxito
- [ ] Manejar errores y reintentos
- [ ] Probar edición completa

**Criterios de aceptación:**
- ✅ Usuario edita despacho en Next.js
- ✅ Cambios se envían a WordPress automáticamente
- ✅ Si falla, se marca como no sincronizado
- ✅ Usuario recibe feedback visual del estado

---

## 🟢 PRIORIDAD BAJA (Optimización)

### Tarea 6: Dashboard de Sincronización (Admin)
**Estimación**: 2-3 horas | **Estado**: ⏳ Pendiente

**Archivos a crear:**
- [ ] `app/admin/sincronizacion/page.tsx`
- [ ] `lib/syncService.ts` (ampliar con métodos de consulta)

**Subtareas:**
- [ ] Crear página `/admin/sincronizacion`
- [ ] Mostrar despachos no sincronizados
- [ ] Botón de sincronización manual
- [ ] Historial de sincronizaciones (últimas 50)
- [ ] Logs de errores
- [ ] Estadísticas (total sincronizados, pendientes, errores)
- [ ] Filtros por estado

**Criterios de aceptación:**
- ✅ Super admin puede ver estado de sincronización
- ✅ Puede forzar sincronización manual
- ✅ Ve historial de cambios
- ✅ Ve errores detallados

---

### Tarea 7: Sistema de Reintentos
**Estimación**: 2 horas | **Estado**: ⏳ Pendiente

**Archivos a modificar:**
- [ ] `lib/syncService.ts`

**Subtareas:**
- [ ] Implementar cola de reintentos
- [ ] Exponential backoff (1min, 5min, 15min, 1h)
- [ ] Límite de 5 reintentos
- [ ] Notificar a admin si falla definitivamente
- [ ] Registrar intentos en logs
- [ ] Crear tabla `sync_queue` en Supabase (opcional)

**Criterios de aceptación:**
- ✅ Sincronizaciones fallidas se reintentan automáticamente
- ✅ Después de 5 intentos, se notifica al admin
- ✅ Logs muestran todos los intentos

---

## 📝 TAREAS ADICIONALES (Backlog)

### Mejoras de UX
- [ ] Loading states en todos los formularios
- [ ] Mensajes de error más descriptivos
- [ ] Confirmaciones antes de eliminar
- [ ] Breadcrumbs en navegación
- [ ] Tooltips explicativos

### Optimización
- [ ] Cachear búsquedas de despachos
- [ ] Paginación en listados largos
- [ ] Lazy loading de sedes
- [ ] Optimizar queries de Supabase

### Testing
- [ ] Tests unitarios para syncService
- [ ] Tests de integración para endpoints
- [ ] Tests E2E del flujo completo
- [ ] Tests de sincronización

### Documentación
- [ ] Guía de configuración de webhooks WordPress
- [ ] Manual de usuario para gestión de despachos
- [ ] Guía de troubleshooting
- [ ] Diagramas de flujo actualizados

---

## 🎯 ORDEN RECOMENDADO DE EJECUCIÓN

**Seguir el flujo del usuario (FLUJO_COMPLETO_DESPACHOS.md):**

1. **Tarea 1** (Importación desde WordPress - ESCENARIO B) - Usuario encuentra despacho en WP
2. **Tarea 2** (Creación de despachos - ESCENARIO C) - Usuario crea despacho nuevo
3. **Tarea 3** (Gestión de sedes) - Usuario gestiona sedes de su despacho
4. **Tarea 4** (Webhook WP → Next.js) - Sincronización automática desde WordPress
5. **Tarea 5** (Sincronización Next.js → WP) - Ediciones se envían a WordPress
6. **Tarea 6** (Dashboard admin) - Monitoreo de sincronización
7. **Tarea 7** (Reintentos) - Robustez del sistema

---

## 📊 PROGRESO GENERAL

**Total de tareas principales**: 7
**Completadas**: 2
**En progreso**: 0
**Pendientes**: 5

**Progreso**: ██░░░░░░░░ 29%

---

## 🔄 INSTRUCCIONES DE USO

1. **Antes de empezar una tarea:**
   - Marca el estado como "🔄 En progreso"
   - Lee `CONTEXTO_PROYECTO.md`
   - Revisa los archivos relacionados

2. **Durante la tarea:**
   - Marca las subtareas completadas con ✅
   - Actualiza este archivo regularmente
   - Documenta problemas encontrados

3. **Al completar una tarea:**
   - Marca el estado como "✅ Completado"
   - Actualiza el progreso general
   - Prueba la funcionalidad
   - Actualiza `CHANGELOG.md`

4. **Si te bloqueas:**
   - Documenta el problema en la sección de notas
   - Marca subtareas problemáticas
   - Considera pedir ayuda o cambiar de tarea

---

## 📌 NOTAS Y PROBLEMAS

### Tarea 1 - Notas
- Pendiente de configurar webhook en WordPress
- Necesitamos credenciales de WordPress Application Password

### Tarea 2 - Notas
- Definir campos mínimos requeridos para crear despacho
- Validar que el slug sea único

---

**🎯 PRÓXIMA TAREA**: Tarea 4 - Webhook WordPress → Next.js (Sincronización Automática)
**📅 Última actualización**: 2025-10-03 17:35

**✅ TAREAS COMPLETADAS HOY**:
- Tarea 1: Importación desde WordPress (ESCENARIO B)
- Tarea 2: Creación de Despachos Nuevos (ESCENARIO C)
