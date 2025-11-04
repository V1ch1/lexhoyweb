# 🎨 CORRECCIONES Y MEJORAS: Gestión de Sedes y UI Global

> **Fecha**: 2025-11-04  
> **Estado**: Pendiente de implementar

---

## 📋 CORRECCIONES SOLICITADAS

### 1. ✅ Formulario de Crear Sede

#### Botón "Guardar Nueva Sede"
- **Problema**: Solo está al final del formulario
- **Solución**: Agregar botón también debajo del formulario (sticky o duplicado)
- **Prioridad**: 🟡 MEDIA

#### Campos Obligatorios
- **Problema**: Solo "Nombre" es obligatorio
- **Solución**: Hacer más campos obligatorios con lógica:

**Campos OBLIGATORIOS**:
- ✅ Nombre de la sede
- ✅ Localidad
- ✅ Provincia
- ✅ Email de contacto
- ✅ Teléfono

**Campos OPCIONALES**:
- Descripción
- Dirección completa (calle, número, piso, CP)
- Web
- Persona de contacto
- Año de fundación
- Tamaño del despacho

**Indicador**:
- Agregar texto: `* Campos obligatorios` al inicio del formulario
- Mantener asterisco rojo `*` en cada campo obligatorio
- Ocultar mensaje "Campo obligatorio" (usar validación HTML5)

---

### 2. 📸 Foto de Perfil

#### Campo de Subir Foto
- **Problema**: Falta campo para subir foto de perfil
- **Solución**: Agregar sección de "Foto de Perfil" en el formulario

**Implementación**:
```tsx
// Sección de Multimedia
<div className="border-b border-gray-200 pb-6">
  <h2 className="text-lg font-semibold text-gray-900 mb-4">
    Foto de Perfil
  </h2>
  
  <div className="flex items-center space-x-6">
    {/* Preview de la foto */}
    <div className="w-32 h-32 rounded-full bg-gray-200 overflow-hidden">
      {fotoPreview ? (
        <img src={fotoPreview} alt="Preview" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400">
          <UserIcon className="w-16 h-16" />
        </div>
      )}
    </div>
    
    {/* Input de archivo */}
    <div>
      <label className="cursor-pointer bg-white px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
        <span className="text-sm text-gray-700">Subir foto</span>
        <input
          type="file"
          accept="image/*"
          onChange={handleFotoChange}
          className="hidden"
        />
      </label>
      <p className="text-xs text-gray-500 mt-2">
        JPG, PNG o GIF. Máximo 2MB.
      </p>
    </div>
  </div>
</div>
```

**Storage**:
- Usar Supabase Storage bucket: `sedes-fotos`
- Ruta: `{despacho_id}/{sede_id}/perfil.jpg`
- Guardar URL en campo `foto_perfil` de la tabla `sedes`

---

### 3. 🏢 Sede Principal

#### Marcar Sede Principal
- **Problema**: No hay forma de marcar cuál es la sede principal
- **Solución**: Agregar checkbox "Marcar como sede principal"

**Implementación**:
```tsx
// En el formulario
<div className="flex items-center">
  <input
    type="checkbox"
    id="es_principal"
    name="es_principal"
    checked={formData.es_principal}
    onChange={handleCheckboxChange}
    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
  />
  <label htmlFor="es_principal" className="ml-2 text-sm text-gray-700">
    Marcar como sede principal
  </label>
  <span className="ml-2 text-xs text-gray-500">
    (Solo puede haber una sede principal por despacho)
  </span>
</div>
```

**Lógica**:
- Si se marca una sede como principal, desmarcar las demás automáticamente
- Trigger en base de datos para asegurar solo una sede principal
- En el listado, mostrar badge "Principal" en la sede principal

---

### 4. 🗑️ Eliminar Sede

#### Funcionalidad de Eliminación
- **Problema**: No existe funcionalidad para eliminar sedes
- **Solución**: Implementar eliminación con doble confirmación

