# Sistema de Sincronización de Datos: Supabase ↔ WordPress ↔ Algolia

## 📊 AUDITORÍA COMPLETA - 19 Nov 2025

---

## 1. ESTRUCTURA DE SUPABASE

### Tabla: `despachos`

| Campo | Tipo | Descripción | Requerido | Relación WordPress |
|-------|------|-------------|-----------|-------------------|
| `id` | uuid | ID único en Supabase | ✅ | - |
| `wordpress_id` | integer | ID del post en WordPress | ⚠️ | `post.ID` |
| `object_id` | text | ID del objeto en Algolia | ⚠️ | `post.ID` (como string) |
| `nombre` | text | Nombre del despacho | ✅ | `post.post_title` |
| `slug` | text | URL-friendly name | ✅ | `post.post_name` |
| `descripcion` | text | Descripción general | ❌ | `post.post_content` |
| `owner_email` | text | Email del propietario | ❌ | - |
| `featured_media_url` | text | URL imagen destacada | ❌ | `post.featured_media` |
| `status` | text | Estado activo/inactivo | ✅ | `_despacho_estado_registro` |
| `estado_publicacion` | text | publish/draft/private | ✅ | `post.post_status` |
| `estado_verificacion` | text | pendiente/verificado/rechazado | ✅ | `_despacho_estado_verificacion` |
| `num_sedes` | integer | Número de sedes | ✅ | count de `_despacho_sedes` |
| `sincronizado_wp` | boolean | ¿Sincronizado con WP? | ✅ | - |
| `ultima_sincronizacion` | timestamptz | Última sync | ❌ | - |
| `created_at` | timestamptz | Fecha creación | ✅ | `post.post_date` |
| `updated_at` | timestamptz | Fecha actualización | ✅ | `post.post_modified` |

**Valores por defecto:**
- `status`: 'active'
- `estado_publicacion`: 'publish'
- `estado_verificacion`: 'pendiente'
- `num_sedes`: 0
- `sincronizado_wp`: false

---

### Tabla: `sedes`

| Campo | Tipo | Descripción | Requerido | Relación WordPress |
|-------|------|-------------|-----------|-------------------|
| `id` | uuid | ID único en Supabase | ✅ | - |
| `despacho_id` | uuid | FK a despachos | ✅ | - |
| `wp_sede_id` | integer | Índice en array WP | ❌ | índice en `_despacho_sedes` |
| **BÁSICOS** | | | | |
| `nombre` | text | Nombre de la sede | ✅ | `sede.nombre` |
| `descripcion` | text | Descripción | ❌ | `sede.descripcion` |
| `es_principal` | boolean | ¿Es sede principal? | ✅ | `sede.es_principal` |
| `activa` | boolean | ¿Está activa? | ✅ | `sede.activa` |
| **UBICACIÓN** | | | | |
| `localidad` | text | Ciudad | ✅ | `sede.localidad` |
| `provincia` | text | Provincia | ✅ | `sede.provincia` |
| `pais` | text | País | ✅ | `sede.pais` |
| `calle` | text | Calle | ❌ | `sede.calle` |
| `numero` | text | Número | ❌ | `sede.numero` |
| `piso` | text | Piso/Planta | ❌ | `sede.piso` |
| `codigo_postal` | text | CP | ❌ | `sede.codigo_postal` |
| `direccion` | text | Dirección parseada | ❌ | calculado de `sede.direccion` |
| **CONTACTO** | | | | |
| `telefono` | text | Teléfono | ❌ | `sede.telefono` |
| `email_contacto` | text | Email | ❌ | `sede.email_contacto` o `sede.email` |
| `web` | text | Sitio web | ❌ | `sede.web` |
| `persona_contacto` | text | Persona de contacto | ❌ | `sede.persona_contacto` |
| **PROFESIONAL** | | | | |
| `numero_colegiado` | text | Nº Colegiado | ❌ | `sede.numero_colegiado` |
| `colegio` | text | Colegio profesional | ❌ | `sede.colegio` |
| `experiencia` | text | Años experiencia | ❌ | `sede.experiencia` |
| `ano_fundacion` | text | Año fundación | ❌ | `sede.ano_fundacion` o `sede.año_fundacion` |
| `tamano_despacho` | text | Tamaño | ❌ | `sede.tamano_despacho` o `sede.tamaño_despacho` |
| **SERVICIOS** | | | | |
| `areas_practica` | text[] | Áreas de práctica | ❌ | `sede.areas_practica` (array) |
| `especialidades` | text | Especialidades | ❌ | `sede.especialidades` |
| `servicios_especificos` | text | Servicios | ❌ | `sede.servicios_especificos` |
| **MULTIMEDIA** | | | | |
| `foto_perfil` | text | URL foto | ❌ | `sede.foto_perfil` |
| **ESTADO** | | | | |
| `estado_verificacion` | text | pendiente/verificado/rechazado | ✅ | `sede.estado_verificacion` |
| `estado_registro` | text | activo/inactivo | ✅ | `sede.estado_registro` |
| `is_verified` | boolean | ¿Verificado? | ✅ | `sede.is_verified` |
| **HORARIOS Y REDES** | | | | |
| `horarios` | jsonb | Horarios semana | ❌ | `sede.horarios` (objeto) |
| `redes_sociales` | jsonb | Redes sociales | ❌ | `sede.redes_sociales` (objeto) |
| **OTROS** | | | | |
| `observaciones` | text | Notas internas | ❌ | `sede.observaciones` |
| `created_at` | timestamptz | Fecha creación | ✅ | - |
| `updated_at` | timestamptz | Fecha actualización | ✅ | - |

