# 📋 PLAN DE TAREAS: Gestión Completa de Despachos y Sedes

> **Fecha de creación**: 2025-11-04  
> **Estado**: En planificación  
> **Objetivo**: Implementar sistema completo de gestión de despachos y sedes con sincronización bidireccional WordPress ↔ Supabase

---

## 🎯 CONTEXTO Y ARQUITECTURA

### Fuente de la Verdad
**WordPress es la fuente de la verdad** para los datos de despachos y sedes.

```
┌─────────────────────────────────────────────────────────────────┐
│                    ARQUITECTURA DEL SISTEMA                      │
└─────────────────────────────────────────────────────────────────┘

WordPress (CPT "despacho")  ←→  Supabase (Next.js)
         ↓                              ↑
         ↓                              ↑
    Algolia (búsqueda)                  ↑
         ↓                              ↑
         └──────────────────────────────┘
              (búsqueda rápida)

FLUJO DE DATOS:
1. WordPress → Supabase (webhook automático)
2. Supabase → WordPress (API REST al crear/editar)
3. WordPress → Algolia (automático tras cambios)
4. Next.js puede buscar en Algolia (solo lectura)
```

### Principios Clave
1. ✅ **WordPress es la fuente de la verdad**
2. ✅ **Algolia solo para búsqueda, nunca para edición**
3. ✅ **Sincronización bidireccional WordPress ↔ Supabase**
4. ✅ **Supabase almacena datos locales para el panel de usuario**
5. ⚠️ **Conflictos se resuelven priorizando WordPress**

---

## 📊 ESTRUCTURA DE DATOS

### Tabla: `despachos` (Supabase)
```sql
- id (UUID PRIMARY KEY)
- object_id (VARCHAR NOT NULL) -- ID del despacho en WordPress
- nombre (VARCHAR NOT NULL)
- descripcion (TEXT)
- slug (VARCHAR NOT NULL)
- num_sedes (INTEGER DEFAULT 1)
- areas_practica (TEXT[] DEFAULT '{}')
- ultima_actualizacion (TIMESTAMP DEFAULT now())
- fecha_creacion (TIMESTAMP DEFAULT now())
- fecha_actualizacion (TIMESTAMP DEFAULT now())
- verificado (BOOLEAN DEFAULT false)
- activo (BOOLEAN DEFAULT true)
- estado_registro (VARCHAR DEFAULT 'borrador')
- fecha_solicitud (TIMESTAMP)
- fecha_aprobacion (TIMESTAMP)
- aprobado_por (UUID FK a users.id)
- notas_aprobacion (TEXT)
- sincronizado_algolia (BOOLEAN DEFAULT false)
- sincronizado_wordpress (BOOLEAN DEFAULT false)
- fecha_sync_algolia (TIMESTAMP)
- fecha_sync_wordpress (TIMESTAMP)
- owner_email (TEXT)
- direccion (TEXT)
- telefono (TEXT)
- email (TEXT)
- web (TEXT)
- wp_post_id (INTEGER)
- sincronizado_wp (BOOLEAN DEFAULT false)
- ultima_sincronizacion (TIMESTAMP)
```

### Tabla: `sedes` (Supabase)
```sql
- id (SERIAL PRIMARY KEY)
- despacho_id (UUID FK a despachos.id NOT NULL)
- nombre (VARCHAR NOT NULL)
- descripcion (TEXT)
- web (VARCHAR)
- ano_fundacion (VARCHAR)
- tamano_despacho (VARCHAR)
- persona_contacto (VARCHAR)
- email_contacto (VARCHAR)

NOTA: La tabla sedes en el schema actual es básica. 
Para funcionalidades avanzadas (ubicación detallada, horarios, 
redes sociales, etc.) se necesitará ampliar el schema.
```

### Tabla: `user_despachos` (Supabase)
```sql
- id (UUID PRIMARY KEY DEFAULT uuid_generate_v4())
- user_id (UUID FK a users.id NOT NULL)
- despacho_id (UUID FK a despachos.id NOT NULL)
- asignado_por (UUID FK a users.id)
- rol (TEXT)
- created_at (TIMESTAMP DEFAULT now())
- updated_at (TIMESTAMP DEFAULT now())
- UNIQUE(user_id, despacho_id)
```

---

## 🎯 TAREAS PRINCIPALES

### FASE 1: CREACIÓN DE DESPACHOS (ESCENARIO C)

#### ✅ TAREA 1.1: Mensaje en Modal de Importar cuando No se Encuentra Despacho
**Archivo**: `components/BuscadorDespachosWordpress.tsx` o modal de importar  
**Prioridad**: 🔴 ALTA  
**Estado**: ⏳ PENDIENTE

**Descripción**:
En la página `/dashboard/despachos` ya existen dos botones:
- "Importar desde LexHoy" (abre modal de búsqueda en WordPress)
- "Dar de alta nuevo despacho" (al lado del anterior)

Cuando el usuario usa el modal de "Importar desde LexHoy" y NO encuentra su despacho, debe aparecer un mensaje:
**"¿No encuentras tu despacho? Aquí puedes darlo de alta"** con un botón que redirija a `/dashboard/despachos/crear`

**Subtareas**:
- [ ] Localizar componente del modal de importar (probablemente `BuscadorDespachosWordpress`)
- [ ] Detectar cuando la búsqueda no retorna resultados
- [ ] Mostrar mensaje: "¿No encuentras tu despacho? Aquí puedes darlo de alta"
- [ ] Agregar botón "Dar de Alta Despacho" que redirija a `/dashboard/despachos/crear`
- [ ] Diseño consistente con el resto del modal

**Archivos a modificar**:
- `components/BuscadorDespachosWordpress.tsx` (o el componente del modal)
- `app/dashboard/despachos/page.tsx` (si es necesario)

---

