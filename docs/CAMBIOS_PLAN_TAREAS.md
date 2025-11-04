# 📝 CAMBIOS EN EL PLAN DE TAREAS - Actualización 2025-11-04

## 🔄 Resumen de Cambios

Este documento detalla las actualizaciones realizadas al plan de tareas basándose en:
1. Revisión del schema real de la base de datos (`DATABASE_SCHEMA.md`)
2. Análisis del código existente en `/dashboard/despachos`
3. Nuevos requerimientos de UX/navegación

---

## ✅ CAMBIOS REALIZADOS

### 1. Estructura de Datos Corregida

#### Tabla `despachos`
**Antes**: Schema simplificado con campos básicos  
**Ahora**: Schema completo según `DATABASE_SCHEMA.md` incluyendo:
- `object_id` (VARCHAR) en lugar de `wordpress_id`
- Campos de sincronización: `sincronizado_algolia`, `sincronizado_wordpress`, `sincronizado_wp`
- Campos de aprobación: `fecha_solicitud`, `fecha_aprobacion`, `aprobado_por`, `notas_aprobacion`
- Campos de contacto: `owner_email`, `direccion`, `telefono`, `email`, `web`
- `wp_post_id` (INTEGER) adicional
- `estado_registro` (VARCHAR) con valores: 'borrador', 'publicado', etc.

#### Tabla `sedes`
**Antes**: Schema extenso con muchos campos (ubicación detallada, horarios, redes sociales, etc.)  
**Ahora**: Schema básico actual según base de datos:
- `id` (SERIAL)
- `despacho_id` (UUID FK)
- `nombre`, `descripcion`
- `web`, `ano_fundacion`, `tamano_despacho`
- `persona_contacto`, `email_contacto`

**Nota importante**: Se agregó advertencia de que para funcionalidades avanzadas (ubicación detallada, horarios, redes sociales) se necesitará ampliar el schema.

#### Tabla `user_despachos`
**Antes**: Campo `rol_despacho`  
**Ahora**: Campo `rol` (según schema real)
- Agregado campo `asignado_por` (UUID FK)

---

### 2. Eliminación de Tarea Innecesaria

#### TAREA 1.1 (ANTES): Popup de Invitación a Crear Despacho
**Estado**: ❌ ELIMINADA

**Razón**: Ya existen dos botones en `/dashboard/despachos`:
- "Importar desde LexHoy" (línea ~639)
- "Dar de alta nuevo despacho" (al lado del anterior)

No es necesario un popup adicional.

---

### 3. Nueva Tarea: Mensaje en Modal de Importar

#### TAREA 1.1 (AHORA): Mensaje en Modal cuando No se Encuentra Despacho
**Prioridad**: 🔴 ALTA  
**Estado**: ⏳ PENDIENTE

**Descripción**:
Cuando el usuario usa el modal "Importar desde LexHoy" y NO encuentra su despacho, mostrar:
- Mensaje: **"¿No encuentras tu despacho? Aquí puedes darlo de alta"**
- Botón: "Dar de Alta Despacho" → redirije a `/dashboard/despachos/crear`

**Componente a modificar**: `components/BuscadorDespachosWordpress.tsx`

---

### 4. Tarea Actualizada: Verificar Botones Existentes

#### TAREA 1.2 (ACTUALIZADA): Verificar Botones Existentes
**Prioridad**: 🟢 BAJA (Ya existe)  
**Estado**: ✅ PARCIALMENTE COMPLETADO

**Cambios**:
- Antes: "Agregar botón en dashboard"
- Ahora: "Verificar que botones existentes funcionen correctamente"

**Verificaciones pendientes**:
- [ ] El botón "Dar de alta nuevo despacho" redirecciona a `/dashboard/despachos/crear`
- [ ] El diseño es visible y consistente

---

### 5. Nuevas Tareas: Mejoras de Navegación (FASE 1B)