**Valores por defecto:**
- `es_principal`: false
- `activa`: true
- `pais`: 'España'
- `estado_verificacion`: 'pendiente'
- `estado_registro`: 'activo'
- `is_verified`: false

---

## 2. ESTRUCTURA DE WORDPRESS

### Custom Post Type: `despacho`

**Post Fields:**
- `ID`: integer - ID del post
- `post_title`: string - Nombre del despacho
- `post_name`: string - Slug
- `post_content`: string - Descripción
- `post_status`: string - publish/draft/private/trash
- `post_date`: datetime - Fecha creación
- `post_modified`: datetime - Fecha modificación

**Meta Fields (Legacy - compatibilidad):**
```php
_despacho_nombre              // string - Nombre
_despacho_localidad           // string - Ciudad sede principal
_despacho_provincia           // string - Provincia sede principal
_despacho_codigo_postal       // string - CP sede principal
_despacho_direccion           // string - Dirección sede principal
_despacho_telefono            // string - Teléfono sede principal
_despacho_email               // string - Email sede principal
_despacho_web                 // string - Web sede principal
_despacho_descripcion         // string - Descripción
_despacho_numero_colegiado    // string - Nº colegiado
_despacho_colegio             // string - Colegio
_despacho_experiencia         // string - Experiencia
_despacho_tamaño              // string - Tamaño
_despacho_año_fundacion       // string - Año fundación
_despacho_foto_perfil         // string - URL foto
_despacho_horario             // array - Horarios
_despacho_redes_sociales      // array - Redes sociales
```

**Meta Fields (Nuevo sistema con sedes):**
```php
_despacho_sedes               // array serializado - Array de sedes
_despacho_estado_verificacion // string - pendiente/verificado/rechazado
_despacho_is_verified         // string - "0" o "1"
_despacho_estado_registro     // string - activo/inactivo
_algolia_object_id            // string - ID en Algolia (igual a post.ID)
```

**Estructura de una sede en `_despacho_sedes`:**
```php
array(
    'nombre' => string,
    'descripcion' => string,
    'localidad' => string,
    'provincia' => string,
    'pais' => string,
    'direccion' => string,              // Formato: "Calle Num Piso, Ciudad, Provincia, (CP)"
    'direccion_completa' => string,     // Igual que direccion
    'calle' => string,
    'numero' => string,
    'piso' => string,
    'codigo_postal' => string,
    'telefono' => string,
    'email' => string,
    'email_contacto' => string,
    'web' => string,
    'persona_contacto' => string,
    'ano_fundacion' => int|null,
    'año_fundacion' => int|null,        // Duplicado con tilde
    'tamano_despacho' => string,
    'tamaño_despacho' => string,        // Duplicado con tilde
    'numero_colegiado' => string,
    'colegio' => string,
    'experiencia' => string,
    'areas_practica' => array,          // Array de strings
    'especialidades' => string,
    'servicios_especificos' => string,
    'foto_perfil' => string,            // URL
    'logo' => string,                   // URL (duplicado)
    'horarios' => array,                // ['lunes' => '', 'martes' => '', ...]
    'redes_sociales' => array,          // ['facebook' => '', 'linkedin' => '', ...]
    'observaciones' => string,
    'es_principal' => bool,
    'activa' => bool,
    'estado_verificacion' => string,    // IMPORTANTE: Hereda del nivel despacho
    'estado_registro' => string,
    'is_verified' => bool               // IMPORTANTE: Hereda del nivel despacho
)
```

