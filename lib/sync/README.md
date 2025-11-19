# Sistema de Sincronización Modular

Este documento describe el nuevo sistema de sincronización diseñado para mantener datos consistentes entre **Supabase**, **WordPress** y **Algolia**.

## 📁 Estructura

```
lib/sync/
├── types.ts          # Interfaces y tipos compartidos
├── supabase.ts       # Operaciones con Supabase
├── wordpress.ts      # Operaciones con WordPress REST API
├── algolia.ts        # Operaciones con Algolia Search API
└── index.ts          # Orchestrator principal
```

## 🎯 Principios de Diseño

### Separación de Responsabilidades
Cada módulo tiene una única responsabilidad:
- **supabase.ts**: Solo lectura/escritura de Supabase
- **wordpress.ts**: Solo envío/recepción de WordPress
- **algolia.ts**: Solo sincronización con Algolia
- **index.ts**: Solo orquestación del flujo completo

### Manejo de Errores Robusto
- Cada operación retorna `SyncResult` con `success` booleano
- Los errores se capturan y reportan sin romper el flujo
- Logs detallados en cada paso para debugging

### Prevención de Pérdida de Datos
- **Algolia**: GET completo → modificar → PUT completo (nunca partial update)
- **WordPress**: Validación de datos antes de enviar
- **Sedes**: Siempre se envían todas las sedes, nunca arrays parciales

## 🔄 Flujo de Sincronización

```
┌─────────────────────────────────────────────────────────┐
│                   FLUJO COMPLETO                         │
└─────────────────────────────────────────────────────────┘

1. 📊 Supabase
   ├── Obtener despacho completo
   └── Obtener todas las sedes (query separada)
        ↓
2. 📤 WordPress
   ├── Construir payload con todas las sedes
   ├── Aplicar estado_verificacion del DESPACHO a cada sede
   └── PUT/POST a WordPress REST API
        ↓
3. 🔍 Algolia
   ├── GET registro completo actual
   ├── Modificar solo campos de verificación en sedes
   └── PUT registro completo de vuelta
        ↓
4. ✅ Actualizar IDs en Supabase
```

## 📋 Uso

### Orchestrator Principal

```typescript
import { SyncOrchestrator } from '@/lib/sync';

// Sincronización completa
const result = await SyncOrchestrator.sincronizarCompleto(despachoId, forzarEstado);

// Solo actualizar verificación
const result = await SyncOrchestrator.actualizarVerificacion(despachoId, 'verificado');
```

### Módulos Individuales

```typescript
import { SupabaseSync } from '@/lib/sync/supabase';
import { WordPressSync } from '@/lib/sync/wordpress';
import { AlgoliaSync } from '@/lib/sync/algolia';

// Obtener despacho completo desde Supabase
const despacho = await SupabaseSync.getDespachoCompleto(despachoId);

// Enviar a WordPress
const wpResult = await WordPressSync.enviarDespacho(despacho);

// Sincronizar con Algolia
const algoliaResult = await AlgoliaSync.sincronizarDespacho(despacho, objectId);
```

## 🛠️ Scripts de Utilidad

### Script Standalone de Sincronización
```bash
node scripts/sync-vento-standalone.mjs
```
- No requiere servidor Next.js corriendo
- Sincroniza directamente usando fetch API
- Útil para debugging y sincronizaciones manuales

### Script de Verificación
```bash
node scripts/test-sincronizacion.js
```
- Verifica consistencia entre WordPress y Algolia
- Compara estados de verificación
- Reporta inconsistencias

## 🔐 Variables de Entorno Requeridas

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# WordPress
WORDPRESS_API_URL=https://lexhoy.com/wp-json/wp/v2/despacho
WORDPRESS_USERNAME=admin
WORDPRESS_APPLICATION_PASSWORD=xxx

# Algolia
NEXT_PUBLIC_ALGOLIA_APP_ID=GA06AGLT12
ALGOLIA_ADMIN_API_KEY=xxx
NEXT_PUBLIC_ALGOLIA_INDEX=despachos_v3
```

## ⚠️ Consideraciones Críticas

### Estado de Verificación
El `estado_verificacion` se almacena a nivel de **despacho** en Supabase, pero WordPress lo necesita en **cada sede**. El sistema propaga automáticamente:

```typescript
// ❌ INCORRECTO (versión anterior)
estado_verificacion: "pendiente", // hardcoded