**Flujo de Eliminación**:
```
Usuario hace clic en "Eliminar Sede"
    ↓
Modal de Confirmación 1:
"¿Estás seguro de eliminar la sede [nombre]?"
[Cancelar] [Continuar]
    ↓
Modal de Confirmación 2:
"Esta acción no se puede deshacer. Escribe 'ELIMINAR' para confirmar"
[Input de texto]
[Cancelar] [Eliminar Definitivamente]
    ↓
Validar que no es la única sede
    ↓
DELETE /api/despachos/[id]/sedes/[sedeId]
    ↓
Actualizar listado
```

**Restricciones**:
- ⚠️ **NO se puede eliminar si es la única sede**
- ⚠️ **Doble confirmación obligatoria**
- ⚠️ **Solo propietario o super_admin**

---

### 5. 🗑️ Eliminar Despacho

#### Funcionalidad de Eliminación de Despacho
- **Problema**: No existe funcionalidad para eliminar despachos
- **Solución**: Implementar eliminación con triple confirmación

**Flujo de Eliminación**:
```
Usuario hace clic en "Eliminar Despacho"
    ↓
Modal de Advertencia:
"⚠️ ATENCIÓN: Al eliminar el despacho se eliminarán:
- Todas las sedes (X sedes)
- Todos los leads asociados (X leads)
- Todo el historial
Esta acción NO se puede deshacer"
[Cancelar] [Entiendo, continuar]
    ↓
Modal de Confirmación 1:
"¿Estás completamente seguro?"
[Cancelar] [Sí, eliminar]
    ↓
Modal de Confirmación 2:
"Escribe el nombre del despacho para confirmar: [nombre]"
[Input de texto]
[Cancelar] [Eliminar Definitivamente]
    ↓
DELETE /api/despachos/[id]
    ↓
Eliminar en cascada:
  - Todas las sedes
  - Todas las relaciones user_despachos
  - Todos los leads
  - Todo el historial
    ↓
Redirigir a /dashboard
```

**Restricciones**:
- ⚠️ **Solo propietario o super_admin**
- ⚠️ **Triple confirmación obligatoria**
- ⚠️ **Eliminación en cascada**
- ⚠️ **Sincronizar eliminación con WordPress**

---

## 🎨 MEJORAS DE UI GLOBAL

### Problema Actual
- **Mezcla de estilos**: 2 tipos de diseño diferentes
- **Fuente**: PlayFair Display (elegante pero no pega con botones gruesos)
- **Botones**: Gruesos y con colores fuertes
- **Inconsistencia visual**: Falta cohesión

### Propuesta de Solución

#### 1. Sistema de Fuentes
```css
/* Fuente Principal: PlayFair Display (títulos y headings) */
--font-primary: 'Playfair Display', serif;

/* Fuente Secundaria: Inter o Poppins (cuerpo y UI) */
--font-secondary: 'Inter', sans-serif;
/* O alternativa: 'Poppins', sans-serif */

/* Uso */
h1, h2, h3 {
  font-family: var(--font-primary);
  font-weight: 600;
}

body, p, button, input {
  font-family: var(--font-secondary);
  font-weight: 400;
}
```

**Fuentes recomendadas para legibilidad**:
- ✅ **Inter**: Moderna, limpia, excelente legibilidad
- ✅ **Poppins**: Geométrica, amigable, versátil
- ✅ **Work Sans**: Profesional, clara, buena en pantallas
- ✅ **DM Sans**: Minimalista, elegante, muy legible

#### 2. Paleta de Colores Refinada
```css
/* Colores Principales (más suaves) */
--primary-50: #eff6ff;
--primary-100: #dbeafe;
--primary-200: #bfdbfe;
--primary-300: #93c5fd;
--primary-400: #60a5fa;
--primary-500: #3b82f6;  /* Azul principal */
--primary-600: #2563eb;
--primary-700: #1d4ed8;

/* Colores Secundarios */
--secondary-500: #8b5cf6;  /* Púrpura suave */
--accent-500: #f59e0b;     /* Ámbar para acentos */

/* Grises (más sutiles) */
--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-200: #e5e7eb;
--gray-300: #d1d5db;
--gray-400: #9ca3af;
--gray-500: #6b7280;
--gray-600: #4b5563;
--gray-700: #374151;
--gray-800: #1f2937;
--gray-900: #111827;
```