#### ✅ TAREA 1.2: Verificar Botones Existentes en /dashboard/despachos
**Archivo**: `app/dashboard/despachos/page.tsx`  
**Prioridad**: 🟢 BAJA (Ya existe)  
**Estado**: ✅ COMPLETADO

**Descripción**:
Ya existen dos botones en la parte inferior de `/dashboard/despachos`:
1. **"Importar desde LexHoy"** - Abre modal para buscar en WordPress
2. **"Dar de alta nuevo despacho"** - Debe redirigir a `/dashboard/despachos/crear`

**Verificar**:
- [x] Los botones están visibles en la página
- [ ] El botón "Dar de alta nuevo despacho" redirecciona correctamente a `/dashboard/despachos/crear`
- [ ] El diseño es consistente y visible

**Archivos a revisar**:
- `app/dashboard/despachos/page.tsx` (líneas 600-640 aprox.)

---

#### ✅ TAREA 1.3: Formulario de Creación de Despacho
**Archivo**: `app/dashboard/despachos/crear/page.tsx`  
**Prioridad**: 🔴 ALTA  
**Estado**: ⏳ PENDIENTE

**Descripción**:
Crear página con formulario completo para dar de alta un nuevo despacho.

**Campos del formulario**:
- **Información básica** (requeridos):
  - Nombre del despacho
  - Descripción
  - Áreas de práctica (multi-select)
  
- **Sede principal** (requeridos):
  - Localidad
  - Provincia
  - Dirección (calle, número, piso)
  - Código postal
  
- **Contacto** (opcionales):
  - Teléfono
  - Email
  - Sitio web
  
- **Adicionales** (opcionales):
  - Año de fundación
  - Tamaño del despacho
  - Persona de contacto

**Flujo**:
1. Usuario completa formulario
2. Validación de campos requeridos
3. POST a `/api/crear-despacho`
4. Crear en Supabase (despacho + sede principal)
5. Enviar a WordPress (obtener wordpress_id)
6. Marcar como sincronizado
7. Redirigir a solicitud de propiedad

**Subtareas**:
- [ ] Crear página `app/dashboard/despachos/crear/page.tsx`
- [ ] Diseñar formulario con validación
- [ ] Implementar lógica de envío
- [ ] Manejo de errores y feedback
- [ ] Loading states
- [ ] Confirmación de éxito

**Archivos a crear**:
- `app/dashboard/despachos/crear/page.tsx`
- `components/forms/CrearDespachoForm.tsx` (opcional)

**Endpoints utilizados**:
- `POST /api/crear-despacho` ✅ (ya existe)

---

### FASE 1B: MEJORAS DE NAVEGACIÓN

#### ✅ TAREA 1.4: Submenús en Dashboard (Sidebar)
**Archivo**: Layout o componente de navegación del dashboard  
**Prioridad**: 🟡 MEDIA  
**Estado**: ⏳ PENDIENTE

**Descripción**:
Agregar submenús desplegables en el menú lateral del dashboard para acceso rápido a secciones específicas.

**Submenús a implementar**:

**1. Dashboard** (sin submenú)

**2. Despachos** (con submenú):
- Alta Despacho → `/dashboard/despachos/crear`
- Despachos Importados → `/dashboard/despachos?filter=importados`
- Buscar Despachos → `/dashboard/despachos`

**3. Leads** (sin submenú por ahora)

**4. Configuración** (con submenú):
- Perfil → `/dashboard/settings?tab=profile`
- Contraseña → `/dashboard/settings?tab=password`
- Notificaciones → `/dashboard/settings?tab=notifications`
- Mis Despachos → `/dashboard/settings?tab=mis-despachos`
- Privacidad → `/dashboard/settings?tab=privacy`
- Sesiones → `/dashboard/settings?tab=sessions`

**Subtareas**:
- [ ] Identificar componente de navegación/sidebar
- [ ] Implementar lógica de submenús desplegables
- [ ] Agregar iconos para cada submenú
- [ ] Animación de apertura/cierre
- [ ] Resaltar item activo según ruta actual
- [ ] Responsive: comportamiento en móvil

**Archivos a modificar**:
- `app/dashboard/layout.tsx` o componente de sidebar
- `components/dashboard/Sidebar.tsx` (si existe)

---

#### ✅ TAREA 1.5: Tabs en Página de Configuración
**Archivo**: `app/dashboard/settings/page.tsx`  
**Prioridad**: 🟡 MEDIA  
**Estado**: ⏳ PENDIENTE

**Descripción**:
Implementar sistema de tabs en la página de configuración con las siguientes secciones:

**Tabs a implementar**:

1. **Perfil**
   - Título: "Perfil"
   - Descripción: "Actualiza tu información personal"
   - Icono: UserIcon
   - Contenido: Formulario de datos personales

2. **Contraseña**
   - Título: "Contraseña"
   - Descripción: "Cambia tu contraseña de acceso"
   - Icono: KeyIcon
   - Contenido: Formulario de cambio de contraseña

3. **Notificaciones**
   - Título: "Notificaciones"
   - Descripción: "Gestiona tus preferencias de notificaciones"
   - Icono: BellIcon
   - Contenido: Configuración de notificaciones

4. **Mis Despachos**
   - Título: "Mis Despachos"
   - Descripción: "Administra tus despachos asignados"
   - Icono: BuildingOfficeIcon
   - Contenido: Lista de despachos del usuario

5. **Privacidad**
   - Título: "Privacidad"
   - Descripción: "Controla tu privacidad y datos"
   - Icono: ShieldCheckIcon
   - Contenido: Configuración de privacidad

6. **Sesiones**
   - Título: "Sesiones"
   - Descripción: "Gestiona tus sesiones activas"
   - Icono: ComputerDesktopIcon
   - Contenido: Lista de sesiones activas