#### TAREA 1.4: Submenús en Dashboard (Sidebar)
**Prioridad**: 🟡 MEDIA  
**Estado**: ⏳ PENDIENTE

**Submenús a implementar**:

**Despachos**:
- Alta Despacho → `/dashboard/despachos/crear`
- Despachos Importados → `/dashboard/despachos?filter=importados`
- Buscar Despachos → `/dashboard/despachos`

**Configuración**:
- Perfil → `/dashboard/settings?tab=profile`
- Contraseña → `/dashboard/settings?tab=password`
- Notificaciones → `/dashboard/settings?tab=notifications`
- Mis Despachos → `/dashboard/settings?tab=mis-despachos`
- Privacidad → `/dashboard/settings?tab=privacy`
- Sesiones → `/dashboard/settings?tab=sessions`

**Archivos a modificar**:
- `app/dashboard/layout.tsx` o componente de sidebar
- `components/dashboard/Sidebar.tsx` (si existe)

---

#### TAREA 1.5: Tabs en Página de Configuración
**Prioridad**: 🟡 MEDIA  
**Estado**: ⏳ PENDIENTE (Verificar funcionalidad)

**Tabs a implementar** (con iconos y descripciones):
1. **Perfil** - "Actualiza tu información personal" (UserIcon)
2. **Contraseña** - "Cambia tu contraseña de acceso" (KeyIcon)
3. **Notificaciones** - "Gestiona tus preferencias de notificaciones" (BellIcon)
4. **Mis Despachos** - "Administra tus despachos asignados" (BuildingOfficeIcon)
5. **Privacidad** - "Controla tu privacidad y datos" (ShieldCheckIcon)
6. **Sesiones** - "Gestiona tus sesiones activas" (ComputerDesktopIcon)

**Nota**: Los componentes de tabs ya existen en `components/settings/`. Solo verificar funcionalidad.

**Archivos existentes**:
- ✅ `components/settings/ProfileTab.tsx`
- ✅ `components/settings/PasswordTab.tsx`
- ✅ `components/settings/NotificationsTab.tsx`
- ✅ `components/settings/MisDespachosTab.tsx`
- ✅ `components/settings/PrivacyTab.tsx`
- ✅ `components/settings/SessionsTab.tsx`

---

## 📊 IMPACTO EN EL CRONOGRAMA

### Sprint 1 (Actualizado)
**Antes**: Solo creación de despachos (3 tareas)  
**Ahora**: Creación de despachos + Mejoras de navegación (5 tareas)

**Tareas Sprint 1**:
1. ✅ TAREA 1.1: Mensaje en modal de importar
2. ✅ TAREA 1.2: Verificar botones existentes
3. ✅ TAREA 1.3: Formulario de creación
4. ✅ TAREA 1.4: Submenús en dashboard
5. ✅ TAREA 1.5: Tabs en configuración (verificar)

**Tiempo estimado**: 2 semanas (sin cambios)

---

## 🎯 PRIORIDADES ACTUALIZADAS

### 🔴 ALTA (Bloqueantes)
1. TAREA 1.1: Mensaje en modal de importar
2. TAREA 1.3: Formulario de creación de despacho
3. TAREA 2.1-2.4: Gestión de sedes
4. TAREA 3.1-3.3: Sincronización bidireccional

### 🟡 MEDIA (Importantes pero no bloqueantes)
1. TAREA 1.4: Submenús en dashboard
2. TAREA 1.5: Tabs en configuración
3. TAREA 3.4: Resolución de conflictos
4. TAREA 5.1-5.2: Logs y cola de sincronización

### 🟢 BAJA (Nice to have)
1. TAREA 1.2: Verificar botones (ya existe)
2. TAREA 4.1: Integración con Algolia
3. TAREA 5.3-5.4: Validación y testing

---

## 📝 NOTAS IMPORTANTES

### Schema de Sedes
La tabla `sedes` actual es **básica**. Para implementar funcionalidades avanzadas necesitarás:

**Campos a agregar** (en futuras migraciones):
```sql
-- Ubicación detallada
ALTER TABLE sedes ADD COLUMN calle VARCHAR;
ALTER TABLE sedes ADD COLUMN numero VARCHAR;
ALTER TABLE sedes ADD COLUMN piso VARCHAR;
ALTER TABLE sedes ADD COLUMN localidad VARCHAR;
ALTER TABLE sedes ADD COLUMN provincia VARCHAR;
ALTER TABLE sedes ADD COLUMN codigo_postal VARCHAR;
ALTER TABLE sedes ADD COLUMN pais VARCHAR DEFAULT 'España';

-- Estado
ALTER TABLE sedes ADD COLUMN es_principal BOOLEAN DEFAULT false;
ALTER TABLE sedes ADD COLUMN activa BOOLEAN DEFAULT true;
ALTER TABLE sedes ADD COLUMN estado_verificacion VARCHAR DEFAULT 'pendiente';
ALTER TABLE sedes ADD COLUMN sincronizado_wp BOOLEAN DEFAULT false;

-- Datos estructurados
ALTER TABLE sedes ADD COLUMN horarios JSONB;
ALTER TABLE sedes ADD COLUMN redes_sociales JSONB;
ALTER TABLE sedes ADD COLUMN direccion JSONB;

-- Profesional
ALTER TABLE sedes ADD COLUMN numero_colegiado VARCHAR;
ALTER TABLE sedes ADD COLUMN colegio VARCHAR;
ALTER TABLE sedes ADD COLUMN experiencia TEXT;
ALTER TABLE sedes ADD COLUMN areas_practica TEXT[];
ALTER TABLE sedes ADD COLUMN especialidades TEXT;
ALTER TABLE sedes ADD COLUMN servicios_especificos TEXT;

-- Multimedia
ALTER TABLE sedes ADD COLUMN foto_perfil TEXT;
ALTER TABLE sedes ADD COLUMN logo TEXT;

-- Auditoría
ALTER TABLE sedes ADD COLUMN created_at TIMESTAMP DEFAULT now();
ALTER TABLE sedes ADD COLUMN updated_at TIMESTAMP DEFAULT now();
```

### Componentes Existentes
Según el análisis del código:
- ✅ `BuscadorDespachosWordpress.tsx` - Existe (modal de importar)
- ✅ `DespachoNoEncontrado.tsx` - Existe (componente de despacho no encontrado)
- ✅ Tabs de configuración - Todos existen
- ⏳ Sidebar con submenús - Pendiente de verificar/implementar

---

## 🚀 PRÓXIMOS PASOS INMEDIATOS

### Esta Semana
1. ✅ Revisar componente `BuscadorDespachosWordpress.tsx`
2. ⏳ Implementar mensaje "¿No encuentras tu despacho?"
3. ⏳ Verificar redirección del botón "Dar de alta nuevo despacho"
4. ⏳ Comenzar formulario de creación de despacho

### Próxima Semana
1. ⏳ Implementar submenús en sidebar
2. ⏳ Verificar funcionalidad de tabs en configuración
3. ⏳ Completar formulario de creación
4. ⏳ Testing del flujo completo

---

## 📞 REFERENCIAS

**Documentos relacionados**:
- `docs/PLAN_TAREAS_DESPACHOS_SEDES.md` - Plan completo actualizado
- `docs/DATABASE_SCHEMA.md` - Schema real de la base de datos
- `docs/RESUMEN_EJECUTIVO_PLAN.md` - Resumen ejecutivo
- `docs/CONTEXTO_PROYECTO.md` - Contexto general del proyecto

**Archivos clave revisados**:
- `app/dashboard/despachos/page.tsx` (líneas 600-646)
- `app/dashboard/settings/page.tsx` (líneas 1-100)
- `components/BuscadorDespachosWordpress.tsx` (pendiente de revisar)

---

**Última actualización**: 2025-11-04 09:30  
**Actualizado por**: Cascade AI  
**Aprobado por**: Usuario
