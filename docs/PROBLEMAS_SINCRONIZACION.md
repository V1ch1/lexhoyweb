# Análisis del Código de Sincronización - Problemas Identificados

## 📋 AUDITORÍA DEL CÓDIGO - 19 Nov 2025

---

## ARCHIVO: `lib/syncService.ts`

### ✅ LO QUE ESTÁ BIEN

1. **Estructura de clases**: Bien organizado con métodos estáticos
2. **Manejo de errores**: Try-catch en todos los métodos
3. **Logging**: Buenos console.log para debugging
4. **Sincronización con Algolia**: Correcta - GET completo, modificar, PUT completo

### ❌ PROBLEMAS CRÍTICOS ENCONTRADOS

#### Problema 1: `enviarDespachoAWordPress()` - Líneas 494-498
```typescript
// ❌ INCORRECTO
return {
  nombre: sede.nombre || "",
  // ...
  estado_verificacion: "pendiente",  // ⚠️ HARDCODED
  estado_registro: "activo",
  is_verified: false,                 // ⚠️ HARDCODED
};
```

**Issue**: Sobrescribe el estado de verificación del despacho con valores hardcoded
**Impacto**: Cuando actualizamos la verificación desde Next.js, WordPress recibe "pendiente"
**Solución**: Usar el estado del despacho

#### Problema 2: Falta mapeo completo de campos de Supabase

**Missing en `importarDespachoDesdeWordPress`**:
- No captura `estado_publicacion` del post
- No captura `estado_verificacion` de meta
- No captura `wordpress_id` (solo `object_id`)
- No actualiza `num_sedes` correctamente

**Missing en `enviarDespachoAWordPress`**:
- No sincroniza todos los campos de estado de las sedes
- No valida que el despacho tenga sedes antes de enviar

#### Problema 3: Lógica de importación de sedes incompleta

```typescript
// Línea 285 - Parsing de dirección
if (sede.direccion && !calle) {
  // Solo parsea si NO hay calle
  // ⚠️ Pero WordPress puede tener ambos
}
```

**Issue**: Si WordPress tiene `calle` Y `direccion`, ignora el parsing
**Solución**: Siempre preferir campos separados si existen

#### Problema 4: Sincronización de verificación inconsistente

En `enviarDespachoAWordPress`, las sedes en el payload tienen:
```typescript
estado_verificacion: "pendiente",  // ❌ Siempre pendiente
is_verified: false,                // ❌ Siempre false
```

Pero debería ser:
```typescript
estado_verificacion: despacho.estado_verificacion,  // ✅ Del despacho
is_verified: despacho.estado_verificacion === "verificado",  // ✅ Calculado
```

---

## CORRECCIONES NECESARIAS

### 1. Corregir `enviarDespachoAWordPress()` - Payload de sedes

**ANTES:**
```typescript
_despacho_sedes:
  despacho.sedes?.map((sede: Sede) => {
    // ...
    return {
      // ... otros campos
      estado_verificacion: "pendiente",  // ❌
      estado_registro: "activo",
      is_verified: false,  // ❌
    };
  }) || [],
```

**DESPUÉS:**
```typescript
_despacho_sedes:
  despacho.sedes?.map((sede: Sede) => {
    // ...
    return {
      // ... otros campos
      estado_verificacion: despacho.estado_verificacion || "pendiente",  // ✅
      estado_registro: sede.estado_registro || "activo",
      is_verified: despacho.estado_verificacion === "verificado",  // ✅
    };
  }) || [],
```

### 2. Mejorar `importarDespachoDesdeWordPress()`

Agregar:
```typescript
const { data: created, error: createError } = await supabase
  .from("despachos")
  .insert({
    object_id: objectId,
    wordpress_id: parseInt(objectId),  // ✅ Agregar
    nombre,
    slug,
    status: despachoWP.status === "publish" ? "active" : "inactive",  // ✅ Mapear
    estado_publicacion: despachoWP.status || "draft",  // ✅ Agregar
    estado_verificacion: despachoWP.meta?._despacho_estado_verificacion || "pendiente",  // ✅ Agregar
  })
  .select("id")
  .single();
```

### 3. Mejorar `importarSedes()`

Agregar manejo de estado de verificación:
```typescript
const { error: sedeError } = await supabase.from("sedes").insert({
  // ... otros campos
  estado_verificacion: sede.estado_verificacion || "pendiente",  // ✅ Del WP
  estado_registro: sede.estado_registro || "activo",
  is_verified: sede.is_verified || false,  // ✅ Del WP
});
```

### 4. Validación de datos antes de enviar

Agregar al inicio de `enviarDespachoAWordPress`:
```typescript
// Validar que el despacho tenga al menos una sede
if (!despacho.sedes || despacho.sedes.length === 0) {
  console.warn("⚠️ Despacho sin sedes, creando sede por defecto...");
  // Crear una sede mínima con los datos del despacho
}

// Validar campos requeridos
if (!despacho.nombre || !despacho.slug) {
  throw new Error("Despacho sin nombre o slug");
}
```

---

## FLUJO CORRECTO DE VERIFICACIÓN

### Estado Actual (ROTO):
```
1. Usuario cambia verificación en Next.js a "verificado"
2. Next.js actualiza Supabase: estado_verificacion = "verificado" ✅
3. Next.js envía a WordPress con sedes.estado_verificacion = "pendiente" ❌
4. WordPress guarda _despacho_estado_verificacion = "verificado" ✅
5. WordPress guarda _despacho_sedes[].estado_verificacion = "pendiente" ❌
6. Next.js sincroniza con Algolia usando "verificado" ✅
7. Resultado: WordPress inconsistente, Algolia correcto
```

### Flujo Correcto (A IMPLEMENTAR):
```
1. Usuario cambia verificación en Next.js a "verificado"
2. Next.js actualiza Supabase: estado_verificacion = "verificado" ✅
3. Next.js envía a WordPress:
   - _despacho_estado_verificacion = "verificado" ✅
   - _despacho_sedes[].estado_verificacion = "verificado" ✅
   - _despacho_sedes[].is_verified = true ✅
4. WordPress guarda todo correctamente ✅
5. Next.js sincroniza con Algolia:
   - sedes[].estado_verificacion = "verificado" ✅
   - sedes[].is_verified = true ✅
6. Resultado: Todo consistente ✅
```

---

## CÓDIGO CORREGIDO LISTO PARA IMPLEMENTAR

Ver archivo: `lib/syncService.FIXED.ts` (próximo paso)

---

## TESTS NECESARIOS

1. **Test de creación**:
   - Crear despacho en Next.js
   - Verificar que se crea en WordPress
   - Verificar que se crea en Algolia
   - Validar campos en todos los sistemas

2. **Test de actualización de verificación**:
   - Cambiar de "pendiente" a "verificado"
   - Validar Supabase
   - Validar WordPress (REST API)
   - Validar Algolia
   - Validar sitio público

3. **Test de importación desde WordPress**:
   - Crear despacho en WordPress
   - Importar a Next.js
   - Validar todos los campos

4. **Test de sincronización bidireccional**:
   - Actualizar en Next.js → verificar WordPress
   - Actualizar en WordPress → verificar Next.js (webhook)

---

**Estado**: Problemas identificados, soluciones propuestas
**Próximo paso**: Implementar correcciones en `syncService.ts`