**Subtareas**:
- [ ] Verificar si ya existen componentes de tabs (parece que sí según el código)
- [ ] Asegurar que todos los tabs estén implementados
- [ ] Navegación por URL con query params (?tab=profile)
- [ ] Diseño consistente con iconos y descripciones
- [ ] Animaciones de transición entre tabs
- [ ] Responsive design

**Archivos a modificar**:
- `app/dashboard/settings/page.tsx` (ya tiene estructura de tabs)
- `components/settings/ProfileTab.tsx` ✅ (ya existe)
- `components/settings/PasswordTab.tsx` ✅ (ya existe)
- `components/settings/NotificationsTab.tsx` ✅ (ya existe)
- `components/settings/MisDespachosTab.tsx` ✅ (ya existe)
- `components/settings/PrivacyTab.tsx` ✅ (ya existe)
- `components/settings/SessionsTab.tsx` ✅ (ya existe)

**Nota**: Parece que la estructura de tabs ya está implementada. Solo verificar funcionalidad.

---

### FASE 2: GESTIÓN DE SEDES

> **⚠️ IMPORTANTE**: Cada despacho DEBE tener al menos UNA sede obligatoriamente.  
> Los datos del despacho se almacenan realmente en la tabla `sedes`.  
> Muchos despachos tienen múltiples sedes, por lo que es fundamental poder:  
> - **Crear nuevas sedes** (administrador del despacho o super_admin)  
> - **Editar sedes existentes**  
> - **Eliminar sedes** (excepto si es la única sede)  
> - **Marcar sede principal** (solo una por despacho)  

**Permisos de acceso**:
- 👤 **Propietario del despacho** (rol en `user_despachos`): Puede gestionar todas las sedes
- 🔑 **Super Admin**: Puede gestionar sedes de cualquier despacho
- ❌ **Otros usuarios**: No tienen acceso

**🚨 PREREQUISITO**: Antes de implementar, aplicar migración de base de datos (ver `MIGRACION_SEDES_SCHEMA.md`)

---

#### ✅ TAREA 2.1: Listado de Sedes del Despacho
**Archivo**: `app/dashboard/despachos/[id]/sedes/page.tsx`  
**Prioridad**: 🔴 ALTA  
**Estado**: ⏳ PENDIENTE

**Descripción**:
Página para que el propietario del despacho o super_admin vea todas las sedes de un despacho.

**Funcionalidades**:
- Listar todas las sedes del despacho
- Indicar cuál es la sede principal (badge o icono)
- Mostrar información resumida de cada sede:
  - Nombre de la sede
  - Localidad, Provincia
  - Teléfono, Email, Web
  - Estado (activa/inactiva)
- Botones de acción: Ver, Editar, Eliminar
- Botón destacado "+ Agregar Nueva Sede"
- Contador: "X sedes registradas"

**Validación de permisos**:
- Verificar que el usuario es propietario del despacho o super_admin
- Si no tiene permisos, mostrar mensaje de error

**Subtareas**:
- [ ] Crear página `app/dashboard/despachos/[id]/sedes/page.tsx`
- [ ] Crear endpoint `GET /api/despachos/[id]/sedes`
- [ ] Validar permisos (propietario o super_admin)
- [ ] Diseñar UI de listado de sedes
- [ ] Implementar filtros (activas, inactivas, principal)
- [ ] Agregar paginación si hay muchas sedes
- [ ] Mostrar contador de sedes
- [ ] Botón destacado "+ Agregar Nueva Sede"

**Archivos a crear**:
- `app/dashboard/despachos/[id]/sedes/page.tsx`
- `app/api/despachos/[id]/sedes/route.ts`
- `components/sedes/SedeCard.tsx`

---

#### ✅ TAREA 2.2: Crear Nueva Sede
**Archivo**: `app/dashboard/despachos/[id]/sedes/crear/page.tsx`  
**Prioridad**: 🔴 ALTA  
**Estado**: ⏳ PENDIENTE

**Descripción**:
Formulario para que el propietario del despacho o super_admin agregue una nueva sede.

**Acceso**:
- Desde el listado de sedes: Botón "+ Agregar Nueva Sede"
- Desde el menú: Dashboard > Despachos > [Mi Despacho] > Sedes > Crear
- URL directa: `/dashboard/despachos/[id]/sedes/crear`

**Campos del formulario** (según schema actual):

**Básicos** (requeridos):
- Nombre de la sede
- Descripción

**Contacto**:
- Web
- Email de contacto
- Persona de contacto

**Información adicional**:
- Año de fundación
- Tamaño del despacho

**Nota**: Si necesitas campos adicionales (ubicación detallada, horarios, redes sociales),  
debes ampliar el schema de la tabla `sedes` primero (ver `CAMBIOS_PLAN_TAREAS.md`).

**Flujo**:
1. Validar permisos (propietario o super_admin)
2. Usuario completa formulario
3. Validación de campos requeridos
4. POST a `/api/despachos/[id]/sedes`
5. Crear en Supabase (tabla `sedes`)
6. Incrementar `num_sedes` en tabla `despachos`
7. Enviar a WordPress (actualizar meta._despacho_sedes)
8. Marcar como sincronizado
9. Mostrar mensaje de éxito
10. Redirigir a listado de sedes

**Subtareas**:
- [ ] Crear página `app/dashboard/despachos/[id]/sedes/crear/page.tsx`
- [ ] Crear endpoint `POST /api/despachos/[id]/sedes`
- [ ] Validar permisos en endpoint
- [ ] Diseñar formulario con campos actuales del schema
- [ ] Validación de campos requeridos
- [ ] Incrementar contador `num_sedes` en despacho
- [ ] Integración con WordPress (actualizar array de sedes)
- [ ] Manejo de errores y feedback
- [ ] Loading states