**⚠️ IMPORTANTE - Estado de Verificación:**
WordPress guarda el estado de verificación en DOS niveles:
1. **Nivel Despacho**: `_despacho_estado_verificacion` y `_despacho_is_verified`
2. **Nivel Sede**: Cada sede hereda estos valores del despacho

**Hook de Sincronización a Algolia:**
```php
add_action('save_post_despacho', array($this, 'sync_to_algolia'), 20, 3);
add_action('save_post', array($this, 'sync_to_algolia'), 20, 3);
```

⚠️ **PROBLEMA IDENTIFICADO**: El REST API de WordPress **NO dispara** estos hooks automáticamente.
Por eso cuando actualizamos desde Next.js, WordPress no sincroniza a Algolia.

---

## 3. ESTRUCTURA DE ALGOLIA

### Índice: `despachos_v3`

```javascript
{
  objectID: string,              // ID del post de WordPress (como string)
  nombre: string,                // Nombre del despacho
  descripcion: string,           // Descripción general
  slug: string,                  // Slug del despacho
  
  // ARRAY DE SEDES - ESTRUCTURA PRINCIPAL
  sedes: [
    {
      // Básicos
      nombre: string,
      descripcion: string,
      es_principal: boolean,
      activa: boolean,
      
      // Ubicación
      localidad: string,
      provincia: string,
      pais: string,
      calle: string,
      numero: string,
      piso: string,
      codigo_postal: string,
      direccion_completa: string,   // "Calle Num Piso, Ciudad, Provincia, (CP)"
      direccion: string,             // Alias de direccion_completa
      
      // Contacto
      telefono: string,
      email: string,
      email_contacto: string,
      web: string,
      persona_contacto: string,
      
      // Profesional
      numero_colegiado: string,
      colegio: string,
      experiencia: string,
      ano_fundacion: string|int,
      tamano_despacho: string,
      
      // Servicios
      areas_practica: array,        // Array de strings
      especialidades: string,
      servicios_especificos: string,
      
      // Multimedia
      foto_perfil: string,          // URL
      logo: string,                 // URL (duplicado)
      
      // Horarios y redes
      horarios: object,             // {lunes: '', martes: '', ...}
      redes_sociales: object,       // {facebook: '', linkedin: '', ...}
      
      // Estado
      estado_verificacion: string,  // ⚠️ IMPORTANTE: pendiente/verificado/rechazado
      estado_registro: string,      // activo/inactivo
      is_verified: boolean,         // ⚠️ IMPORTANTE: true/false
      observaciones: string
    }
  ],
  
  // Metadatos
  num_sedes: int,                  // Cantidad de sedes
  areas_practica: array,           // Áreas de práctica (nivel despacho)
  ultima_actualizacion: string     // Fecha en formato DD-MM-YYYY
}
```

**⚠️ CAMPOS CRÍTICOS PARA VERIFICACIÓN:**
```javascript
// ❌ INCORRECTO - No poner a nivel raíz
{
  objectID: "68822",
  estado_verificacion: "verificado",  // ❌ NO
  is_verified: true,                  // ❌ NO
  sedes: [...]
}

// ✅ CORRECTO - Poner dentro de cada sede
{
  objectID: "68822",
  sedes: [
    {
      nombre: "Sede A Coruña",
      estado_verificacion: "verificado",  // ✅ SÍ
      is_verified: true,                  // ✅ SÍ
      ...
    }
  ]
}
```

---

## 4. FLUJO DE SINCRONIZACIÓN ACTUAL

### 4.1 Next.js → WordPress → Algolia