// ✅ CORRECTO (versión actual)
estado_verificacion: despacho.estado_verificacion || "pendiente"
```

### WordPress Meta Fields
WordPress almacena las sedes como **string serializado PHP**:
```
_despacho_sedes: "a:3:{i:0;a:34:{...}}"  // Array serializado con 3 elementos
```

El REST API lo deserializa automáticamente, pero los scripts deben usar `php-serialize` para procesarlo.

### Algolia Partial Updates
**NUNCA usar partial updates en Algolia** cuando se trabaja con arrays:

```typescript
// ❌ PELIGRO: Sobreescribe todo el registro
await algolia.partialUpdateObject({ objectID, estado_verificacion: 'verificado' });

// ✅ CORRECTO: GET completo, modificar, PUT completo
const current = await algolia.getObject(objectID);
current.sedes = current.sedes.map(s => ({ ...s, estado_verificacion: 'verificado' }));
await algolia.saveObject(current);
```

## 🐛 Debugging

### Logs Detallados
Cada módulo imprime logs con emojis para fácil identificación:

```
📊 = Supabase operations
📤 = WordPress operations
🔍 = Algolia operations
✅ = Success
❌ = Error
⚠️ = Warning
```

### Verificar Estado Actual

#### Supabase
```bash
$headers = @{'apikey'='xxx'}
Invoke-RestMethod -Uri 'https://xxx.supabase.co/rest/v1/despachos?id=eq.xxx' -Headers $headers
```

#### WordPress
```bash
Invoke-RestMethod -Uri 'https://lexhoy.com/wp-json/wp/v2/despacho/74971'
```

#### Algolia
```bash
$headers = @{'X-Algolia-API-Key'='xxx'; 'X-Algolia-Application-Id'='GA06AGLT12'}
Invoke-RestMethod -Uri 'https://GA06AGLT12-dsn.algolia.net/1/indexes/despachos_v3/74971' -Headers $headers
```

## 📝 Ejemplo Completo

```typescript
// En un endpoint API o script
import { SyncOrchestrator } from '@/lib/sync';

export async function POST(request: Request) {
  const { despachoId, estadoVerificacion } = await request.json();
  
  // Opción 1: Actualizar solo verificación (más común)
  const result = await SyncOrchestrator.actualizarVerificacion(
    despachoId,
    estadoVerificacion
  );
  
  // Opción 2: Sincronización completa (cambios mayores)
  // const result = await SyncOrchestrator.sincronizarCompleto(despachoId, false);
  
  if (!result.success) {
    return Response.json({ error: result.error }, { status: 500 });
  }
  
  return Response.json({
    message: 'Sincronizado correctamente',
    wordpressId: result.wordpressId,
    objectId: result.objectId
  });
}
```

## 🔄 Migración desde syncService.ts

El antiguo `lib/syncService.ts` sigue funcionando pero está **deprecated**. Para migrar:

### Antes (syncService.ts)
```typescript
import { SyncService } from '@/lib/syncService';

const result = await SyncService.enviarDespachoAWordPress(despachoId, false);
await SyncService.sincronizarConAlgolia(despachoId, result.objectId);
```

### Después (nuevo sistema)
```typescript
import { SyncOrchestrator } from '@/lib/sync';

const result = await SyncOrchestrator.sincronizarCompleto(despachoId, false);
// Ya incluye WordPress + Algolia automáticamente
```

## 📚 Referencias

- [Documentación Supabase REST API](https://supabase.com/docs/guides/api)
- [Documentación WordPress REST API](https://developer.wordpress.org/rest-api/)
- [Documentación Algolia REST API](https://www.algolia.com/doc/rest-api/search/)
- Ver también: `docs/SINCRONIZACION_DATOS.md` para mapeo completo de campos
- Ver también: `docs/PROBLEMAS_SINCRONIZACION.md` para problemas conocidos resueltos