**Archivos a crear**:
- `app/dashboard/despachos/[id]/sedes/crear/page.tsx` ✅ (creado)
- `app/api/despachos/[id]/sedes/route.ts` ✅ (creado)
- `components/forms/CrearSedeForm.tsx` (opcional)

---

#### ✅ TAREA 2.2.1: Correcciones Formulario Crear Sede
**Archivo**: `app/dashboard/despachos/[id]/sedes/crear/page.tsx`  
**Prioridad**: 🔴 ALTA  
**Estado**: ⏳ PENDIENTE

**Descripción**:
Corregir y mejorar el formulario de creación de sede según feedback del usuario.

**Correcciones necesarias**:

1. **Botón Guardar Duplicado**:
   - Agregar botón "Guardar Nueva Sede" también debajo del formulario
   - Considerar hacerlo sticky al hacer scroll

2. **Campos Obligatorios**:
   - Hacer obligatorios: Nombre, Localidad, Provincia, Email, Teléfono
   - Agregar texto "* Campos obligatorios" al inicio del formulario
   - Mantener asterisco rojo en cada campo obligatorio
   - Usar validación HTML5 (no mostrar mensajes personalizados)

3. **Campo de Foto de Perfil**:
   - Agregar sección "Foto de Perfil"
   - Input de archivo con preview
   - Aceptar: JPG, PNG, GIF (máx 2MB)
   - Subir a Supabase Storage: bucket `sedes-fotos`
   - Ruta: `{despacho_id}/{sede_id}/perfil.jpg`
   - Guardar URL en campo `foto_perfil`

4. **Checkbox Sede Principal**:
   - Agregar checkbox "Marcar como sede principal"
   - Tooltip: "Solo puede haber una sede principal por despacho"
   - Si se marca, desmarcar otras sedes del mismo despacho

5. **Campos de Ubicación Completa**:
   - Agregar: Calle, Número, Piso, Código Postal
   - Localidad y Provincia (obligatorios)

**Subtareas**:
- [ ] Duplicar botón "Guardar" al inicio y final del formulario
- [ ] Actualizar validación de campos obligatorios
- [ ] Agregar texto "* Campos obligatorios"
- [ ] Implementar sección de foto de perfil con preview
- [ ] Configurar Supabase Storage bucket
- [ ] Implementar upload de imagen
- [ ] Agregar checkbox "Sede principal"
- [ ] Agregar campos de ubicación completa
- [ ] Actualizar interface SedeInput en sedeService.ts

**Archivos a modificar**:
- `app/dashboard/despachos/[id]/sedes/crear/page.tsx`
- `lib/sedeService.ts` (actualizar interface)
- `app/api/despachos/[id]/sedes/route.ts` (manejar upload)

---

#### ✅ TAREA 2.3: Editar Sede Existente
**Archivo**: `app/dashboard/despachos/[id]/sedes/[sedeId]/editar/page.tsx`  
**Prioridad**: 🟡 MEDIA  
**Estado**: ⏳ PENDIENTE

**Descripción**:
Formulario para editar una sede existente.

**Flujo**:
1. Cargar datos de la sede
2. Mostrar formulario pre-llenado
3. Usuario modifica campos
4. PUT a `/api/despachos/[id]/sedes/[sedeId]`
5. Actualizar en Supabase
6. Enviar cambios a WordPress
7. Marcar como sincronizado
8. Redirigir a listado de sedes

**Subtareas**:
- [ ] Crear página de edición
- [ ] Crear endpoint `PUT /api/despachos/[id]/sedes/[sedeId]`
- [ ] Cargar datos existentes
- [ ] Formulario pre-llenado
- [ ] Actualización en WordPress
- [ ] Manejo de errores

**Archivos a crear**:
- `app/dashboard/despachos/[id]/sedes/[sedeId]/editar/page.tsx`
- `app/api/despachos/[id]/sedes/[sedeId]/route.ts` (PUT)

---

#### ✅ TAREA 2.4: Eliminar Sede
**Prioridad**: 🟡 MEDIA  
**Estado**: ⏳ PENDIENTE

**Descripción**:
Permitir eliminar una sede (con confirmación).

**Restricciones IMPORTANTES**:
- ⚠️ **NO se puede eliminar la sede si es la única del despacho**
  - Cada despacho DEBE tener al menos UNA sede
  - Validar antes de permitir eliminación
- Confirmación obligatoria con mensaje claro
- Soft delete recomendado (marcar como inactiva) en lugar de hard delete
- Solo propietario del despacho o super_admin pueden eliminar

**Flujo**:
1. Usuario hace clic en "Eliminar"
2. **Validar que no es la única sede** (contar sedes del despacho)
3. Si es la única: Mostrar error "No puedes eliminar la única sede del despacho"
4. Si hay más sedes: Mostrar modal de confirmación
   - Mensaje: "¿Estás seguro de eliminar la sede [nombre]?"
   - Botón: "Cancelar" y "Eliminar"
5. DELETE a `/api/despachos/[id]/sedes/[sedeId]`
6. Validar permisos en endpoint
7. Eliminar en Supabase (o marcar como inactiva)
8. Actualizar WordPress (remover de meta._despacho_sedes)
9. Decrementar `num_sedes` en tabla `despachos`
10. Mostrar mensaje de éxito
11. Actualizar listado de sedes

**Subtareas**:
- [ ] Crear endpoint `DELETE /api/despachos/[id]/sedes/[sedeId]`
- [ ] Validar permisos en endpoint
- [ ] **Validar que no es la única sede** (crítico)
- [ ] Modal de confirmación con mensaje claro
- [ ] Implementar soft delete (marcar `activa = false`)
- [ ] Actualización en WordPress (remover del array)
- [ ] Decrementar contador `num_sedes` en despacho
- [ ] Manejo de errores
- [ ] Actualizar UI sin recargar página