```
┌─────────────┐
│   Next.js   │
│  (Supabase) │
└──────┬──────┘
       │ 1. PUT /api/despachos/[id]/verificacion
       │    - Actualiza Supabase
       │
       ▼
┌──────────────────┐
│   syncService    │
│ .enviarDespacho  │
│  AWordPress()    │
└──────┬───────────┘
       │ 2. PUT /wp-json/wp/v2/despacho/{id}
       │    - Actualiza post fields
       │    - Actualiza meta fields
       │    - ⚠️ NO dispara save_post hook
       │
       ▼
┌──────────────────┐
│    WordPress     │
│  (Post + Meta)   │
└──────────────────┘
       │
       │ ❌ NO SE EJECUTA AUTOMÁTICAMENTE
       │
       ▼
┌──────────────────┐
│     Algolia      │
│  (NO syncado)    │
└──────────────────┘
```

### 4.2 Solución Implementada: Sincronización Directa

```
┌─────────────┐
│   Next.js   │
│  (Supabase) │
└──────┬──────┘
       │ 1. PUT /api/despachos/[id]/verificacion
       │    - Actualiza Supabase
       │
       ├────────────────────────┬─────────────────────┐
       │                        │                     │
       ▼                        ▼                     ▼
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│   syncService    │   │   syncService    │   │     Algolia      │
│ .enviarDespacho  │   │ .sincronizarCon  │   │                  │
│  AWordPress()    │   │    Algolia()     │   │                  │
└──────┬───────────┘   └──────┬───────────┘   └──────────────────┘
       │                      │
       │ 2. PUT WP API        │ 3. GET registro actual
       ▼                      │ 4. Modificar solo verificación
┌──────────────────┐         │ 5. PUT registro completo
│    WordPress     │         │
│  (Post + Meta)   │         ▼
└──────────────────┘   ┌──────────────────┐
                       │     Algolia      │
                       │   (sincronizado) │
                       └──────────────────┘
```

---

## 5. PROBLEMAS IDENTIFICADOS Y SOLUCIONES

### ❌ Problema 1: WordPress REST API no dispara hooks
**Causa**: `save_post` hook no se ejecuta en actualizaciones via REST API
**Impacto**: Algolia no se sincroniza automáticamente
**Solución**: Sincronización directa desde Next.js a Algolia

### ❌ Problema 2: Partial update de Algolia sobrescribe arrays
**Causa**: API de Algolia reemplaza arrays completos en partial updates
**Impacto**: Se perdían todas las sedes excepto los campos actualizados
**Solución**: GET completo → modificar campos → PUT completo

### ❌ Problema 3: Confusión entre niveles de verificación
**Causa**: WordPress guarda verificación a nivel despacho, Algolia a nivel sede
**Impacto**: Inconsistencias en la visualización
**Solución**: El estado del despacho se propaga a todas sus sedes

### ❌ Problema 4: Campos duplicados con y sin tilde
**Causa**: WordPress tiene `año_fundacion` y `ano_fundacion`
**Impacto**: Posible pérdida de datos
**Solución**: Sincronizar ambos campos siempre

---

## 6. CÓDIGO CRÍTICO A REVISAR

### Archivos que necesitan auditoría:
1. ✅ `lib/syncService.ts` - Servicio principal de sincronización
2. ⚠️ `app/api/despachos/[id]/verificacion/route.ts` - Endpoint de verificación
3. ⚠️ `app/api/despachos/[id]/estado/route.ts` - Endpoint de estado
4. ⚠️ `app/api/despachos/wordpress/importar/route.ts` - Importación desde WP
5. ⚠️ `app/api/webhook/route.ts` - Webhook desde WordPress

---

## 7. VARIABLES DE ENTORNO REQUERIDAS

### Producción (Vercel):
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://oepcitgbnqylfpdryffx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[key]
SUPABASE_SERVICE_ROLE_KEY=[key]

# WordPress
WORDPRESS_USERNAME=[username]
WORDPRESS_APPLICATION_PASSWORD=[password]

# Algolia
NEXT_PUBLIC_ALGOLIA_APP_ID=GA06AGLT12
ALGOLIA_ADMIN_API_KEY=8d1f0f18a513a67193fe45cf14e9cfc7
NEXT_PUBLIC_ALGOLIA_INDEX=despachos_v3
```

---

## 8. PRÓXIMOS PASOS

1. ✅ Documentar estructura completa
2. ⏳ Revisar y corregir `syncService.ts`
3. ⏳ Revisar endpoints de API
4. ⏳ Crear tests de sincronización
5. ⏳ Agregar validaciones de datos
6. ⏳ Implementar rollback en caso de error
7. ⏳ Documentar casos edge

---

**Última actualización**: 19 Nov 2025
**Estado**: En auditoría 🔍