#### 3. Botones Refinados
```tsx
// Botón Primario (más fino)
<button className="
  px-6 py-2.5
  bg-primary-500 hover:bg-primary-600
  text-white text-sm font-medium
  rounded-lg
  transition-all duration-200
  shadow-sm hover:shadow-md
  focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
">
  Guardar
</button>

// Botón Secundario (outline)
<button className="
  px-6 py-2.5
  bg-white hover:bg-gray-50
  text-gray-700 text-sm font-medium
  border border-gray-300
  rounded-lg
  transition-all duration-200
  focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
">
  Cancelar
</button>

// Botón de Peligro (más sutil)
<button className="
  px-6 py-2.5
  bg-red-50 hover:bg-red-100
  text-red-700 text-sm font-medium
  border border-red-200
  rounded-lg
  transition-all duration-200
  focus:ring-2 focus:ring-red-500 focus:ring-offset-2
">
  Eliminar
</button>
```

#### 4. Inputs y Forms (más limpios)
```tsx
<input className="
  w-full px-4 py-2.5
  text-gray-900 text-sm
  bg-white
  border border-gray-200
  rounded-lg
  transition-all duration-200
  focus:border-primary-500 focus:ring-2 focus:ring-primary-100
  placeholder:text-gray-400
" />
```

#### 5. Cards y Contenedores
```tsx
<div className="
  bg-white
  border border-gray-100
  rounded-xl
  shadow-sm hover:shadow-md
  transition-all duration-200
  p-6
">
  {/* Contenido */}
</div>
```

---

## 📋 LISTA DE TAREAS ACTUALIZADA

### TAREA 2.2.1: Correcciones Formulario Crear Sede 🔴 ALTA
- [ ] Agregar botón "Guardar" también debajo del formulario
- [ ] Hacer más campos obligatorios (localidad, provincia, email, teléfono)
- [ ] Agregar texto "* Campos obligatorios" al inicio
- [ ] Ocultar mensaje de validación HTML5 (usar solo asterisco)
- [ ] Agregar campo de subir foto de perfil
- [ ] Implementar preview de foto
- [ ] Configurar Supabase Storage para fotos
- [ ] Agregar checkbox "Marcar como sede principal"
- [ ] Validar que solo haya una sede principal

### TAREA 2.2.2: Migración de Base de Datos 🔴 ALTA
- [ ] Aplicar migración para ampliar schema de `sedes`
- [ ] Agregar campos: ubicación, estado, multimedia, profesional
- [ ] Crear trigger para validar sede principal única
- [ ] Crear índices necesarios
- [ ] Verificar migración exitosa

### TAREA 2.4.1: Eliminar Sede 🟡 MEDIA
- [ ] Crear endpoint `DELETE /api/despachos/[id]/sedes/[sedeId]`
- [ ] Implementar validación de única sede
- [ ] Crear modal de confirmación doble
- [ ] Implementar lógica de eliminación
- [ ] Actualizar contador `num_sedes`
- [ ] Sincronizar con WordPress

### TAREA 2.5: Eliminar Despacho 🟡 MEDIA
- [ ] Crear endpoint `DELETE /api/despachos/[id]`
- [ ] Implementar eliminación en cascada (sedes, leads, historial)
- [ ] Crear modal de advertencia
- [ ] Crear modal de confirmación doble
- [ ] Validar nombre del despacho para confirmar
- [ ] Sincronizar eliminación con WordPress
- [ ] Redirigir a dashboard tras eliminar

### TAREA UI.1: Rediseño Global de UI 🟢 BAJA (pero importante)
- [ ] Instalar fuente secundaria (Inter o Poppins)
- [ ] Actualizar `tailwind.config.js` con fuentes
- [ ] Definir paleta de colores refinada
- [ ] Crear componentes de botones estandarizados
- [ ] Actualizar estilos de inputs y forms
- [ ] Actualizar estilos de cards
- [ ] Aplicar cambios globalmente
- [ ] Documentar guía de estilos

---

## 🎯 PRIORIDADES

1. **🔴 ALTA**: Correcciones formulario y migración BD
2. **🟡 MEDIA**: Funcionalidades de eliminación
3. **🟢 BAJA**: Rediseño global UI (pero muy importante para UX)

---

**Última actualización**: 2025-11-04  
**Estado**: Documentado, pendiente de implementar