**Archivos a modificar**:
- `app/api/despachos/[id]/sedes/[sedeId]/route.ts` (DELETE)
- `components/modals/ConfirmDeleteSedeModal.tsx`

---

#### ✅ TAREA 2.5: Eliminar Despacho Completo
**Prioridad**: 🟡 MEDIA  
**Estado**: ⏳ PENDIENTE

**Descripción**:
Permitir eliminar un despacho completo con todas sus sedes, leads e historial.

**⚠️ RESTRICCIONES CRÍTICAS**:
- Solo propietario del despacho o super_admin
- **Triple confirmación obligatoria**
- Eliminación en cascada de:
  - Todas las sedes del despacho
  - Todos los leads asociados
  - Todas las relaciones user_despachos
  - Todo el historial (despacho_propiedad_historial)
  - Solicitudes pendientes (despacho_ownership_requests)
- Sincronizar eliminación con WordPress

**Flujo de Eliminación**:
1. Usuario hace clic en "Eliminar Despacho" (en configuración del despacho)
2. **Modal de Advertencia**:
   - Título: "⚠️ ATENCIÓN: Acción Irreversible"
   - Mensaje: "Al eliminar el despacho se eliminarán:"
     - X sedes
     - X leads
     - Todo el historial
   - Botones: [Cancelar] [Entiendo, continuar]
3. **Modal de Confirmación 1**:
   - Mensaje: "¿Estás completamente seguro de eliminar el despacho?"
   - Botones: [Cancelar] [Sí, eliminar]
4. **Modal de Confirmación 2**:
   - Mensaje: "Escribe el nombre del despacho para confirmar: [nombre]"
   - Input de texto
   - Validar que coincida exactamente
   - Botones: [Cancelar] [Eliminar Definitivamente]
5. DELETE a `/api/despachos/[id]`
6. Validar permisos
7. Eliminar en cascada (usar ON DELETE CASCADE o manual)
8. Eliminar en WordPress
9. Mostrar mensaje de éxito
10. Redirigir a `/dashboard`

**Subtareas**:
- [ ] Crear endpoint `DELETE /api/despachos/[id]`
- [ ] Validar permisos (propietario o super_admin)
- [ ] Implementar eliminación en cascada
- [ ] Crear componente `ModalAdvertenciaEliminar`
- [ ] Crear componente `ModalConfirmacionDoble`
- [ ] Validar nombre del despacho en input
- [ ] Sincronizar eliminación con WordPress
- [ ] Actualizar Algolia (remover de índice)
- [ ] Redirigir a dashboard tras eliminar
- [ ] Agregar botón "Eliminar Despacho" en configuración

**Archivos a crear**:
- `app/api/despachos/[id]/route.ts` (DELETE)
- `components/modals/ModalAdvertenciaEliminar.tsx`
- `components/modals/ModalConfirmacionDoble.tsx`

**SQL para eliminación en cascada**:
```sql
-- Asegurar que las FK tienen ON DELETE CASCADE
ALTER TABLE sedes 
DROP CONSTRAINT IF EXISTS sedes_despacho_id_fkey,
ADD CONSTRAINT sedes_despacho_id_fkey 
  FOREIGN KEY (despacho_id) 
  REFERENCES despachos(id) 
  ON DELETE CASCADE;

ALTER TABLE leads 
DROP CONSTRAINT IF EXISTS leads_despacho_id_fkey,
ADD CONSTRAINT leads_despacho_id_fkey 
  FOREIGN KEY (despacho_id) 
  REFERENCES despachos(id) 
  ON DELETE CASCADE;

ALTER TABLE user_despachos 
DROP CONSTRAINT IF EXISTS user_despachos_despacho_id_fkey,
ADD CONSTRAINT user_despachos_despacho_id_fkey 
  FOREIGN KEY (despacho_id) 
  REFERENCES despachos(id) 
  ON DELETE CASCADE;
```

---

### FASE 3: SINCRONIZACIÓN BIDIRECCIONAL

#### ✅ TAREA 3.1: Webhook WordPress → Supabase
**Archivo**: `app/api/sync-despacho/route.ts`  
**Prioridad**: 🔴 ALTA  
**Estado**: ✅ PARCIALMENTE COMPLETADO

**Descripción**:
Recibir webhooks de WordPress cuando se crea/actualiza un despacho.

**Funcionalidades actuales**:
- ✅ Recibe datos de WordPress
- ✅ Crea/actualiza despacho en Supabase
- ✅ Sincroniza sedes múltiples
- ⏳ Configurar webhook automático en WordPress

**Subtareas pendientes**:
- [ ] Configurar webhook en WordPress (plugin o functions.php)
- [ ] Agregar autenticación al webhook (secret key)
- [ ] Manejo de reintentos si falla
- [ ] Logs de sincronización
- [ ] Notificar errores a admin

**Archivos a modificar**:
- `app/api/sync-despacho/route.ts` (agregar autenticación)
- WordPress: configurar webhook

---

#### ✅ TAREA 3.2: Sincronización Supabase → WordPress (Despachos)
**Archivo**: `lib/syncService.ts`  
**Prioridad**: 🔴 ALTA  
**Estado**: ✅ PARCIALMENTE COMPLETADO

**Descripción**:
Enviar cambios de despachos desde Supabase a WordPress.

**Funcionalidades actuales**:
- ✅ `enviarDespachoAWordPress()` - Envía despacho nuevo
- ⏳ Actualizar despacho existente en WordPress
- ⏳ Manejo de errores y reintentos

**Subtareas pendientes**:
- [ ] Implementar `actualizarDespachoEnWordPress()`
- [ ] Manejo de conflictos (última modificación gana)
- [ ] Sistema de reintentos con exponential backoff
- [ ] Cola de sincronización para operaciones fallidas
- [ ] Logs detallados

**Archivos a modificar**:
- `lib/syncService.ts`

---

#### ✅ TAREA 3.3: Sincronización Supabase → WordPress (Sedes)
**Archivo**: `lib/syncService.ts`  
**Prioridad**: 🔴 ALTA  
**Estado**: ⏳ PENDIENTE

**Descripción**:
Sincronizar cambios de sedes desde Supabase a WordPress.

**Funcionalidades necesarias**:
- Crear nueva sede en WordPress (agregar a meta._despacho_sedes)
- Actualizar sede existente en WordPress
- Eliminar sede en WordPress
- Mantener sincronizado el array de sedes

**Subtareas**:
- [ ] Implementar `sincronizarSedeAWordPress(sedeId)`
- [ ] Implementar `eliminarSedeEnWordPress(sedeId)`
- [ ] Actualizar array completo de sedes en WordPress
- [ ] Validar estructura de datos
- [ ] Manejo de errores

**Archivos a modificar**:
- `lib/syncService.ts`

**Métodos a crear**:
```typescript
// Sincronizar una sede específica
static async sincronizarSedeAWordPress(sedeId: number): Promise<SyncResult>

// Eliminar sede en WordPress
static async eliminarSedeEnWordPress(sedeId: number): Promise<SyncResult>

// Sincronizar todas las sedes de un despacho
static async sincronizarSedesDespacho(despachoId: string): Promise<SyncResult>
```

---

#### ✅ TAREA 3.4: Resolución de Conflictos
**Prioridad**: 🟡 MEDIA  
**Estado**: ⏳ PENDIENTE

**Descripción**:
Implementar estrategia para resolver conflictos cuando hay cambios simultáneos en WordPress y Supabase.

**Estrategia propuesta**:
1. **WordPress siempre gana** (es la fuente de la verdad)
2. Comparar `updated_at` antes de sincronizar
3. Si WordPress es más reciente, sobrescribir Supabase
4. Notificar al usuario si se sobrescribieron sus cambios

**Subtareas**:
- [ ] Implementar comparación de timestamps
- [ ] Lógica de resolución de conflictos
- [ ] Notificación al usuario
- [ ] Log de conflictos resueltos
- [ ] Dashboard de sincronización para admin

**Archivos a crear**:
- `lib/conflictResolution.ts`
- `app/admin/sync-logs/page.tsx` (dashboard de sincronización)

---

### FASE 4: INTEGRACIÓN CON ALGOLIA

#### ✅ TAREA 4.1: Búsqueda en Algolia desde Next.js
**Prioridad**: 🟢 BAJA  
**Estado**: ⏳ PENDIENTE

**Descripción**:
Implementar búsqueda rápida de despachos usando Algolia (solo lectura).

**Funcionalidades**:
- Búsqueda instantánea de despachos
- Filtros por localidad, provincia, áreas de práctica
- Autocompletado
- Resultados en tiempo real

**Subtareas**:
- [ ] Configurar cliente de Algolia en Next.js
- [ ] Crear componente de búsqueda
- [ ] Implementar filtros
- [ ] Diseñar UI de resultados
- [ ] Integrar con página de búsqueda

**Archivos a crear**:
- `lib/algoliaClient.ts`
- `components/search/AlgoliaSearch.tsx`
- `app/buscar/page.tsx`

**Nota**: Algolia solo para búsqueda, nunca para edición.

---

### FASE 4B: REDISEÑO DE UI GLOBAL

> **🎨 IMPORTANTE**: Actualmente hay inconsistencia en el diseño.  
> Se mezclan 2 estilos diferentes: PlayFair Display (elegante) con botones gruesos y colores fuertes.  
> Necesitamos unificar el diseño con una paleta más refinada y fuentes coherentes.  

---

#### ✅ TAREA UI.1: Sistema de Fuentes Coherente
**Prioridad**: 🟢 BAJA (pero importante para UX)  
**Estado**: ⏳ PENDIENTE

**Descripción**:
Implementar sistema de fuentes coherente con PlayFair Display para títulos y una fuente auxiliar legible para UI.

**Propuesta**:
- **Fuente Principal**: PlayFair Display (títulos, headings)
- **Fuente Secundaria**: Inter, Poppins o Work Sans (cuerpo, botones, inputs)

**Implementación**:
```typescript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        primary: ['Playfair Display', 'serif'],
        secondary: ['Inter', 'sans-serif'],
      },
    },
  },
};
```

**Uso**:
```tsx
<h1 className="font-primary">Título Elegante</h1>
<p className="font-secondary">Texto legible</p>
<button className="font-secondary">Botón</button>
```

**Subtareas**:
- [ ] Instalar fuente secundaria (Inter o Poppins)
- [ ] Actualizar `tailwind.config.js`
- [ ] Aplicar `font-primary` a todos los h1, h2, h3
- [ ] Aplicar `font-secondary` a body, buttons, inputs
- [ ] Documentar en guía de estilos

---

#### ✅ TAREA UI.2: Paleta de Colores Refinada
**Prioridad**: 🟢 BAJA  
**Estado**: ⏳ PENDIENTE

**Descripción**:
Actualizar paleta de colores a tonos más suaves y refinados.

**Colores propuestos**:
```css
/* Azul Principal (más suave) */
--primary-500: #3b82f6;
--primary-600: #2563eb;

/* Púrpura Secundario */
--secondary-500: #8b5cf6;

/* Ámbar para Acentos */
--accent-500: #f59e0b;

/* Grises Sutiles */
--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-500: #6b7280;
--gray-900: #111827;
```

**Subtareas**:
- [ ] Definir paleta completa en `tailwind.config.js`
- [ ] Actualizar colores de botones
- [ ] Actualizar colores de badges
- [ ] Actualizar colores de alertas
- [ ] Documentar paleta en guía de estilos

---

#### ✅ TAREA UI.3: Componentes de Botones Estandarizados
**Prioridad**: 🟢 BAJA  
**Estado**: ⏳ PENDIENTE

**Descripción**:
Crear componentes de botones estandarizados más finos y elegantes.

**Variantes**:
1. **Primary**: Azul sólido
2. **Secondary**: Outline gris
3. **Danger**: Rojo suave
4. **Ghost**: Transparente

**Características**:
- Bordes más finos
- Sombras sutiles
- Transiciones suaves
- Focus states accesibles

**Subtareas**:
- [ ] Crear `components/ui/Button.tsx`
- [ ] Implementar variantes (primary, secondary, danger, ghost)
- [ ] Implementar tamaños (sm, md, lg)
- [ ] Agregar loading state
- [ ] Agregar disabled state
- [ ] Documentar uso

---

#### ✅ TAREA UI.4: Inputs y Forms Refinados
**Prioridad**: 🟢 BAJA  
**Estado**: ⏳ PENDIENTE

**Descripción**:
Actualizar estilos de inputs y formularios para que sean más limpios y consistentes.

**Características**:
- Bordes más sutiles (gray-200)
- Focus ring más suave
- Placeholders más claros
- Labels consistentes

**Subtareas**:
- [ ] Crear `components/ui/Input.tsx`
- [ ] Crear `components/ui/Textarea.tsx`
- [ ] Crear `components/ui/Select.tsx`
- [ ] Crear `components/ui/Checkbox.tsx`
- [ ] Aplicar estilos globalmente
- [ ] Documentar uso

---

#### ✅ TAREA UI.5: Cards y Contenedores
**Prioridad**: 🟢 BAJA  
**Estado**: ⏳ PENDIENTE

**Descripción**:
Estandarizar estilos de cards y contenedores.

**Características**:
- Bordes sutiles (gray-100)
- Sombras suaves
- Bordes redondeados (rounded-xl)
- Hover states elegantes

**Subtareas**:
- [ ] Crear `components/ui/Card.tsx`
- [ ] Aplicar a todas las cards existentes
- [ ] Documentar uso

---

#### ✅ TAREA UI.6: Guía de Estilos
**Prioridad**: 🟢 BAJA  
**Estado**: ⏳ PENDIENTE

**Descripción**:
Crear documentación completa de la guía de estilos.

**Contenido**:
- Sistema de fuentes
- Paleta de colores
- Componentes UI
- Espaciado y grid
- Iconografía
- Ejemplos de uso

**Subtareas**:
- [ ] Crear `docs/GUIA_ESTILOS.md`
- [ ] Documentar fuentes
- [ ] Documentar colores
- [ ] Documentar componentes
- [ ] Agregar ejemplos visuales

---

### FASE 5: MEJORAS Y OPTIMIZACIONES

#### ✅ TAREA 5.1: Sistema de Logs de Sincronización
**Prioridad**: 🟡 MEDIA  
**Estado**: ⏳ PENDIENTE

**Descripción**:
Crear tabla y sistema para registrar todas las sincronizaciones.

**Tabla**: `sync_logs` (Supabase)
```sql
- id (UUID)
- tipo (TEXT) -- despacho, sede
- accion (TEXT) -- create, update, delete
- origen (TEXT) -- wordpress, supabase
- destino (TEXT) -- wordpress, supabase
- entidad_id (TEXT) -- ID del despacho o sede
- estado (TEXT) -- success, error, pending
- error_mensaje (TEXT)
- datos_enviados (JSONB)
- datos_recibidos (JSONB)
- created_at (TIMESTAMP)
```

**Subtareas**:
- [ ] Crear tabla `sync_logs`
- [ ] Implementar logging en syncService
- [ ] Dashboard de logs para admin
- [ ] Filtros y búsqueda de logs
- [ ] Reintentar sincronizaciones fallidas

---

#### ✅ TAREA 5.2: Cola de Sincronización
**Prioridad**: 🟡 MEDIA  
**Estado**: ⏳ PENDIENTE

**Descripción**:
Implementar cola para reintentar sincronizaciones fallidas.

**Tabla**: `sync_queue` (Supabase)
```sql
- id (UUID)
- tipo (TEXT)
- accion (TEXT)
- entidad_id (TEXT)
- datos (JSONB)
- intentos (INTEGER)
- max_intentos (INTEGER)
- proximo_intento (TIMESTAMP)
- estado (TEXT) -- pending, processing, completed, failed
- created_at, updated_at
```

**Subtareas**:
- [ ] Crear tabla `sync_queue`
- [ ] Implementar worker para procesar cola
- [ ] Exponential backoff para reintentos
- [ ] Notificar admin si falla después de max_intentos
- [ ] Cron job o webhook para procesar cola

---

#### ✅ TAREA 5.3: Validación de Datos
**Prioridad**: 🟡 MEDIA  
**Estado**: ⏳ PENDIENTE

**Descripción**:
Implementar validación robusta de datos antes de sincronizar.

**Validaciones**:
- Campos requeridos presentes
- Formato de email, teléfono, web
- Longitud de campos
- Valores permitidos (enums)
- Coordenadas geográficas válidas

**Subtareas**:
- [ ] Crear esquemas de validación (Zod o Yup)
- [ ] Validar en frontend antes de enviar
- [ ] Validar en backend antes de guardar
- [ ] Mensajes de error claros
- [ ] Sanitización de datos

**Archivos a crear**:
- `lib/validation/despachoSchema.ts`
- `lib/validation/sedeSchema.ts`

---

#### ✅ TAREA 5.4: Testing
**Prioridad**: 🟢 BAJA  
**Estado**: ⏳ PENDIENTE

**Descripción**:
Implementar tests para funcionalidades críticas.

**Tests necesarios**:
- Unit tests para syncService
- Integration tests para endpoints API
- E2E tests para flujos de usuario
- Tests de sincronización bidireccional

**Subtareas**:
- [ ] Configurar Jest y React Testing Library
- [ ] Tests unitarios de syncService
- [ ] Tests de endpoints API
- [ ] Tests E2E con Playwright
- [ ] Mock de WordPress API

---

## 📅 CRONOGRAMA SUGERIDO

### Sprint 1 (Semana 1-2): Creación de Despachos y Navegación
- ✅ TAREA 1.1: Mensaje en modal de importar
- ✅ TAREA 1.2: Verificar botones existentes (ya completado)
- ✅ TAREA 1.3: Formulario de creación de despacho
- ✅ TAREA 1.4: Submenús en dashboard
- ✅ TAREA 1.5: Tabs en configuración (verificar)

### Sprint 2 (Semana 3-4): Gestión de Sedes
- ✅ TAREA 2.1: Listado de sedes
- ✅ TAREA 2.2: Crear nueva sede
- ✅ TAREA 2.3: Editar sede
- ✅ TAREA 2.4: Eliminar sede

### Sprint 3 (Semana 5-6): Sincronización Bidireccional
- ✅ TAREA 3.1: Webhook WordPress → Supabase
- ✅ TAREA 3.2: Sincronización despachos
- ✅ TAREA 3.3: Sincronización sedes
- ✅ TAREA 3.4: Resolución de conflictos

### Sprint 4 (Semana 7-8): Mejoras y Optimizaciones
- ✅ TAREA 5.1: Sistema de logs
- ✅ TAREA 5.2: Cola de sincronización
- ✅ TAREA 5.3: Validación de datos
- ✅ TAREA 4.1: Integración con Algolia
- ✅ TAREA 5.4: Testing

---

## 🔧 SERVICIOS A CREAR/MODIFICAR

### `lib/syncService.ts` (MODIFICAR)
```typescript
class SyncService {
  // Despachos
  static async enviarDespachoAWordPress(despachoId: string): Promise<SyncResult>
  static async actualizarDespachoEnWordPress(despachoId: string): Promise<SyncResult>
  static async importarDespachoDesdeWordPress(wordpressId: number): Promise<SyncResult>
  
  // Sedes
  static async sincronizarSedeAWordPress(sedeId: number): Promise<SyncResult>
  static async eliminarSedeEnWordPress(sedeId: number): Promise<SyncResult>
  static async sincronizarSedesDespacho(despachoId: string): Promise<SyncResult>
  
  // Utilidades
  static async verificarEstadoSincronizacion(despachoId: string): Promise<SyncStatus>
  static async resolverConflictos(despachoId: string): Promise<ConflictResolution>
}
```

### `lib/sedeService.ts` (CREAR)
```typescript
class SedeService {
  // CRUD
  static async crearSede(despachoId: string, sedeData: SedeInput): Promise<Sede>
  static async obtenerSede(sedeId: number): Promise<Sede>
  static async actualizarSede(sedeId: number, sedeData: Partial<SedeInput>): Promise<Sede>
  static async eliminarSede(sedeId: number): Promise<void>
  
  // Listado
  static async listarSedesDespacho(despachoId: string): Promise<Sede[]>
  static async obtenerSedePrincipal(despachoId: string): Promise<Sede>
  
  // Validación
  static async validarSede(sedeData: SedeInput): Promise<ValidationResult>
}
```

### `lib/queueService.ts` (CREAR)
```typescript
class QueueService {
  static async agregarACola(tipo: string, accion: string, datos: any): Promise<void>
  static async procesarCola(): Promise<void>
  static async reintentarFallidos(): Promise<void>
  static async limpiarCompletados(): Promise<void>
}
```

---

## 🚨 CONSIDERACIONES IMPORTANTES

### Seguridad
- ✅ Autenticar todos los endpoints de edición
- ✅ Validar permisos de usuario (solo propietario puede editar)
- ✅ Sanitizar inputs para prevenir XSS
- ✅ Rate limiting en endpoints públicos
- ✅ Secret key para webhooks de WordPress

### Performance
- ✅ Cachear datos de despachos frecuentemente consultados
- ✅ Paginación en listados grandes
- ✅ Lazy loading de sedes
- ✅ Optimizar queries de Supabase
- ✅ Usar índices en campos de búsqueda

### UX
- ✅ Loading states en todas las operaciones
- ✅ Mensajes de error claros y accionables
- ✅ Confirmaciones antes de acciones destructivas
- ✅ Feedback visual de sincronización
- ✅ Indicador de estado de sincronización

### Monitoreo
- ✅ Logs detallados de sincronizaciones
- ✅ Alertas para sincronizaciones fallidas
- ✅ Dashboard de métricas para admin
- ✅ Notificaciones de errores críticos

---

## 📝 NOTAS FINALES

### Priorización
1. **🔴 ALTA**: Funcionalidades core que bloquean el flujo principal
2. **🟡 MEDIA**: Mejoras importantes pero no bloqueantes
3. **🟢 BAJA**: Optimizaciones y features nice-to-have

### Dependencias
- Fase 1 debe completarse antes de Fase 2
- Fase 3 puede desarrollarse en paralelo con Fase 2
- Fase 4 y 5 son independientes

### Riesgos
- ⚠️ Conflictos de sincronización si hay ediciones simultáneas
- ⚠️ Pérdida de datos si falla sincronización sin cola
- ⚠️ Performance si hay muchas sedes por despacho
- ⚠️ Complejidad de mantener 3 fuentes (WP, Supabase, Algolia)

### Recomendaciones
- ✅ Implementar Fase 1 y 2 primero (funcionalidad básica)
- ✅ Fase 3 es crítica para mantener consistencia
- ✅ Fase 5 (logs y cola) es importante para producción
- ✅ Testing continuo en cada fase

---

**Última actualización**: 2025-11-04  
**Próxima revisión**: Después de completar Sprint 1
